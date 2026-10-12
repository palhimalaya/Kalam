export function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function scheduleAfterResult(
  previousStage: number | null,
  correct: boolean,
  intervals: readonly number[],
  now: Date,
): { stage: number; dueAt: Date } {
  const safe = intervals.length > 0 ? intervals : [1];
  if (!correct || previousStage === null) {
    return { stage: 0, dueAt: addDays(now, safe[0] ?? 1) };
  }
  const stage = Math.min(previousStage + 1, safe.length - 1);
  return { stage, dueAt: addDays(now, safe[stage] ?? 1) };
}
