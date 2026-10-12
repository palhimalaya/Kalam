export interface BlueprintResult {
  ok: boolean;
  sum: number;
  message: string;
}

export function blueprintSum(weights: Record<string, number>): number {
  return Object.values(weights).reduce((total, value) => total + value, 0);
}

export function validateBlueprint(weights: Record<string, number>, totalMarks: number): BlueprintResult {
  const sum = blueprintSum(weights);
  if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
    return { ok: false, sum, message: "Total marks must be a positive number." };
  }
  for (const [code, value] of Object.entries(weights)) {
    if (!Number.isInteger(value) || value < 0) {
      return { ok: false, sum, message: `${code} must be a whole number of marks, zero or greater.` };
    }
  }
  if (sum !== totalMarks) {
    return {
      ok: false,
      sum,
      message: `Blueprint totals ${sum}, expected ${totalMarks}.`,
    };
  }
  return { ok: true, sum, message: `Blueprint totals ${sum}.` };
}

export function validateDifficultyWeights(weights: { easy: number; medium: number; hard: number }): string | null {
  const sum = weights.easy + weights.medium + weights.hard;
  if (weights.easy < 0 || weights.medium < 0 || weights.hard < 0) {
    return "Difficulty weights cannot be negative.";
  }
  if (Math.abs(sum - 1) > 0.001) {
    return "Difficulty weights must add up to 1.";
  }
  return null;
}
