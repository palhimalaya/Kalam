import { describe, expect, it } from "vitest";
import { scheduleAfterResult } from "@/domain/revision";

describe("scheduleAfterResult", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");
  const intervals = [1, 3, 7, 21];

  it("starts a wrong answer at the first interval", () => {
    const next = scheduleAfterResult(null, false, intervals, now);
    expect(next.stage).toBe(0);
    expect(next.dueAt.toISOString().slice(0, 10)).toBe("2026-01-02");
  });

  it("moves a correct review to the next interval and resets a miss", () => {
    const next = scheduleAfterResult(0, true, intervals, now);
    expect(next.stage).toBe(1);
    expect(next.dueAt.toISOString().slice(0, 10)).toBe("2026-01-04");
    const reset = scheduleAfterResult(2, false, intervals, now);
    expect(reset.stage).toBe(0);
  });
});
