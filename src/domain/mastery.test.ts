import { describe, expect, it } from "vitest";
import { masteryLabel } from "@/domain/mastery";

describe("masteryLabel", () => {
  it("stays not enough data below 10 scored answers", () => {
    expect(masteryLabel(9, 9)).toBe("Not enough data");
  });

  it("applies the thresholds once the sample reaches 10", () => {
    expect(masteryLabel(4, 10)).toBe("Weak");
    expect(masteryLabel(5, 10)).toBe("Improving");
    expect(masteryLabel(6, 10)).toBe("Improving");
    expect(masteryLabel(7, 10)).toBe("Strong");
    expect(masteryLabel(8, 10)).toBe("Strong");
    expect(masteryLabel(9, 10)).toBe("Mastered");
    expect(masteryLabel(17, 20)).toBe("Mastered");
  });
});
