"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { blueprintSum, validateBlueprint, validateDifficultyWeights } from "@/domain/blueprint";
import { buildQuestionHistory } from "@/domain/history";
import type { ImportValidationResult } from "@/domain/import-validate";
import { selectMockQuestions, selectPracticeQuestions } from "@/domain/selection";
import type {
  Attempt,
  Confidence,
  ExamTemplate,
  ImportJob,
  KnowledgePack,
  OptionKey,
  PersonalNote,
  Question,
  Settings,
} from "@/domain/types";
import { duplicateFingerprint } from "@/domain/fingerprint";
import {
  addQuestionTime,
  applyAnswerPatch,
  blankItem,
  createAttempt,
  exportSnapshot,
  insertImportedQuestions,
  loadSnapshot,
  resetToDemo,
  restoreBackup,
  saveAttemptItem,
  saveCursor,
  saveNote,
  savePack,
  saveQuestion,
  saveSettings,
  saveTemplate,
  submitAttempt,
  toggleBookmark,
  type AnswerPatch,
  type AppSnapshot,
} from "@/infrastructure/storage/repository";
import type { BackupFile } from "@/domain/types";
import type { TopicGap } from "@/domain/selection";

export interface PracticeStart {
  mode: "learn" | "timed_practice";
  nodeIds: string[];
  questionIds: string[] | null;
  difficulty: Question["difficulty"] | "any";
  unseenOnly: boolean;
  incorrectOnly: boolean;
  bookmarkedOnly: boolean;
  count: number;
  minutes: number | null;
}

interface StoreValue extends AppSnapshot {
  ready: boolean;
  error: string | null;
  offline: boolean;
  refresh: () => Promise<void>;
  startPractice: (input: PracticeStart) => Promise<{ id?: string; error?: string; warnings: string[] }>;
  startMock: (templateId: string) => Promise<{ id?: string; error?: string; gaps: TopicGap[]; warnings: string[] }>;
  patchAnswer: (attemptId: string, questionId: string, patch: AnswerPatch, reveal: boolean) => Promise<void>;
  moveCursor: (attemptId: string, cursor: number) => Promise<void>;
  addTime: (attemptId: string, questionId: string, seconds: number) => Promise<void>;
  submit: (attemptId: string, reason: "manual" | "expired") => Promise<Attempt | null>;
  toggleBookmark: (questionId: string) => Promise<void>;
  saveNote: (targetType: PersonalNote["targetType"], targetId: string, text: string) => Promise<void>;
  updateQuestion: (question: Question) => Promise<void>;
  updateTemplate: (template: ExamTemplate) => Promise<string | null>;
  updateSettings: (settings: Settings) => Promise<void>;
  updatePack: (pack: KnowledgePack) => Promise<void>;
  commitImport: (result: ImportValidationResult, filename: string, format: ImportJob["format"]) => Promise<void>;
  restore: (backup: BackupFile, mode: "merge" | "replace") => Promise<void>;
  resetDemo: () => Promise<void>;
  exportBackup: () => Promise<BackupFile>;
}

const StoreContext = createContext<StoreValue | null>(null);

