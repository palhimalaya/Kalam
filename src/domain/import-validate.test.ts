import { describe, expect, it } from "vitest";
import { duplicateFingerprint } from "@/domain/fingerprint";
import { validateImportRows } from "@/domain/import-validate";
import type { Question, SyllabusNode } from "@/domain/types";

const nodes: SyllabusNode[] = [
  {
    id: "topic-ga",
    parentId: null,
    code: "GA",
    title: "General Awareness",
    part: "I",
    marks: 25,
    clauseText: null,
    sortOrder: 1,
    sourceRef: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const existing: Question[] = [
  {
    id: "existing",
    stem: "Demo duplicate stem",
    options: [
      { key: "A", text: "One" },
      { key: "B", text: "Two" },
      { key: "C", text: "Three" },
      { key: "D", text: "Four" },
    ],
    correctOption: "A",
    shortExplanation: null,
    detailedExplanation: null,
    optionExplanations: null,
    nodeId: "topic-ga",
    difficulty: "easy",
    estimatedTimeSeconds: null,
    language: "en",
    figureRef: null,
    tags: [],
    sourceType: "original",
    sourceName: null,
    sourceUrl: null,
    sourceFileRef: null,
    sourcePage: null,
    sourceYear: null,
    sourceSeries: null,
    rightsStatus: "original",
    attribution: null,
    reviewStatus: "live",
    reviewNotes: null,
    author: null,
    reviewer: null,
    duplicateFingerprint: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    verifiedAt: null,
    demo: true,
  },
];

existing[0]!.duplicateFingerprint = duplicateFingerprint("Demo duplicate stem", ["One", "Two", "Three", "Four"]);

describe("validateImportRows", () => {
  const base = {
    nodes,
    existing,
    now: "2026-10-12T00:00:00.000Z",
    idFor: (row: number) => `new-${row}`,
  };

  it("rejects missing options, bad keys, unknown syllabus ids, and invalid statuses", () => {
    const result = validateImportRows({
      ...base,
      rows: [
        { row: 1, value: { stem: "Only one option", options: [{ key: "A", text: "Yes" }], correctOption: "A", nodeCode: "GA" } },
        {
          row: 2,
          value: {
            stem: "Bad key",
            options: [
              { key: "A", text: "1" },
              { key: "B", text: "2" },
              { key: "C", text: "3" },
              { key: "D", text: "4" },
            ],
            correctOption: "E",
            nodeCode: "GA",
          },
        },
        {
          row: 3,
          value: {
            stem: "Unknown topic",
            options: [
              { key: "A", text: "1" },
              { key: "B", text: "2" },
              { key: "C", text: "3" },
              { key: "D", text: "4" },
            ],
            correctOption: "A",
            nodeCode: "NOPE",
          },
        },
        {
          row: 4,
          value: {
            stem: "Bad status",
            options: [
              { key: "A", text: "1" },
              { key: "B", text: "2" },
              { key: "C", text: "3" },
              { key: "D", text: "4" },
            ],
            correctOption: "A",
            nodeCode: "GA",
            reviewStatus: "published",
          },
        },
      ],
    });
    expect(result.accepted).toHaveLength(0);
    expect(result.errors.map((error) => error.row)).toEqual([1, 2, 3, 4]);
  });

  it("accepts a valid row as a draft and flags an exact duplicate", () => {
    const result = validateImportRows({
      ...base,
      rows: [
        {
          row: 1,
          value: {
            stem: "A brand new demo stem about curing",
            options: [
              { key: "A", text: "Keep moisture available" },
              { key: "B", text: "Freeze the mix" },
              { key: "C", text: "Add extra sand only" },
              { key: "D", text: "Skip compaction" },
            ],
            correctOption: "A",
            nodeCode: "GA",
            reviewStatus: "live",
          },
        },
        {
          row: 2,
          value: {
            stem: "Demo duplicate stem",
            options: [
              { key: "A", text: "One" },
              { key: "B", text: "Two" },
              { key: "C", text: "Three" },
              { key: "D", text: "Four" },
            ],
            correctOption: "A",
            nodeId: "topic-ga",
          },
        },
      ],
    });
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]?.question.reviewStatus).toBe("draft");
    expect(result.accepted[0]?.requestedStatus).toBe("live");
    expect(result.duplicates).toEqual([
      expect.objectContaining({ row: 2, kind: "exact", existingId: "existing" }),
    ]);
  });
});
