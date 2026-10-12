import { describe, expect, it } from "vitest";
import { selectMockQuestions, selectPracticeQuestions } from "@/domain/selection";
import { buildQuestions, buildSyllabus, buildTemplates, DEMO_TEMPLATE_ID, PROPOSED_TEMPLATE_ID } from "@/infrastructure/storage/seed";
import type { Difficulty, Question, ReviewStatus, RightsStatus } from "@/domain/types";

const nodes = [
  { id: "ga", code: "GA", title: "General Awareness" },
  { id: "lr", code: "LR", title: "Logical Reasoning" },
];

function question(partial: {
  id: string;
  nodeId: string;
  status?: ReviewStatus;
  rights?: RightsStatus;
  difficulty?: Difficulty;
}): Question {
  return {
    id: partial.id,
    stem: `Stem ${partial.id}`,
    options: [
      { key: "A", text: "1" },
      { key: "B", text: "2" },
      { key: "C", text: "3" },
      { key: "D", text: "4" },
    ],
    correctOption: "A",
    shortExplanation: null,
    detailedExplanation: null,
    optionExplanations: null,
    nodeId: partial.nodeId,
    difficulty: partial.difficulty ?? "medium",
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
    rightsStatus: partial.rights ?? "original",
    attribution: null,
    reviewStatus: partial.status ?? "live",
    reviewNotes: null,
    author: null,
    reviewer: null,
    duplicateFingerprint: partial.id,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    verifiedAt: null,
    demo: false,
  };
}

const history = { seen: new Set<string>(), latestCorrect: new Map<string, boolean>() };

describe("selectMockQuestions", () => {
  const questions = [
    question({ id: "ga-live", nodeId: "ga" }),
    question({ id: "ga-draft", nodeId: "ga", status: "draft" }),
    question({ id: "ga-verified", nodeId: "ga", status: "verified" }),
    question({ id: "lr-live", nodeId: "lr" }),
    question({ id: "lr-restricted", nodeId: "lr", rights: "restricted" }),
    question({ id: "lr-flagged", nodeId: "lr", status: "flagged" }),
  ];

  it("uses only verified or live questions and never duplicates one", () => {
    const result = selectMockQuestions({
      topicWeights: { GA: 2, LR: 1 },
      difficultyWeights: { easy: 0.3, medium: 0.5, hard: 0.2 },
      questions,
      nodes,
      history,
      seed: "paper-a",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questionIds).toHaveLength(3);
    expect(new Set(result.questionIds).size).toBe(3);
    expect(result.questionIds).toEqual(expect.arrayContaining(["ga-live", "ga-verified", "lr-live"]));
    expect(result.questionIds).not.toContain("ga-draft");
    expect(result.questionIds).not.toContain("lr-restricted");
    expect(result.questionIds).not.toContain("lr-flagged");
  });

  it("reports a topic gap instead of returning a short paper", () => {
    const result = selectMockQuestions({
      topicWeights: { GA: 3, LR: 1 },
      difficultyWeights: { easy: 0.3, medium: 0.5, hard: 0.2 },
      questions,
      nodes,
      history,
      seed: "paper-b",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.questionIds).toEqual([]);
    expect(result.gaps).toEqual([expect.objectContaining({ code: "GA", needed: 3, available: 2 })]);
  });

  it("is deterministic for the same seed", () => {
    const pool = ["a", "b", "c", "d", "e"].map((id, index) =>
      question({
        id,
        nodeId: "ga",
        difficulty: (["easy", "medium", "hard", "medium", "easy"] as const)[index],
      }),
    );
    const first = selectMockQuestions({
      topicWeights: { GA: 3 },
      difficultyWeights: { easy: 0.3, medium: 0.5, hard: 0.2 },
      questions: pool,
      nodes,
      history,
      seed: "same-seed",
    });
    const second = selectMockQuestions({
      topicWeights: { GA: 3 },
      difficultyWeights: { easy: 0.3, medium: 0.5, hard: 0.2 },
      questions: pool,
      nodes,
      history,
      seed: "same-seed",
    });
    expect(first).toEqual(second);
  });

  it("fills the demo paper and refuses the 100-mark paper from the seed bank", () => {
    const templates = buildTemplates();
    const demo = templates.find((template) => template.id === DEMO_TEMPLATE_ID);
    const proposed = templates.find((template) => template.id === PROPOSED_TEMPLATE_ID);
    const questions = buildQuestions();
    const nodes = buildSyllabus();
    const history = { seen: new Set<string>(), latestCorrect: new Map<string, boolean>() };
    const demoResult = selectMockQuestions({
      topicWeights: demo!.topicWeights,
      difficultyWeights: demo!.difficultyWeights,
      questions,
      nodes,
      history,
      seed: "demo-paper",
    });
    expect(demoResult.ok).toBe(true);
    if (demoResult.ok) {
      expect(demoResult.questionIds).toHaveLength(14);
      expect(new Set(demoResult.questionIds).size).toBe(14);
      expect(demoResult.questionIds).not.toContain("demo-restricted");
    }
    const proposedResult = selectMockQuestions({
      topicWeights: proposed!.topicWeights,
      difficultyWeights: proposed!.difficultyWeights,
      questions,
      nodes,
      history,
      seed: "full-paper",
    });
    expect(proposedResult.ok).toBe(false);
  });

  it("prefers an unseen question over a previously wrong one", () => {
    const result = selectPracticeQuestions({
      questions: [question({ id: "seen-wrong", nodeId: "ga" }), question({ id: "fresh", nodeId: "ga" })],
      nodeIds: ["ga"],
      questionIds: null,
      difficulty: "any",
      unseenOnly: false,
      incorrectOnly: false,
      bookmarkedOnly: false,
      bookmarkIds: new Set(),
      count: 1,
      history: { seen: new Set(["seen-wrong"]), latestCorrect: new Map([["seen-wrong", false]]) },
      seed: "prefer",
    });
    expect(result.questionIds).toEqual(["fresh"]);
  });
});
