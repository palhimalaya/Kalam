import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Attempt,
  AttemptItem,
  Bookmark,
  ExamTemplate,
  ImportJob,
  KnowledgePack,
  PersonalNote,
  Question,
  RevisionItem,
  Settings,
  SyllabusNode,
} from "@/domain/types";
import { DB_NAME, DB_VERSION } from "@/infrastructure/storage/schema";

export interface MetaRow {
  key: string;
  value: string;
}

export interface AppDB extends DBSchema {
  syllabus: { key: string; value: SyllabusNode };
  questions: { key: string; value: Question; indexes: { "by-fingerprint": string } };
  templates: { key: string; value: ExamTemplate };
  attempts: { key: string; value: Attempt; indexes: { "by-status": Attempt["status"] } };
  attemptItems: { key: string; value: AttemptItem; indexes: { "by-attempt": string } };
  bookmarks: { key: string; value: Bookmark; indexes: { "by-question": string } };
  notes: { key: string; value: PersonalNote };
  settings: { key: string; value: Settings };
  importJobs: { key: string; value: ImportJob };
  knowledgePacks: { key: string; value: KnowledgePack };
  revisionItems: { key: string; value: RevisionItem };
  meta: { key: string; value: MetaRow };
}

const STORES = [
  "syllabus",
  "questions",
  "templates",
  "attempts",
  "attemptItems",
  "bookmarks",
  "notes",
  "settings",
  "importJobs",
  "knowledgePacks",
  "revisionItems",
  "meta",
] as const;

export type StoreName = (typeof STORES)[number];
export const STORE_NAMES = STORES;

let databasePromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function openAppDatabase(): Promise<IDBPDatabase<AppDB>> {
  if (!databasePromise) {
    databasePromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("syllabus")) db.createObjectStore("syllabus", { keyPath: "id" });
        if (!db.objectStoreNames.contains("questions")) {
          const store = db.createObjectStore("questions", { keyPath: "id" });
          store.createIndex("by-fingerprint", "duplicateFingerprint");
        }
        if (!db.objectStoreNames.contains("templates")) db.createObjectStore("templates", { keyPath: "id" });
        if (!db.objectStoreNames.contains("attempts")) {
          const store = db.createObjectStore("attempts", { keyPath: "id" });
          store.createIndex("by-status", "status");
        }
        if (!db.objectStoreNames.contains("attemptItems")) {
          const store = db.createObjectStore("attemptItems", { keyPath: "id" });
          store.createIndex("by-attempt", "attemptId");
        }
        if (!db.objectStoreNames.contains("bookmarks")) {
          const store = db.createObjectStore("bookmarks", { keyPath: "id" });
          store.createIndex("by-question", "questionId");
        }
        if (!db.objectStoreNames.contains("notes")) db.createObjectStore("notes", { keyPath: "id" });
        if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "id" });
        if (!db.objectStoreNames.contains("importJobs")) db.createObjectStore("importJobs", { keyPath: "id" });
        if (!db.objectStoreNames.contains("knowledgePacks")) db.createObjectStore("knowledgePacks", { keyPath: "id" });
        if (!db.objectStoreNames.contains("revisionItems")) db.createObjectStore("revisionItems", { keyPath: "id" });
        if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
      },
    });
  }
  return databasePromise;
}

export function resetDatabaseConnection(): void {
  databasePromise = null;
}
