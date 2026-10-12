import { describe, expect, it } from "vitest";
import { duplicateFingerprint, isNearDuplicate } from "@/domain/fingerprint";

describe("duplicate fingerprints", () => {
  it("matches the same stem and options regardless of option order and case", () => {
    const a = duplicateFingerprint("What is 15% of 240?", ["36", "30", "40", "48"]);
    const b = duplicateFingerprint("what is 15% of 240?", ["48", "40", "30", "36"]);
    expect(a).toBe(b);
  });

  it("detects a near-duplicate stem", () => {
    const stem = "seasoning of structural timber is done mainly to reduce the moisture content before the member is used";
    const near = `${stem} today`;
    expect(isNearDuplicate(stem, near)).toBe(true);
    expect(isNearDuplicate("Capital of Nepal", "Slump test measures concrete workability")).toBe(false);
  });
});
