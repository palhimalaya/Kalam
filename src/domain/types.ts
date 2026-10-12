export type OptionKey = "A" | "B" | "C" | "D";
export type Difficulty = "easy" | "medium" | "hard" | "unknown";
export type LanguageCode = "en" | "ne" | "mixed";
export type SourceType = "original" | "user_file" | "past_paper" | "external_link" | "licensed";
export type RightsStatus =
  | "original"
  | "permission_confirmed"
  | "licensed"
  | "link_only"
  | "private_study_only"
  | "unknown"
  | "restricted";
export type ReviewStatus =
  | "draft"
  | "needs_verification"
  | "verified"
  | "live"
  | "flagged"
  | "retired";
export type AttemptMode = "learn" | "timed_practice" | "mock";
export type AttemptStatus = "in_progress" | "submitted" | "expired";
export type Confidence = "sure" | "unsure" | "guess";
export type NoteTarget = "question" | "syllabus_node";
export type PackStatus = "draft" | "reviewed" | "live";
export type MasteryLabel = "Not enough data" | "Weak" | "Improving" | "Strong" | "Mastered";

export interface SyllabusNode {
  id: string;
  parentId: string | null;
  code: string;
  title: string;
  part: "I" | "II" | null;
  marks: number | null;
  clauseText: string | null;
  sortOrder: number;
  sourceRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionOption {
  key: OptionKey;
  text: string;
}

export interface Question {
  id: string;
  stem: string;
  options: QuestionOption[];
  correctOption: OptionKey;
  shortExplanation: string | null;
  detailedExplanation: string | null;
  optionExplanations: Partial<Record<OptionKey, string>> | null;
  nodeId: string;
  difficulty: Difficulty;
  estimatedTimeSeconds: number | null;
  language: LanguageCode;
  figureRef: string | null;
  tags: string[];
  sourceType: SourceType;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceFileRef: string | null;
  sourcePage: string | null;
  sourceYear: number | null;
  sourceSeries: string | null;
  rightsStatus: RightsStatus;
  attribution: string | null;
  reviewStatus: ReviewStatus;
  reviewNotes: string | null;
  author: string | null;
  reviewer: string | null;
  duplicateFingerprint: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  demo: boolean;
}

export interface DifficultyWeights {
  easy: number;
  medium: number;
  hard: number;
}

export interface ExamTemplate {
  id: string;
  name: string;
  version: number;
  questionCount: number;
  totalMarks: number;
  durationSeconds: number;
  marksPerCorrect: number;
  penaltyPerWrong: number;
  skippedMarks: number;
  passMark: number | null;
  topicWeights: Record<string, number>;
  difficultyWeights: DifficultyWeights;
  calculatorAllowed: boolean;
  active: boolean;
  sourceNote: string;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  mode: AttemptMode;
  title: string;
  startedAt: string;
  submittedAt: string | null;
  deadlineAt: string | null;
  status: AttemptStatus;
  templateSnapshot: ExamTemplate;
  questionOrder: string[];
  cursor: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  rawScore: number;
  penaltyMarks: number;
  netScore: number;
  durationSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttemptItem {
  id: string;
  attemptId: string;
  questionId: string;
  chosenOption: OptionKey | null;
  isCorrect: boolean | null;
  timeSpentSeconds: number;
  flaggedForReview: boolean;
  confidence: Confidence | null;
  answeredAt: string | null;
}

export interface Bookmark {
  id: string;
  questionId: string;
  createdAt: string;
}

export interface PersonalNote {
  id: string;
  targetType: NoteTarget;
  targetId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSource {
  title: string;
  url: string;
  claimSupported: string;
  accessedDate: string;
}

export interface KnowledgePack {
  id: string;
  nodeId: string;
  syllabusText: string;
  coreConcepts: string[];
  formulaeAndTables: string[];
  workedExamples: string[];
  commonTraps: string[];
  nepalContext: string;
  sources: KnowledgeSource[];
  status: PackStatus;
  verifiedAt: string | null;
  updatedAt: string;
}

export interface ImportErrorRow {
  row: number;
  message: string;
}

export interface ImportJob {
  id: string;
  filename: string;
  format: "csv" | "json";
  startedAt: string;
  finishedAt: string | null;
  status: "preview" | "imported" | "failed";
  rowCount: number;
  acceptedCount: number;
  rejectedCount: number;
  duplicateCount: number;
  errors: ImportErrorRow[];
}

export interface Settings {
  id: "app";
  targetScore: number;
  examTemplateId: string;
  languagePreference: "en";
  theme: "light" | "dark";
  revisionIntervalsDays: number[];
  createdAt: string;
  updatedAt: string;
}

export interface RevisionItem {
  id: string;
  questionId: string;
  stage: number;
  dueAt: string;
  lastCorrect: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackupFile {
  schemaVersion: 1;
  exportedAt: string;
  app: "loksewa-civil-mcq-trainer";
  syllabus: SyllabusNode[];
  questions: Question[];
  templates: ExamTemplate[];
  attempts: Attempt[];
  attemptItems: AttemptItem[];
  bookmarks: Bookmark[];
  notes: PersonalNote[];
  settings: Settings;
  knowledgePacks: KnowledgePack[];
  revisionItems: RevisionItem[];
}

export const SCHEMA_VERSION = 1;
export const MIN_MASTERY_SAMPLE = 10;
export const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];
export const TOPIC_ORDER = ["GA", "LR", "NR", "SR", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10"] as const;
export const DEFAULT_INTERVALS_DAYS = [1, 3, 7, 21];

export const PROPOSED_TOPIC_WEIGHTS: Record<string, number> = {
  GA: 25,
  LR: 9,
  NR: 8,
  SR: 8,
  T1: 5,
  T2: 7,
  T3: 6,
  T4: 5,
  T5: 6,
  T6: 6,
  T7: 5,
  T8: 4,
  T9: 3,
  T10: 3,
};
