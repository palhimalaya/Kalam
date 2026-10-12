import { isPracticeEligible } from "@/domain/eligibility";
import { preferenceRank, type QuestionHistory } from "@/domain/history";
import { hashSeed, mulberry32, seededShuffle } from "@/domain/random";
import { TOPIC_ORDER, type Difficulty, type DifficultyWeights, type Question } from "@/domain/types";

export interface TopicGap {
  code: string;
  title: string;
  needed: number;
  available: number;
}

export interface SelectionSuccess {
  ok: true;
  questionIds: string[];
  warnings: string[];
}

export interface SelectionFailure {
  ok: false;
  questionIds: string[];
  gaps: TopicGap[];
  warnings: string[];
}

export type SelectionResult = SelectionSuccess | SelectionFailure;

interface NodeRef {
  id: string;
  code: string;
  title: string;
}

function quotasFor(count: number, weights: DifficultyWeights): Record<Difficulty, number> {
  let easy = Math.round(count * weights.easy);
  let hard = Math.round(count * weights.hard);
  let medium = count - easy - hard;
  while (medium < 0 && easy > 0) {
    easy -= 1;
    medium += 1;
  }
  while (medium < 0 && hard > 0) {
    hard -= 1;
    medium += 1;
  }
  if (medium < 0) medium = 0;
  return { easy, medium, hard, unknown: 0 };
}

function takeFromTier(
  tier: Question[],
  want: number,
  quotas: Record<Difficulty, number>,
  picked: Question[],
): Question[] {
  const pool = [...tier];
  const taken: Question[] = [];
  const countOf = (difficulty: Difficulty) =>
    picked.filter((question) => question.difficulty === difficulty).length +
    taken.filter((question) => question.difficulty === difficulty).length;

  while (taken.length < want && pool.length > 0) {
    const neededDifficulty = (Object.keys(quotas) as Difficulty[]).find(
      (difficulty) => difficulty !== "unknown" && countOf(difficulty) < quotas[difficulty],
    );
    let index = neededDifficulty ? pool.findIndex((question) => question.difficulty === neededDifficulty) : -1;
    if (index < 0) index = 0;
    const [next] = pool.splice(index, 1);
    if (next) taken.push(next);
  }
  return taken;
}

function selectFromPool(
  pool: Question[],
  count: number,
  weights: DifficultyWeights,
  history: QuestionHistory,
  rng: () => number,
): { picked: Question[]; warnings: string[] } {
  const quotas = quotasFor(count, weights);
  const picked: Question[] = [];
  for (const rank of [0, 1, 2]) {
    if (picked.length >= count) break;
    const tier = seededShuffle(
      pool.filter((question) => preferenceRank(question.id, history) === rank && !picked.includes(question)),
      rng,
    );
    picked.push(...takeFromTier(tier, count - picked.length, quotas, picked));
  }

  const warnings: string[] = [];
  (["easy", "medium", "hard"] as const).forEach((difficulty) => {
    const have = picked.filter((question) => question.difficulty === difficulty).length;
    if (have < quotas[difficulty]) {
      warnings.push(
        `Difficulty mix is short on ${difficulty}: wanted about ${quotas[difficulty]}, selected ${have}.`,
      );
    }
  });
  return { picked, warnings };
}

function orderedCodes(weights: Record<string, number>): string[] {
  const known = TOPIC_ORDER.filter((code) => (weights[code] ?? 0) > 0);
  const extra = Object.keys(weights)
    .filter((code) => !TOPIC_ORDER.includes(code as (typeof TOPIC_ORDER)[number]) && (weights[code] ?? 0) > 0)
    .sort();
  return [...known, ...extra];
}

export function selectMockQuestions(args: {
  topicWeights: Record<string, number>;
  difficultyWeights: DifficultyWeights;
  questions: readonly Question[];
  nodes: readonly NodeRef[];
  history: QuestionHistory;
  seed: string;
}): SelectionResult {
  const rng = mulberry32(hashSeed(args.seed));
  const nodeById = new Map(args.nodes.map((node) => [node.id, node]));
  const eligible = args.questions.filter(isPracticeEligible);
  const gaps: TopicGap[] = [];
  const warnings: string[] = [];
  const questionIds: string[] = [];
  const used = new Set<string>();

  for (const code of orderedCodes(args.topicWeights)) {
    const needed = args.topicWeights[code] ?? 0;
    const node = args.nodes.find((item) => item.code === code);
    const pool = eligible.filter((question) => {
      if (used.has(question.id)) return false;
      return nodeById.get(question.nodeId)?.code === code;
    });
    if (pool.length < needed) {
      gaps.push({
        code,
        title: node?.title ?? code,
        needed,
        available: pool.length,
      });
      continue;
    }
    const { picked, warnings: topicWarnings } = selectFromPool(pool, needed, args.difficultyWeights, args.history, rng);
    if (picked.length < needed) {
      gaps.push({ code, title: node?.title ?? code, needed, available: picked.length });
      continue;
    }
    for (const question of picked) {
      used.add(question.id);
      questionIds.push(question.id);
    }
    warnings.push(...topicWarnings.map((warning) => `${code}: ${warning}`));
  }

  if (gaps.length > 0) {
    return { ok: false, questionIds: [], gaps, warnings };
  }
  return { ok: true, questionIds, warnings };
}

export function selectPracticeQuestions(args: {
  questions: readonly Question[];
  nodeIds: readonly string[] | null;
  questionIds: readonly string[] | null;
  difficulty: Difficulty | "any";
  unseenOnly: boolean;
  incorrectOnly: boolean;
  bookmarkedOnly: boolean;
  bookmarkIds: ReadonlySet<string>;
  count: number;
  history: QuestionHistory;
  seed: string;
}): { questionIds: string[]; warnings: string[] } {
  const rng = mulberry32(hashSeed(args.seed));
  let pool = args.questions.filter(isPracticeEligible);
  if (args.questionIds) {
    const wanted = new Set(args.questionIds);
    pool = args.questionIds
      .map((id) => pool.find((question) => question.id === id))
      .filter((question): question is Question => Boolean(question && wanted.has(question.id)));
    return { questionIds: pool.map((question) => question.id), warnings: [] };
  }
  if (args.nodeIds && args.nodeIds.length > 0) {
    const nodes = new Set(args.nodeIds);
    pool = pool.filter((question) => nodes.has(question.nodeId));
  }
  if (args.difficulty !== "any") pool = pool.filter((question) => question.difficulty === args.difficulty);
  if (args.unseenOnly) pool = pool.filter((question) => !args.history.seen.has(question.id));
  if (args.incorrectOnly) pool = pool.filter((question) => args.history.latestCorrect.get(question.id) === false);
  if (args.bookmarkedOnly) pool = pool.filter((question) => args.bookmarkIds.has(question.id));

  const { picked, warnings } = selectFromPool(pool, Math.max(0, args.count), { easy: 0.3, medium: 0.5, hard: 0.2 }, args.history, rng);
  if (picked.length < args.count) {
    warnings.unshift(`Only ${picked.length} matching questions are available.`);
  }
  return { questionIds: picked.map((question) => question.id), warnings };
}
