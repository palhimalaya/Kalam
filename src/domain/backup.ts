import { z } from "zod";
import { optionKeySchema, reviewStatusSchema } from "@/domain/import-validate";
import type { BackupFile } from "@/domain/types";

const questionSchema = z
  .object({
    id: z.string().min(1),
    stem: z.string().min(1),
    options: z.array(z.object({ key: optionKeySchema, text: z.string().min(1) })).length(4),
    correctOption: optionKeySchema,
    nodeId: z.string().min(1),
    reviewStatus: reviewStatusSchema,
    rightsStatus: z.enum([
      "original",
      "permission_confirmed",
      "licensed",
      "link_only",
      "private_study_only",
      "unknown",
      "restricted",
    ]),
    duplicateFingerprint: z.string().min(1),
    demo: z.boolean(),
  })
  .passthrough();

export const backupSchema = z
  .object({
    schemaVersion: z.literal(1),
    exportedAt: z.string().min(1),
    app: z.literal("loksewa-civil-mcq-trainer"),
    syllabus: z.array(z.object({ id: z.string().min(1), code: z.string().min(1), title: z.string().min(1) }).passthrough()),
    questions: z.array(questionSchema),
    templates: z.array(z.object({ id: z.string().min(1), topicWeights: z.record(z.number()), totalMarks: z.number() }).passthrough()),
    attempts: z.array(z.object({ id: z.string().min(1), status: z.string(), questionOrder: z.array(z.string()) }).passthrough()),
    attemptItems: z.array(z.object({ id: z.string().min(1), attemptId: z.string(), questionId: z.string() }).passthrough()),
    bookmarks: z.array(z.object({ id: z.string().min(1), questionId: z.string() }).passthrough()),
    notes: z.array(z.object({ id: z.string().min(1), targetId: z.string(), text: z.string() }).passthrough()),
    settings: z.object({ id: z.literal("app"), targetScore: z.number(), theme: z.enum(["light", "dark"]) }).passthrough(),
    knowledgePacks: z.array(z.object({ id: z.string().min(1), nodeId: z.string(), status: z.enum(["draft", "reviewed", "live"]) }).passthrough()),
    revisionItems: z.array(z.object({ id: z.string().min(1), questionId: z.string(), dueAt: z.string() }).passthrough()),
  })
  .superRefine((value, context) => {
    for (const question of value.questions) {
      const keys = question.options.map((option) => option.key);
      if (new Set(keys).size !== 4 || !keys.includes(question.correctOption)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Question ${question.id} has invalid options or correct key.`,
        });
      }
    }
  });

export interface RestorePreview {
  ok: boolean;
  message: string;
  counts: Record<string, number>;
  conflicts: string[];
  backup: BackupFile | null;
}

export function previewRestore(input: unknown, existingFingerprints: ReadonlyMap<string, string>): RestorePreview {
  const parsed = backupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((issue) => issue.message).join(" "),
      counts: {},
      conflicts: [],
      backup: null,
    };
  }
  const backup = parsed.data as unknown as BackupFile;
  const conflicts: string[] = [];
  for (const question of backup.questions) {
    const existingId = existingFingerprints.get(question.duplicateFingerprint);
    if (existingId && existingId !== question.id) {
      conflicts.push(`Question “${question.stem.slice(0, 80)}” matches existing ${existingId}.`);
    }
  }
  return {
    ok: true,
    message: conflicts.length > 0 ? "Backup is valid. Merge will skip conflicting questions." : "Backup is valid.",
    counts: {
      syllabus: backup.syllabus.length,
      questions: backup.questions.length,
      templates: backup.templates.length,
      attempts: backup.attempts.length,
      attemptItems: backup.attemptItems.length,
      bookmarks: backup.bookmarks.length,
      notes: backup.notes.length,
      knowledgePacks: backup.knowledgePacks.length,
      revisionItems: backup.revisionItems.length,
    },
    conflicts,
    backup,
  };
}
