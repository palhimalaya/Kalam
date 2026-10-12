import { scheduleAfterResult } from "@/domain/revision";
import { scoreAttempt } from "@/domain/scoring";
import type {
  Attempt,
  AttemptItem,
  BackupFile,
  Bookmark,
  ExamTemplate,
  ImportJob,
  KnowledgePack,
  OptionKey,
  PersonalNote,
  Question,
  RevisionItem,
  Settings,
} from "@/domain/types";
import { openAppDatabase, resetDatabaseConnection, STORE_NAMES, type AppDB } from "@/infrastructure/storage/db";
import {
  buildKnowledgePacks,
  buildQuestions,
  buildSettings,
  buildSyllabus,
  buildTemplates,
} from "@/infrastructure/storage/seed";
import type { IDBPDatabase } from "idb";

export interface AppSnapshot {
  syllabus: Awaited<ReturnType<typeof buildSyllabus>>;
  questions: Question[];
  templates: ExamTemplate[];
  attempts: Attempt[];
  items: AttemptItem[];
  bookmarks: Bookmark[];
  notes: PersonalNote[];
  settings: Settings;
  packs: KnowledgePack[];
  revisions: RevisionItem[];
  importJobs: ImportJob[];
}

const locks = new Map<string, Promise<unknown>>();

function withLock<T>(key: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  const next = previous.then(task, task);
  locks.set(key, next);
  return next;
}

async function seedIfEmpty(db: IDBPDatabase<AppDB>): Promise<void> {
  const marker = await db.get("meta", "seeded");
  if (marker?.value === "1") return;
  const tx = db.transaction(
    ["syllabus", "questions", "templates", "settings", "knowledgePacks", "meta"],
    "readwrite",
  );
  for (const node of buildSyllabus()) await tx.objectStore("syllabus").put(node);
  for (const question of buildQuestions()) await tx.objectStore("questions").put(question);
  for (const template of buildTemplates()) await tx.objectStore("templates").put(template);
  await tx.objectStore("settings").put(buildSettings());
  for (const pack of buildKnowledgePacks()) await tx.objectStore("knowledgePacks").put(pack);
  await tx.objectStore("meta").put({ key: "seeded", value: "1" });
  await tx.done;
}

export async function loadSnapshot(): Promise<AppSnapshot> {
  const db = await openAppDatabase();
  await seedIfEmpty(db);
  const [syllabus, questions, templates, attempts, items, bookmarks, notes, settings, packs, revisions, importJobs] =
    await Promise.all([
      db.getAll("syllabus"),
      db.getAll("questions"),
      db.getAll("templates"),
      db.getAll("attempts"),
      db.getAll("attemptItems"),
      db.getAll("bookmarks"),
      db.getAll("notes"),
      db.get("settings", "app"),
      db.getAll("knowledgePacks"),
      db.getAll("revisionItems"),
      db.getAll("importJobs"),
    ]);
  return {
    syllabus: syllabus.sort((a, b) => a.sortOrder - b.sortOrder),
    questions,
    templates,
    attempts,
    items,
    bookmarks,
    notes,
    settings: settings ?? buildSettings(),
    packs,
    revisions,
    importJobs,
  };
}

export async function createAttempt(attempt: Attempt, items: AttemptItem[]): Promise<void> {
  const db = await openAppDatabase();
  const tx = db.transaction(["attempts", "attemptItems"], "readwrite");
  await tx.objectStore("attempts").put(attempt);
  for (const item of items) await tx.objectStore("attemptItems").put(item);
  await tx.done;
}

export async function saveAttemptItem(item: AttemptItem): Promise<void> {
  const db = await openAppDatabase();
  const tx = db.transaction(["attemptItems", "attempts"], "readwrite");
  const attempt = await tx.objectStore("attempts").get(item.attemptId);
  if (!attempt || attempt.status !== "in_progress") return;
  await tx.objectStore("attemptItems").put(item);
  attempt.updatedAt = new Date().toISOString();
  await tx.objectStore("attempts").put(attempt);
  await tx.done;
}

export async function saveCursor(attemptId: string, cursor: number): Promise<void> {
  const db = await openAppDatabase();
  const attempt = await db.get("attempts", attemptId);
  if (!attempt || attempt.status !== "in_progress") return;
  attempt.cursor = cursor;
  attempt.updatedAt = new Date().toISOString();
  await db.put("attempts", attempt);
}

