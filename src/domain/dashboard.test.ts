import { describe, expect, it } from "vitest";
import { summarizeDashboard } from "@/domain/dashboard";
import { recommendTopics } from "@/domain/recommendation";
import type { Attempt, AttemptItem, ExamTemplate, Question, SyllabusNode } from "@/domain/types";

const template = {
  id: "t",
  name: "Proposed",
  version: 1,
  questionCount: 1,
  totalMarks: 1,
  durationSeconds: 60,
  marksPerCorrect: 1,
  penaltyPerWrong: 0.2,
  skippedMarks: 0,
  passMark: 40,
  topicWeights: { GA: 1 },
  difficultyWeights: { easy: 0.3, medium: 0.5, hard: 0.2 },
  calculatorAllowed: false,
  active: true,
  sourceNote: "test",
  lastVerifiedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} satisfies ExamTemplate;

const syllabus: SyllabusNode[] = [
  {
    id: "ga",
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

function question(id: string): Question {
  return {
    id,
    stem: id,
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
    nodeId: "ga",
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
    duplicateFingerprint: id,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    verifiedAt: null,
    demo: false,
  };
}

function attempt(id: string, netScore: number, status: Attempt["status"] = "submitted"): Attempt {
  return {
    id,
    mode: "mock",
    title: id,
    startedAt: "2026-02-01T00:00:00.000Z",
    submittedAt: status === "in_progress" ? null : `2026-02-0${id.slice(-1)}T00:00:00.000Z`,
    deadlineAt: null,
    status,
    templateSnapshot: template,
    questionOrder: ["q1"],
    cursor: 0,
    correctCount: netScore > 0 ? 1 : 0,
    wrongCount: netScore > 0 ? 0 : 1,
    skippedCount: 0,
    rawScore: netScore > 0 ? 1 : 0,
    penaltyMarks: netScore > 0 ? 0 : 0.2,
    netScore,
    durationSeconds: 30,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  };
}

describe("dashboard and recommendations", () => {
  it("derives accuracy from scored answers and ignores an in-progress attempt", () => {
    const items: AttemptItem[] = [
      {
        id: "a1",
        attemptId: "m1",
        questionId: "q1",
        chosenOption: "A",
        isCorrect: true,
        timeSpentSeconds: 10,
        flaggedForReview: false,
        confidence: null,
        answeredAt: "2026-02-01T00:00:00.000Z",
      },
      {
        id: "a2",
        attemptId: "m2",
        questionId: "q1",
        chosenOption: "B",
        isCorrect: false,
        timeSpentSeconds: 10,
        flaggedForReview: false,
        confidence: null,
        answeredAt: "2026-02-02T00:00:00.000Z",
      },
      {
        id: "a3",
        attemptId: "open",
        questionId: "q1",
        chosenOption: "A",
        isCorrect: true,
        timeSpentSeconds: 10,
        flaggedForReview: false,
        confidence: null,
        answeredAt: "2026-02-03T00:00:00.000Z",
      },
    ];
    const model = summarizeDashboard({
      syllabus,
      attempts: [attempt("m1", 1), attempt("m2", -0.2), attempt("open", 1, "in_progress")],
      items,
      questions: [question("q1")],
      targetAccuracyPercent: 70,
      now: new Date("2026-03-01T00:00:00.000Z"),
    });
    expect(model.mockTrend.map((point) => point.netScore)).toEqual([1, -0.2]);
    expect(model.bestMock?.netScore).toBe(1);
    expect(model.overallAccuracy).toBe(0.5);
    expect(model.topics[0]?.label).toBe("Not enough data");
    expect(model.answeredCount).toBe(2);
  });

  it("explains a recommendation with marks, gap, and recency", () => {
    const [first] = recommendTopics(
      [
        {
          code: "GA",
          title: "General Awareness",
          marks: 25,
          accuracy: 0.4,
          answered: 10,
          lastPractisedAt: null,
        },
      ],
      70,
      new Date("2026-03-01T00:00:00.000Z"),
    );
    expect(first?.reasons.join(" ")).toContain("25");
    expect(first?.reasons.join(" ")).toContain("not been practised");
    expect(first?.priority).toBeCloseTo(25 * 0.3 * 1.2);
  });
});
