import type { Attempt, AttemptItem } from "@/domain/types";

export interface QuestionHistory {
  seen: Set<string>;
  latestCorrect: Map<string, boolean>;
}

export function buildQuestionHistory(attempts: readonly Attempt[], items: readonly AttemptItem[]): QuestionHistory {
  const finished = new Map(attempts.filter((attempt) => attempt.status !== "in_progress").map((attempt) => [attempt.id, attempt]));
  const ordered = items
    .filter((item) => finished.has(item.attemptId))
    .slice()
    .sort((a, b) => {
      const aTime = a.answeredAt ?? finished.get(a.attemptId)?.submittedAt ?? "";
      const bTime = b.answeredAt ?? finished.get(b.attemptId)?.submittedAt ?? "";
      return aTime.localeCompare(bTime);
    });

  const seen = new Set<string>();
  const latestCorrect = new Map<string, boolean>();
  for (const item of ordered) {
    seen.add(item.questionId);
    if (typeof item.isCorrect === "boolean") latestCorrect.set(item.questionId, item.isCorrect);
  }
  return { seen, latestCorrect };
}

export function preferenceRank(questionId: string, history: QuestionHistory): number {
  if (!history.seen.has(questionId)) return 0;
  if (history.latestCorrect.get(questionId) === false) return 1;
  return 2;
}