const emptySnapshot: AppSnapshot = {
  syllabus: [],
  questions: [],
  templates: [],
  attempts: [],
  items: [],
  bookmarks: [],
  notes: [],
  settings: {
    id: "app",
    targetScore: 70,
    examTemplateId: "template-proposed-paper-i",
    languagePreference: "en",
    theme: "light",
    revisionIntervalsDays: [1, 3, 7, 21],
    createdAt: "",
    updatedAt: "",
  },
  packs: [],
  revisions: [],
  importJobs: [],
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<AppSnapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  async function refresh() {
    const next = await loadSnapshot();
    setSnapshot(next);
    setReady(true);
  }

  useEffect(() => {
    let cancelled = false;
    loadSnapshot()
      .then((next) => {
        if (cancelled) return;
        setSnapshot(next);
        setReady(true);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : "The local library could not be opened.");
        setReady(true);
      });
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    setOffline(!navigator.onLine);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      cancelled = true;
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.theme = snapshot.settings.theme;
    localStorage.setItem("theme", snapshot.settings.theme);
  }, [ready, snapshot.settings.theme]);

  const value = useMemo<StoreValue>(() => {
    return {
      ...snapshot,
      ready,
      error,
      offline,
      refresh,
      async startPractice(input) {
        const template = snapshot.templates.find((item) => item.id === snapshot.settings.examTemplateId) ?? snapshot.templates[0];
        if (!template) return { error: "No exam template is available.", warnings: [] };
        const id = crypto.randomUUID();
        const history = buildQuestionHistory(snapshot.attempts, snapshot.items);
        const selected = selectPracticeQuestions({
          questions: snapshot.questions,
          nodeIds: input.nodeIds,
          questionIds: input.questionIds,
          difficulty: input.difficulty,
          unseenOnly: input.unseenOnly,
          incorrectOnly: input.incorrectOnly,
          bookmarkedOnly: input.bookmarkedOnly,
          bookmarkIds: new Set(snapshot.bookmarks.map((bookmark) => bookmark.questionId)),
          count: input.questionIds ? input.questionIds.length : input.count,
          history,
          seed: id,
        });
        if (selected.questionIds.length === 0) {
          return { error: "No verified or live questions match these filters.", warnings: selected.warnings };
        }
        const now = new Date();
        const attempt: Attempt = {
          id,
          mode: input.mode,
          title: input.mode === "learn" ? "Learn practice" : "Timed practice",
          startedAt: now.toISOString(),
          submittedAt: null,
          deadlineAt: input.mode === "timed_practice" && input.minutes ? new Date(now.getTime() + input.minutes * 60_000).toISOString() : null,
          status: "in_progress",
          templateSnapshot: template,
          questionOrder: selected.questionIds,
          cursor: 0,
          correctCount: 0,
          wrongCount: 0,
          skippedCount: 0,
          rawScore: 0,
          penaltyMarks: 0,
          netScore: 0,
          durationSeconds: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        await createAttempt(attempt, selected.questionIds.map((questionId) => blankItem(id, questionId)));
        await refresh();
        return { id, warnings: selected.warnings };
      },
      async startMock(templateId) {
        const template = snapshot.templates.find((item) => item.id === templateId);
        if (!template) return { error: "Choose a template.", gaps: [], warnings: [] };
        const weightSum = blueprintSum(template.topicWeights);
        if (Math.abs(weightSum * template.marksPerCorrect - template.totalMarks) > 0.001) {
          return {
            error: `Topic counts total ${weightSum}. At ${template.marksPerCorrect} mark each, that is not ${template.totalMarks} marks.`,
            gaps: [],
            warnings: [],
          };
        }
        const id = crypto.randomUUID();
        const selected = selectMockQuestions({
          topicWeights: template.topicWeights,
          difficultyWeights: template.difficultyWeights,
          questions: snapshot.questions,
          nodes: snapshot.syllabus,
          history: buildQuestionHistory(snapshot.attempts, snapshot.items),
          seed: id,
        });
        if (!selected.ok) {
          return {
            error: "The question bank cannot fill this paper.",
            gaps: selected.gaps,
            warnings: selected.warnings,
          };
        }
        const now = new Date();
        const attempt: Attempt = {
          id,
          mode: "mock",
          title: template.name,
          startedAt: now.toISOString(),
          submittedAt: null,
          deadlineAt: new Date(now.getTime() + template.durationSeconds * 1000).toISOString(),
          status: "in_progress",
          templateSnapshot: template,
          questionOrder: selected.questionIds,
          cursor: 0,
          correctCount: 0,
          wrongCount: 0,
          skippedCount: 0,
          rawScore: 0,
          penaltyMarks: 0,
          netScore: 0,
          durationSeconds: 0,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        await createAttempt(
          attempt,
          selected.questionIds.map((questionId) => blankItem(id, questionId)),
        );
        await refresh();
        return { id, gaps: [], warnings: selected.warnings };
      },
      async patchAnswer(attemptId, questionId, patch, reveal) {
        const question = snapshot.questions.find((item) => item.id === questionId);
        const current = snapshot.items.find((item) => item.attemptId === attemptId && item.questionId === questionId);
        if (!question || !current) return;
        const next = applyAnswerPatch(current, patch, reveal, question.correctOption);
        await saveAttemptItem(next);
        await refresh();
      },
      async moveCursor(attemptId, cursor) {
        await saveCursor(attemptId, cursor);
        setSnapshot((current) => ({
          ...current,
          attempts: current.attempts.map((attempt) => (attempt.id === attemptId ? { ...attempt, cursor } : attempt)),
        }));
      },
      async addTime(attemptId, questionId, seconds) {
        await addQuestionTime(attemptId, questionId, seconds);
      },
      async submit(attemptId, reason) {
        const saved = await submitAttempt(attemptId, reason);
        await refresh();
        return saved;
      },
      async toggleBookmark(questionId) {
        await toggleBookmark(questionId);
        await refresh();
      },
      async saveNote(targetType, targetId, text) {
        await saveNote(targetType, targetId, text);
        await refresh();
      },
      async updateQuestion(question) {
        const now = new Date().toISOString();
        const next: Question = {
          ...question,
          duplicateFingerprint: duplicateFingerprint(
            question.stem,
            question.options.map((option) => option.text),
          ),
          updatedAt: now,
          verifiedAt:
            question.reviewStatus === "verified" || question.reviewStatus === "live"
              ? question.verifiedAt ?? now
              : question.verifiedAt,
          reviewer:
            question.reviewStatus === "verified" || question.reviewStatus === "live"
              ? question.reviewer ?? "local-user"
              : question.reviewer,
        };
        await saveQuestion(next);
        await refresh();
      },
      async updateTemplate(template) {
        const weightSum = blueprintSum(template.topicWeights);
        if (template.marksPerCorrect === 1) {
          const blueprint = validateBlueprint(template.topicWeights, template.totalMarks);
          if (!blueprint.ok) return blueprint.message;
        } else if (Math.abs(weightSum * template.marksPerCorrect - template.totalMarks) > 0.001) {
          return `Topic counts total ${weightSum}. At ${template.marksPerCorrect} marks each, total marks must be ${weightSum * template.marksPerCorrect}.`;
        }
        if (template.questionCount !== weightSum) {
          return `Question count is ${template.questionCount}, but the topics add up to ${weightSum}.`;
        }
        const difficultyError = validateDifficultyWeights(template.difficultyWeights);
        if (difficultyError) return difficultyError;
        await saveTemplate({ ...template, updatedAt: new Date().toISOString(), version: template.version + 1 });
        await refresh();
        return null;
      },
      async updateSettings(settings) {
        await saveSettings(settings);
        await refresh();
      },
      async updatePack(pack) {
        await savePack(pack);
        await refresh();
      },
      async commitImport(result, filename, format) {
        const now = new Date().toISOString();
        const job: ImportJob = {
          id: crypto.randomUUID(),
          filename,
          format,
          startedAt: now,
          finishedAt: now,
          status: result.accepted.length > 0 ? "imported" : "failed",
          rowCount: result.accepted.length + result.errors.length + result.duplicates.length,
          acceptedCount: result.accepted.length,
          rejectedCount: result.errors.length,
          duplicateCount: result.duplicates.length,
          errors: result.errors,
        };
        await insertImportedQuestions(
          result.accepted.map((row) => row.question),
          job,
        );
        await refresh();
      },
      async restore(backup, mode) {
        await restoreBackup(backup, mode);
        await refresh();
      },
      async resetDemo() {
        await resetToDemo();
        await refresh();
      },
      exportBackup: exportSnapshot,
    };
  }, [snapshot, ready, error, offline]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}

export type { Confidence, OptionKey };
