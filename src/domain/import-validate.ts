import { z } from "zod";
import { duplicateFingerprint } from "@/domain/fingerprint";
import { isNearDuplicate } from "@/domain/fingerprint";
import type { OptionKey, Question, ReviewStatus, SyllabusNode } from "@/domain/types";

export const optionKeySchema = z.enum(["A", "B", "C", "D"]);
export const reviewStatusSchema = z.enum([
  "draft",
  "needs_verification",
  "verified",
  "live",
  "flagged",
  "retired",
]);

export const importedQuestionSchema = z
  .object({
    stem: z.string().trim().min(1, "Stem is required."),
    options: z
      .array(
        z.object({
          key: optionKeySchema,
          text: z.string().trim().min(1, "Option text is required."),
        }),
      )
      .length(4, "Exactly four options are required."),
    correctOption: optionKeySchema,
    nodeId: z.string().trim().min(1).optional(),
    nodeCode: z.string().trim().min(1).optional(),
    difficulty: z.enum(["easy", "medium", "hard", "unknown"]).optional(),
    language: z.enum(["en", "ne", "mixed"]).optional(),
    shortExplanation: z.string().optional().nullable(),
    detailedExplanation: z.string().optional().nullable(),
    sourceType: z.enum(["original", "user_file", "past_paper", "external_link", "licensed"]).optional(),
    sourceName: z.string().optional().nullable(),
    sourceUrl: z.string().optional().nullable(),
    sourcePage: z.string().optional().nullable(),
    sourceYear: z.number().int().nullable().optional(),
    rightsStatus: z
      .enum(["original", "permission_confirmed", "licensed", "link_only", "private_study_only", "unknown", "restricted"])
      .optional(),
    attribution: z.string().optional().nullable(),
    reviewStatus: reviewStatusSchema.optional(),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((value, context) => {
    const keys = value.options.map((option) => option.key);
    if (new Set(keys).size !== 4) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Options must use keys A, B, C, and D once each.", path: ["options"] });
    }
    if (!keys.includes(value.correctOption)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The correct option key is not one of the options.",
        path: ["correctOption"],
      });
    }
    if (!value.nodeId && !value.nodeCode) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "A syllabus node id or code is required.", path: ["nodeCode"] });
    }
  });

export type ImportedQuestionInput = z.infer<typeof importedQuestionSchema>;

export interface ParsedImportRow {
  row: number;
  value: unknown;
}

export interface ImportIssue {
  row: number;
  message: string;
}

export interface ImportDuplicate {
  row: number;
  stem: string;
  existingId: string;
  kind: "exact" | "near";
}

export interface AcceptedImport {
  row: number;
  question: Question;
  requestedStatus: ReviewStatus | null;
}

export interface ImportValidationResult {
  accepted: AcceptedImport[];
  errors: ImportIssue[];
  duplicates: ImportDuplicate[];
}

function issueMessage(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}

export function validateImportRows(args: {
  rows: readonly ParsedImportRow[];
  nodes: readonly SyllabusNode[];
  existing: readonly Question[];
  now: string;
  idFor: (row: number) => string;
}): ImportValidationResult {
  const accepted: AcceptedImport[] = [];
  const errors: ImportIssue[] = [];
  const duplicates: ImportDuplicate[] = [];
  const seenFingerprints = new Map<string, string>();

  for (const row of args.rows) {
    const parsed = importedQuestionSchema.safeParse(row.value);
    if (!parsed.success) {
      errors.push({ row: row.row, message: issueMessage(parsed.error) });
      continue;
    }
    const input = parsed.data;
    const node =
      args.nodes.find((item) => item.id === input.nodeId) ??
      args.nodes.find((item) => item.code.toLowerCase() === input.nodeCode?.toLowerCase());
    if (!node) {
      errors.push({ row: row.row, message: "Unknown syllabus id or code." });
      continue;
    }
    const fingerprint = duplicateFingerprint(
      input.stem,
      input.options.map((option) => option.text),
    );
    const existing = args.existing.find((question) => question.duplicateFingerprint === fingerprint);
    const fileDuplicateId = seenFingerprints.get(fingerprint);
    if (existing || fileDuplicateId) {
      duplicates.push({
        row: row.row,
        stem: input.stem,
        existingId: existing?.id ?? fileDuplicateId ?? "file",
        kind: "exact",
      });
      continue;
    }
    const near = args.existing.find(
      (question) => question.duplicateFingerprint !== fingerprint && isNearDuplicate(question.stem, input.stem),
    );
    if (near) {
      duplicates.push({ row: row.row, stem: input.stem, existingId: near.id, kind: "near" });
      continue;
    }
    seenFingerprints.set(fingerprint, args.idFor(row.row));
    const question: Question = {
      id: args.idFor(row.row),
      stem: input.stem,
      options: input.options.map((option) => ({ key: option.key as OptionKey, text: option.text })),
      correctOption: input.correctOption,
      shortExplanation: input.shortExplanation ?? null,
      detailedExplanation: input.detailedExplanation ?? null,
      optionExplanations: null,
      nodeId: node.id,
      difficulty: input.difficulty ?? "unknown",
      estimatedTimeSeconds: null,
      language: input.language ?? "en",
      figureRef: null,
      tags: input.tags ?? [],
      sourceType: input.sourceType ?? "user_file",
      sourceName: input.sourceName ?? null,
      sourceUrl: input.sourceUrl ?? null,
      sourceFileRef: null,
      sourcePage: input.sourcePage ?? null,
      sourceYear: input.sourceYear ?? null,
      sourceSeries: null,
      rightsStatus: input.rightsStatus ?? "unknown",
      attribution: input.attribution ?? null,
      reviewStatus: "draft",
      reviewNotes: "Imported as draft. Review the answer, source, and rights before verification.",
      author: null,
      reviewer: null,
      duplicateFingerprint: fingerprint,
      createdAt: args.now,
      updatedAt: args.now,
      verifiedAt: null,
      demo: false,
    };
    accepted.push({ row: row.row, question, requestedStatus: input.reviewStatus ?? null });
  }

  return { accepted, errors, duplicates };
}