export async function addQuestionTime(attemptId: string, questionId: string, seconds: number): Promise<void> {
  if (seconds <= 0) return;
  const db = await openAppDatabase();
  const id = `${attemptId}:${questionId}`;
  const item = await db.get("attemptItems", id);
  if (!item) return;
  const attempt = await db.get("attempts", attemptId);
  if (!attempt || attempt.status !== "in_progress") return;
  item.timeSpentSeconds += seconds;
  await db.put("attemptItems", item);
}

export async function submitAttempt(attemptId: string, reason: "manual" | "expired"): Promise<Attempt | null> {
  return withLock(attemptId, async () => {
    const db = await openAppDatabase();
    const attempt = await db.get("attempts", attemptId);
    if (!attempt) return null;
    if (attempt.status !== "in_progress") return attempt;
    const items = await db.getAllFromIndex("attemptItems", "by-attempt", attemptId);
    const questions = await db.getAll("questions");
    const correctById = new Map(questions.map((question) => [question.id, question.correctOption]));
    const scored = scoreAttempt(attempt.templateSnapshot, items, correctById);
    const now = new Date();
    const submittedAt = now.toISOString();
    const scoredItems = items.map((item) => {
      const impact = scored.itemImpacts.find((entry) => entry.questionId === item.questionId);
      return {
        ...item,
        isCorrect: impact?.outcome === "correct" ? true : impact?.outcome === "wrong" ? false : null,
      };
    });
    const durationSeconds = Math.max(0, Math.round((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000));
    const next: Attempt = {
      ...attempt,
      status: reason === "expired" ? "expired" : "submitted",
      submittedAt,
      correctCount: scored.correctCount,
      wrongCount: scored.wrongCount,
      skippedCount: scored.skippedCount,
      rawScore: scored.rawScore,
      penaltyMarks: scored.penaltyMarks,
      netScore: scored.netScore,
      durationSeconds,
      updatedAt: submittedAt,
    };
    const tx = db.transaction(["attempts", "attemptItems", "revisionItems", "settings"], "readwrite");
    const current = await tx.objectStore("attempts").get(attemptId);
    if (!current || current.status !== "in_progress") {
      await tx.done;
      return current ?? attempt;
    }
    await tx.objectStore("attempts").put(next);
    for (const item of scoredItems) await tx.objectStore("attemptItems").put(item);
    const settings = await tx.objectStore("settings").get("app");
    const intervals = settings?.revisionIntervalsDays ?? [1, 3, 7, 21];
    for (const item of scoredItems) {
      if (item.isCorrect === null) continue;
      const existing = await tx.objectStore("revisionItems").get(item.questionId);
      if (item.isCorrect && !existing) continue;
      const scheduled = scheduleAfterResult(existing?.stage ?? null, item.isCorrect, intervals, now);
      const revision: RevisionItem = {
        id: item.questionId,
        questionId: item.questionId,
        stage: scheduled.stage,
        dueAt: scheduled.dueAt.toISOString(),
        lastCorrect: item.isCorrect,
        createdAt: existing?.createdAt ?? submittedAt,
        updatedAt: submittedAt,
      };
      await tx.objectStore("revisionItems").put(revision);
    }
    await tx.done;
    return next;
  });
}

export async function toggleBookmark(questionId: string): Promise<void> {
  const db = await openAppDatabase();
  const existing = await db.get("bookmarks", questionId);
  if (existing) await db.delete("bookmarks", questionId);
  else await db.put("bookmarks", { id: questionId, questionId, createdAt: new Date().toISOString() });
}

export async function saveNote(targetType: PersonalNote["targetType"], targetId: string, text: string): Promise<void> {
  const db = await openAppDatabase();
  const id = `${targetType}:${targetId}`;
  const existing = await db.get("notes", id);
  const now = new Date().toISOString();
  if (!text.trim()) {
    if (existing) await db.delete("notes", id);
    return;
  }
  await db.put("notes", {
    id,
    targetType,
    targetId,
    text,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
}

export async function saveQuestion(question: Question): Promise<void> {
  const db = await openAppDatabase();
  await db.put("questions", { ...question, updatedAt: new Date().toISOString() });
}

export async function saveTemplate(template: ExamTemplate): Promise<void> {
  const db = await openAppDatabase();
  await db.put("templates", template);
}

export async function saveSettings(settings: Settings): Promise<void> {
  const db = await openAppDatabase();
  await db.put("settings", { ...settings, updatedAt: new Date().toISOString() });
}

export async function savePack(pack: KnowledgePack): Promise<void> {
  const db = await openAppDatabase();
  await db.put("knowledgePacks", { ...pack, updatedAt: new Date().toISOString() });
}

export async function insertImportedQuestions(questions: Question[], job: ImportJob): Promise<void> {
  const db = await openAppDatabase();
  const tx = db.transaction(["questions", "importJobs"], "readwrite");
  for (const question of questions) await tx.objectStore("questions").put(question);
  await tx.objectStore("importJobs").put(job);
  await tx.done;
}

export async function saveImportJob(job: ImportJob): Promise<void> {
  const db = await openAppDatabase();
  await db.put("importJobs", job);
}

async function writeBackup(
  db: IDBPDatabase<AppDB>,
  backup: BackupFile,
  replace: boolean,
  blockedFingerprints: ReadonlyMap<string, string>,
): Promise<void> {
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  if (replace) {
    for (const name of STORE_NAMES) await tx.objectStore(name).clear();
  }
  for (const node of backup.syllabus) await tx.objectStore("syllabus").put(node as AppSnapshot["syllabus"][number]);
  for (const question of backup.questions) {
    const existingId = blockedFingerprints.get(question.duplicateFingerprint);
    if (!replace && existingId && existingId !== question.id) continue;
    await tx.objectStore("questions").put(question);
  }
  for (const template of backup.templates) await tx.objectStore("templates").put(template);
  for (const attempt of backup.attempts) await tx.objectStore("attempts").put(attempt);
  for (const item of backup.attemptItems) await tx.objectStore("attemptItems").put(item);
  for (const bookmark of backup.bookmarks) await tx.objectStore("bookmarks").put(bookmark);
  for (const note of backup.notes) await tx.objectStore("notes").put(note);
  await tx.objectStore("settings").put(backup.settings);
  for (const pack of backup.knowledgePacks) await tx.objectStore("knowledgePacks").put(pack);
  for (const revision of backup.revisionItems) await tx.objectStore("revisionItems").put(revision);
  await tx.objectStore("meta").put({ key: "seeded", value: "1" });
  await tx.done;
}

export async function restoreBackup(backup: BackupFile, mode: "merge" | "replace"): Promise<void> {
  const db = await openAppDatabase();
  const existing = mode === "merge" ? await db.getAll("questions") : [];
  const blocked = new Map(existing.map((question) => [question.duplicateFingerprint, question.id]));
  await writeBackup(db, backup, mode === "replace", blocked);
}

export async function resetToDemo(): Promise<void> {
  const db = await openAppDatabase();
  const tx = db.transaction([...STORE_NAMES], "readwrite");
  for (const name of STORE_NAMES) await tx.objectStore(name).clear();
  await tx.done;
  await seedIfEmpty(db);
}

export async function exportSnapshot(): Promise<BackupFile> {
  const snapshot = await loadSnapshot();
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "loksewa-civil-mcq-trainer",
    syllabus: snapshot.syllabus,
    questions: snapshot.questions,
    templates: snapshot.templates,
    attempts: snapshot.attempts,
    attemptItems: snapshot.items,
    bookmarks: snapshot.bookmarks,
    notes: snapshot.notes,
    settings: snapshot.settings,
    knowledgePacks: snapshot.packs,
    revisionItems: snapshot.revisions,
  };
}

export function itemId(attemptId: string, questionId: string): string {
  return `${attemptId}:${questionId}`;
}

export function blankItem(attemptId: string, questionId: string): AttemptItem {
  return {
    id: itemId(attemptId, questionId),
    attemptId,
    questionId,
    chosenOption: null,
    isCorrect: null,
    timeSpentSeconds: 0,
    flaggedForReview: false,
    confidence: null,
    answeredAt: null,
  };
}

export type AnswerPatch = Partial<Pick<AttemptItem, "chosenOption" | "flaggedForReview" | "confidence" | "isCorrect" | "answeredAt">>;

export function applyAnswerPatch(item: AttemptItem, patch: AnswerPatch, reveal: boolean, correct: OptionKey): AttemptItem {
  const next = { ...item, ...patch };
  if ("chosenOption" in patch) {
    next.answeredAt = patch.chosenOption ? new Date().toISOString() : null;
    next.isCorrect = reveal && patch.chosenOption ? patch.chosenOption === correct : reveal ? null : null;
    if (!reveal) next.isCorrect = null;
  }
  return next;
}

export async function deleteDatabaseForTests(): Promise<void> {
  const db = await openAppDatabase();
  db.close();
  resetDatabaseConnection();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(db.name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
