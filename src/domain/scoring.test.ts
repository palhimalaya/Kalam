import { describe, expect, it } from "vitest";
import { scoreAttempt } from "@/domain/scoring";

const rules = { marksPerCorrect: 1, penaltyPerWrong: 0.2, skippedMarks: 0 };

describe("scoreAttempt", () => {
  const correct = new Map([
    ["q1", "A" as const],
    ["q2", "B" as const],
    ["q3", "C" as const],
    ["q4", "D" as const],
  ]);

  it("scores correct, wrong, and skipped answers", () => {
    const result = scoreAttempt(
      rules,
      [
        { questionId: "q1", chosenOption: "A" },
        { questionId: "q2", chosenOption: "A" },
        { questionId: "q3", chosenOption: null },
        { questionId: "q4", chosenOption: "D" },
      ],
      correct,
    );
    expect(result).toMatchObject({
      correctCount: 2,
      wrongCount: 1,
      skippedCount: 1,
      rawScore: 2,
      penaltyMarks: 0.2,
      netScore: 1.8,
    });
  });

  it("changes the penalty when the template changes", () => {
    const items = [
      { questionId: "q1", chosenOption: "A" as const },
      { questionId: "q2", chosenOption: "A" as const },
    ];
    const first = scoreAttempt(rules, items, correct);
    const second = scoreAttempt({ ...rules, penaltyPerWrong: 0.5 }, items, correct);
    expect(first.netScore).toBe(0.8);
    expect(second.netScore).toBe(0.5);
  });

  it("keeps a historical snapshot independent of later settings", () => {
    const snapshot = { marksPerCorrect: 1, penaltyPerWrong: 0.2, skippedMarks: 0 };
    const laterSettings = { marksPerCorrect: 2, penaltyPerWrong: 0, skippedMarks: 0 };
    const items = [{ questionId: "q1", chosenOption: "B" as const }];
    const historical = scoreAttempt(snapshot, items, correct);
    expect(scoreAttempt(laterSettings, items, correct).netScore).not.toBe(historical.netScore);
    expect(historical.netScore).toBe(-0.2);
    expect(snapshot.penaltyPerWrong).toBe(0.2);
  });

  it("shows a negative net score without clamping", () => {
    const result = scoreAttempt(
      rules,
      [
        { questionId: "q1", chosenOption: "B" },
        { questionId: "q2", chosenOption: "A" },
      ],
      correct,
    );
    expect(result.netScore).toBeCloseTo(-0.4);
  });
});
