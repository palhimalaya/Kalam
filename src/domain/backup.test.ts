import { describe, expect, it } from "vitest";
import { previewRestore } from "@/domain/backup";

describe("previewRestore", () => {
  it("rejects a file that is not a backup", () => {
    const preview = previewRestore({ hello: "no" }, new Map());
    expect(preview.ok).toBe(false);
    expect(preview.backup).toBeNull();
  });
});
