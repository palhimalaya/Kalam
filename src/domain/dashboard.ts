import { accuracy } from "@/domain/scoring";
import { masteryLabel } from "@/domain/mastery";
import { recommendTopics, type Recommendation } from "@/domain/recommendation";
import type { Attempt, AttemptItem, Question, SyllabusNode } from "@/domain/types";

export interface TopicStat {
  nodeId: string;
  code: string;
  title: string;
  marks: number | null;
  correct: number;
  wrong: number;
  skipped: number;
  answered: number;
  accuracy: number | null;
  label: ReturnType<typeof masteryLabel>;
  lastPractisedAt: string | null;
}

export interface MockPoint {
  id: string;
  submittedAt: string;
  netScore: number;
  totalMarks: number;
}

export interface DashboardModel {
  finishedAttempts: number;
  mockAttempts: number;
  practiceAttempts: number;
  activeAttempts: number;
  answeredCount: number;
  overallCorrect: number;
  overallWrong: number;
  overallAccuracy: number | null;
  latestMock: MockPoint | null;
  bestMock: MockPoint | null;
  mockTrend: MockPoint[];
  topics: TopicStat[];
  recommendations: Recommendation[];
  readinessNote: string;
}

function finished(attempts: readonly Attempt[]): Attempt[] {
  return attempts.filter((attempt) => attempt.status !== "in_progress");
}

export function summarizeDashboard(args: {
  syllabus: readonly SyllabusNode[];
  attempts: readonly Attempt[];
  items: readonly AttemptItem[];
  questions: readonly Question[];
  targetAccuracyPercent: number;
  now: Date;
}): DashboardModel {
  const done = finished(args.attempts).sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""));
  const doneIds = new Set(done.map((attempt) => attempt.id));
  const questionById = new Map(args.questions.map((question) => [question.id, question]));
  const topics = args.syllabus
    .filter((node) => node.marks !== null)
    .map<TopicStat>((node) => ({
      nodeId: node.id,
      code: node.code,
      title: node.title,
      marks: node.marks,
      correct: 0,
      wrong: 0,
      skipped: 0,
      answered: 0,
      accuracy: null,
      label: "Not enough data",
      lastPractisedAt: null,
    }));
  const topicByNode = new Map(topics.map((topic) => [topic.nodeId, topic]));

  let overallCorrect = 0;
  let overallWrong = 0;
  let answeredCount = 0;

  for (const item of args.items) {
    if (!doneIds.has(item.attemptId)) continue;
    const question = questionById.get(item.questionId);
    const topic = question ? topicByNode.get(question.nodeId) : undefined;
    const when = item.answeredAt ?? done.find((attempt) => attempt.id === item.attemptId)?.submittedAt ?? null;
    if (item.chosenOption) answeredCount += 1;
    if (item.isCorrect === true) {
      overallCorrect += 1;
      if (topic) {
        topic.correct += 1;
        topic.answered += 1;
      }
    } else if (item.isCorrect === false) {
      overallWrong += 1;
      if (topic) {
        topic.wrong += 1;
        topic.answered += 1;
      }
    } else if (topic) {
      topic.skipped += 1;
    }
    if (topic && when && (!topic.lastPractisedAt || when > topic.lastPractisedAt)) topic.lastPractisedAt = when;
  }

  for (const topic of topics) {
    topic.accuracy = accuracy(topic.correct, topic.wrong);
    topic.label = masteryLabel(topic.correct, topic.answered);
  }

  const mocks = done
    .filter((attempt) => attempt.mode === "mock")
    .map<MockPoint>((attempt) => ({
      id: attempt.id,
      submittedAt: attempt.submittedAt ?? attempt.updatedAt,
      netScore: attempt.netScore,
      totalMarks: attempt.templateSnapshot.totalMarks,
    }));

  const bestMock = mocks.reduce<MockPoint | null>((best, point) => {
    if (!best || point.netScore > best.netScore) return point;
    return best;
  }, null);

  return {
    finishedAttempts: done.length,
    mockAttempts: mocks.length,
    practiceAttempts: done.filter((attempt) => attempt.mode !== "mock").length,
    activeAttempts: args.attempts.filter((attempt) => attempt.status === "in_progress").length,
    answeredCount,
    overallCorrect,
    overallWrong,
    overallAccuracy: accuracy(overallCorrect, overallWrong),
    latestMock: mocks.at(-1) ?? null,
    bestMock,
    mockTrend: mocks,
    topics,
    recommendations: recommendTopics(
      topics.map((topic) => ({
        code: topic.code,
        title: topic.title,
        marks: topic.marks ?? 0,
        accuracy: topic.accuracy,
        answered: topic.answered,
        lastPractisedAt: topic.lastPractisedAt,
      })),
      args.targetAccuracyPercent,
      args.now,
    ),
    readinessNote:
      mocks.length < 3
        ? "Not enough mock history to describe readiness. Saved scores are not a prediction of the official exam."
        : "The chart shows saved mock scores only. It is not a prediction of the official exam.",
  };
}
