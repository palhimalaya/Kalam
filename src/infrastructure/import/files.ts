import Papa from "papaparse";
import type { ParsedImportRow } from "@/domain/import-validate";

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function rowsFromCsv(text: string): { rows: ParsedImportRow[]; parseErrors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
  const parseErrors = parsed.errors.map((error) => `Row ${error.row ?? "?"}: ${error.message}`);
  const rows = parsed.data.map((record, index) => ({
    row: index + 2,
    value: {
      stem: record.stem ?? "",
      options: [
        { key: "A", text: record.optionA ?? "" },
        { key: "B", text: record.optionB ?? "" },
        { key: "C", text: record.optionC ?? "" },
        { key: "D", text: record.optionD ?? "" },
      ],
      correctOption: record.correctOption?.trim(),
      nodeCode: clean(record.nodeCode),
      nodeId: clean(record.nodeId),
      difficulty: clean(record.difficulty),
      language: clean(record.language),
      shortExplanation: record.shortExplanation ?? null,
      detailedExplanation: record.detailedExplanation ?? null,
      sourceType: clean(record.sourceType),
      sourceName: record.sourceName ?? null,
      sourceUrl: record.sourceUrl ?? null,
      sourcePage: record.sourcePage ?? null,
      sourceYear: clean(record.sourceYear) ? Number(record.sourceYear) : null,
      rightsStatus: clean(record.rightsStatus),
      attribution: record.attribution ?? null,
      reviewStatus: clean(record.reviewStatus),
      tags: clean(record.tags)
        ?.split("|")
        .map((tag) => tag.trim())
        .filter(Boolean),
    },
  }));
  return { rows, parseErrors };
}

export function rowsFromJson(text: string): { rows: ParsedImportRow[]; parseErrors: string[] } {
  try {
    const parsed = JSON.parse(text) as unknown;
    const list = Array.isArray(parsed) ? parsed : [];
    if (!Array.isArray(parsed)) return { rows: [], parseErrors: ["JSON root must be an array of questions."] };
    return {
      rows: list.map((value, index) => ({ row: index + 1, value })),
      parseErrors: [],
    };
  } catch (error) {
    return { rows: [], parseErrors: [error instanceof Error ? error.message : "Invalid JSON."] };
  }
}

function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n]/.test(guarded)) return `"${guarded.replaceAll('"', '""')}"`;
  return guarded;
}

export function questionsToCsv(
  questions: Array<{
    stem: string;
    options: { key: string; text: string }[];
    correctOption: string;
    nodeCode: string;
    difficulty: string;
    language: string;
    shortExplanation: string | null;
    sourceType: string;
    sourceName: string | null;
    sourceUrl: string | null;
    rightsStatus: string;
    reviewStatus: string;
    tags: string[];
  }>,
): string {
  const header = [
    "stem",
    "optionA",
    "optionB",
    "optionC",
    "optionD",
    "correctOption",
    "nodeCode",
    "difficulty",
    "language",
    "shortExplanation",
    "sourceType",
    "sourceName",
    "sourceUrl",
    "rightsStatus",
    "reviewStatus",
    "tags",
  ];
  const lines = [header.join(",")];
  for (const question of questions) {
    const byKey = Object.fromEntries(question.options.map((option) => [option.key, option.text]));
    lines.push(
      [
        question.stem,
        byKey.A,
        byKey.B,
        byKey.C,
        byKey.D,
        question.correctOption,
        question.nodeCode,
        question.difficulty,
        question.language,
        question.shortExplanation,
        question.sourceType,
        question.sourceName,
        question.sourceUrl,
        question.rightsStatus,
        question.reviewStatus,
        question.tags.join("|"),
      ]
        .map((cell) => csvCell(cell))
        .join(","),
    );
  }
  return lines.join("\n");
}
