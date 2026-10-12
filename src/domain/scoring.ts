import type { OptionKey } from "@/domain/types";

export interface ScoringRules {
  marksPerCorrect: number;
  penaltyPerWrong: number;
  skippedMarks: number;
}

export interface ScoreItemInput {
  questionId: string;
  chosenOption: OptionKey | null;
}

export type ItemOutcome = "correct" | "wrong" | "skipped";

export interface ItemImpact {
  questionId: string;
  outcome: ItemOutcome;
  impact: number;
}

export interface ScoreResult {
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  rawScore: number;
  penaltyMarks: number;
  netScore: number;
  itemImpacts: ItemImpact[];
}

export function scoreAttempt(
  rules: ScoringRules,
  items: readonly ScoreItemInput[],
  correctById: ReadonlyMap<string, OptionKey>,
): ScoreResult {
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  const itemImpacts: ItemImpact[] = [];

  for (const item of items) {
    const correct = correctById.get(item.questionId);
    if (!item.chosenOption || !correct) {
      skippedCount += 1;
      itemImpacts.push({
        questionId: item.questionId,
        outcome: "skipped",
        impact: rules.skippedMarks,
      });
      continue;
    }
    if (item.chosenOption === correct) {
      correctCount += 1;
      itemImpacts.push({
        questionId: item.questionId,
        outcome: "correct",
        impact: rules.marksPerCorrect,
      });
    } else {
      wrongCount += 1;
      itemImpacts.push({
        questionId: item.questionId,
        outcome: "wrong",
        impact: -rules.penaltyPerWrong,
      });
    }
  }

  const rawScore = correctCount * rules.marksPerCorrect;
  const penaltyMarks = wrongCount * rules.penaltyPerWrong;
  const netScore = rawScore - penaltyMarks + skippedCount * rules.skippedMarks;

  return {
    correctCount,
    wrongCount,
    skippedCount,
    rawScore,
    penaltyMarks,
    netScore,
    itemImpacts,
  };
}

export function accuracy(correct: number, wrong: number): number | null {
  const answered = correct + wrong;
  if (answered <= 0) return null;
  return correct / answered;
}
