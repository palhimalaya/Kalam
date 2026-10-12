import { describe, expect, it } from "vitest";
import { blueprintSum, validateBlueprint } from "@/domain/blueprint";
import { PROPOSED_TOPIC_WEIGHTS } from "@/domain/types";

describe("validateBlueprint", () => {
  it("accepts the proposed 100-mark blueprint", () => {
    expect(blueprintSum(PROPOSED_TOPIC_WEIGHTS)).toBe(100);
    expect(validateBlueprint(PROPOSED_TOPIC_WEIGHTS, 100).ok).toBe(true);
  });

  it("rejects totals of 99 and 101", () => {
    const low = { ...PROPOSED_TOPIC_WEIGHTS, GA: 24 };
    const high = { ...PROPOSED_TOPIC_WEIGHTS, GA: 26 };
    expect(validateBlueprint(low, 100).ok).toBe(false);
    expect(validateBlueprint(high, 100).ok).toBe(false);
    expect(validateBlueprint(low, 100).message).toContain("99");
    expect(validateBlueprint(high, 100).message).toContain("101");
  });
});
