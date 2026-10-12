"use client";

import { useState } from "react";
import { previewRestore } from "@/domain/backup";
import { validateBlueprint } from "@/domain/blueprint";
import { validateImportRows, type ImportValidationResult } from "@/domain/import-validate";
import type { ExamTemplate } from "@/domain/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { cardClass, dangerButtonClass, fieldClass, labelClass, primaryButtonClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { questionsToCsv, rowsFromCsv, rowsFromJson } from "@/infrastructure/import/files";
import { downloadText, formatMarks } from "@/lib/format";

export default function SettingsPage() {
  const store = useStore();
  const [templateId, setTemplateId] = useState(store.settings.examTemplateId);
  const [template, setTemplate] = useState<ExamTemplate | null>(null);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ filename: string; format: "csv" | "json"; result: ImportValidationResult; notes: string[] } | null>(null);
  const [restoreFile, setRestoreFile] = useState<unknown>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const current = store.templates.find((item) => item.id === (template?.id ?? templateId)) ?? store.templates[0] ?? null;
  const editing = template && current && template.id === current.id ? template : current;
  const fingerprints = new Map(store.questions.map((question) => [question.duplicateFingerprint, question.id]));
  const restorePreview = restoreFile ? previewRestore(restoreFile, fingerprints) : null;

  function loadTemplate(id: string) {
    setTemplateId(id);
    const next = store.templates.find((item) => item.id === id);
    setTemplate(next ? structuredClone(next) : null);
    setTemplateMessage(null);
  }

  async function readImport(file: File) {
    const text = await file.text();
    const format = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
    const parsed = format === "csv" ? rowsFromCsv(text) : rowsFromJson(text);
    const result = validateImportRows({
      rows: parsed.rows,
      nodes: store.syllabus,
      existing: store.questions,
      now: new Date().toISOString(),
      idFor: (row) => `import-${crypto.randomUUID()}-${row}`,
    });
    result.errors.unshift(...parsed.parseErrors.map((message, index) => ({ row: index, message })));
    setPreview({
      filename: file.name,
      format,
      result,
      notes: result.accepted.filter((row) => row.requestedStatus && row.requestedStatus !== "draft").map((row) => `Row ${row.row} asked for ${row.requestedStatus} and will be saved as draft.`),
    });
  }

  async function saveTemplate() {
    if (!editing) return;
    const message = await store.updateTemplate(editing);
    setTemplateMessage(message ?? "Template saved. New mocks use it. Finished attempts keep their old snapshot.");
    setTemplate(null);
  }

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-serif text-4xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Study data lives in IndexedDB on this device. Export a backup before you clear the browser. There is no account and no cloud copy.
        </p>
      </header>
      <section className={`${cardClass} grid gap-3 sm:grid-cols-2`}>
        <h2 className="font-serif text-2xl sm:col-span-2">Study preferences</h2>
        <label className={labelClass}>
          Theme
          <select
            className={fieldClass}
            value={store.settings.theme}
            onChange={(event) => void store.updateSettings({ ...store.settings, theme: event.target.value as "light" | "dark" })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className={labelClass}>
          Target accuracy %
          <input
            className={fieldClass}
            type="number"
            min={1}
            max={100}
            value={store.settings.targetScore}
            onChange={(event) => void store.updateSettings({ ...store.settings, targetScore: Number(event.target.value) })}
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Revision intervals in days
          <input
            className={fieldClass}
            value={store.settings.revisionIntervalsDays.join(", ")}
            onChange={(event) => {
              const revisionIntervalsDays = event.target.value
                .split(",")
                .map((part) => Number(part.trim()))
                .filter((value) => Number.isFinite(value) && value > 0);
              if (revisionIntervalsDays.length > 0) void store.updateSettings({ ...store.settings, revisionIntervalsDays });
            }}
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Default mock template
          <select
            className={fieldClass}
            value={store.settings.examTemplateId}
            onChange={(event) => void store.updateSettings({ ...store.settings, examTemplateId: event.target.value })}
          >
            {store.templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={`${cardClass} grid gap-3`}>
        <h2 className="font-serif text-2xl">Exam template</h2>
        <label className={labelClass}>
          Edit
          <select className={fieldClass} value={editing?.id ?? ""} onChange={(event) => loadTemplate(event.target.value)}>
            {store.templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {editing ? (
          <>
            <label className={labelClass}>
              Name
              <input className={fieldClass} value={editing.name} onChange={(event) => setTemplate({ ...editing, name: event.target.value })} />
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={labelClass}>
                Minutes
                <input
                  className={fieldClass}
                  type="number"
                  min={1}
                  value={Math.round(editing.durationSeconds / 60)}
                  onChange={(event) => setTemplate({ ...editing, durationSeconds: Number(event.target.value) * 60 })}
                />
              </label>
              <label className={labelClass}>
                Marks per correct
                <input
                  className={fieldClass}
                  type="number"
                  step="0.1"
                  value={editing.marksPerCorrect}
                  onChange={(event) => setTemplate({ ...editing, marksPerCorrect: Number(event.target.value) })}
                />
              </label>
              <label className={labelClass}>
                Penalty per wrong
                <input
                  className={fieldClass}
                  type="number"
                  step="0.1"
                  value={editing.penaltyPerWrong}
                  onChange={(event) => setTemplate({ ...editing, penaltyPerWrong: Number(event.target.value) })}
                />
              </label>
            </div>
            <label className={labelClass}>
              Pass mark
              <input
                className={fieldClass}
                type="number"
                value={editing.passMark ?? ""}
                onChange={(event) => setTemplate({ ...editing, passMark: event.target.value === "" ? null : Number(event.target.value) })}
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(editing.topicWeights).map(([code, marks]) => (
                <label key={code} className={labelClass}>
                  {code}
                  <input
                    className={fieldClass}
                    type="number"
                    min={0}
                    value={marks}
                    onChange={(event) =>
                      setTemplate({
                        ...editing,
                        topicWeights: { ...editing.topicWeights, [code]: Number(event.target.value) },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <p className="text-sm">{validateBlueprint(editing.topicWeights, editing.totalMarks).message} Total marks stay {formatMarks(editing.totalMarks)} until you change that field to match.</p>
            <label className={labelClass}>
              Total marks
              <input
                className={fieldClass}
                type="number"
                value={editing.totalMarks}
                onChange={(event) => {
                  const totalMarks = Number(event.target.value);
                  setTemplate({
                    ...editing,
                    totalMarks,
                    questionCount: editing.marksPerCorrect === 0 ? editing.questionCount : totalMarks / editing.marksPerCorrect,
                  });
                }}
              />
            </label>
            <label className={labelClass}>
              Source note
              <textarea className={fieldClass} rows={3} value={editing.sourceNote} onChange={(event) => setTemplate({ ...editing, sourceNote: event.target.value })} />
            </label>
            {templateMessage ? <p className="text-sm text-warn">{templateMessage}</p> : null}
            <button type="button" className={primaryButtonClass} onClick={() => void saveTemplate()}>
              Save template
            </button>
          </>
        ) : null}
      </section>

      <section className={`${cardClass} grid gap-3`}>
        <h2 className="font-serif text-2xl">Import questions</h2>
        <p className="text-sm leading-6 text-muted">
          CSV or JSON is checked before anything is saved. Unknown topics, broken options, bad statuses, and duplicates are rejected. Accepted rows are stored as drafts.
        </p>
        <div className="flex flex-wrap gap-2">
          <a className={quietButtonClass} href="/samples/questions.sample.json">
            Sample JSON
          </a>
          <a className={quietButtonClass} href="/samples/questions.invalid.json">
            Invalid sample
          </a>
          <button
            type="button"
            className={quietButtonClass}
            onClick={() => downloadText("questions-template.csv", questionsToCsv([]), "text/csv")}
          >
            CSV template
          </button>
        </div>
        <label className={labelClass}>
          File
          <input
            className={fieldClass}
            type="file"
            accept=".csv,.json,application/json,text/csv"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readImport(file);
            }}
          />
        </label>
        {preview ? (
          <div className="grid gap-2 text-sm">
            <p>
              {preview.filename}: {preview.result.accepted.length} ready, {preview.result.errors.length} rejected, {preview.result.duplicates.length} duplicates.
            </p>
            {preview.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
            <ul className="grid gap-1">
              {preview.result.errors.map((error) => (
                <li key={`${error.row}-${error.message}`} className="text-bad">
                  Row {error.row}: {error.message}
                </li>
              ))}
              {preview.result.duplicates.map((duplicate) => (
                <li key={`${duplicate.row}-${duplicate.existingId}`}>
                  Row {duplicate.row}: {duplicate.kind} duplicate of {duplicate.existingId}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={preview.result.accepted.length === 0}
              onClick={() => void store.commitImport(preview.result, preview.filename, preview.format).then(() => setPreview(null))}
            >
              Save accepted drafts
            </button>
          </div>
        ) : null}
      </section>

      <section className={`${cardClass} grid gap-3`}>
        <h2 className="font-serif text-2xl">Backup and restore</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={quietButtonClass}
            onClick={() => void store.exportBackup().then((backup) => downloadText(`loksewa-backup-${backup.exportedAt.slice(0, 10)}.json`, JSON.stringify(backup, null, 2)))}
          >
            Export JSON backup
          </button>
          <button
            type="button"
            className={quietButtonClass}
            onClick={() => {
              const csv = questionsToCsv(
                store.questions.map((question) => ({
                  ...question,
                  nodeCode: store.syllabus.find((node) => node.id === question.nodeId)?.code ?? question.nodeId,
                })),
              );
              downloadText("questions.csv", csv, "text/csv");
            }}
          >
            Export questions CSV
          </button>
        </div>
        <label className={labelClass}>
          Restore file
          <input
            className={fieldClass}
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void file.text().then((text) => {
                try {
                  setRestoreFile(JSON.parse(text) as unknown);
                  setRestoreMessage(null);
                } catch {
                  setRestoreFile(null);
                  setRestoreMessage("That file is not valid JSON.");
                }
              });
            }}
          />
        </label>
        {restorePreview ? (
          <div className="text-sm">
            <p>{restorePreview.message}</p>
            {restorePreview.ok ? (
              <ul className="mt-2 grid gap-1">
                {Object.entries(restorePreview.counts).map(([key, count]) => (
                  <li key={key}>
                    {key}: {count}
                  </li>
                ))}
              </ul>
            ) : null}
            {restorePreview.conflicts.map((conflict) => (
              <p key={conflict}>{conflict}</p>
            ))}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={quietButtonClass}
                disabled={!restorePreview.backup}
                onClick={() => {
                  if (restorePreview.backup) void store.restore(restorePreview.backup, "merge").then(() => setRestoreMessage("Merged into the local library."));
                }}
              >
                Merge
              </button>
              <button type="button" className={dangerButtonClass} disabled={!restorePreview.backup} onClick={() => setConfirmReplace(true)}>
                Replace everything
              </button>
            </div>
          </div>
        ) : null}
        {restoreMessage ? <p className="text-sm">{restoreMessage}</p> : null}
      </section>

      <section className={cardClass}>
        <h2 className="font-serif text-2xl">Delete local data</h2>
        <p className="mt-2 text-sm leading-6 text-muted">This clears attempts, imports, notes, and bookmarks, then restores the original demo seed. Export a backup first if you need the data.</p>
        <button type="button" className={`${dangerButtonClass} mt-3`} onClick={() => setConfirmReset(true)}>
          Delete and restore demo
        </button>
      </section>
      <ConfirmDialog
        open={confirmReset}
        danger
        title="Delete local data?"
        body="This removes the library in this browser and loads the demo seed again."
        confirmLabel="Delete data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          void store.resetDemo();
        }}
      />
      <ConfirmDialog
        open={confirmReplace}
        danger
        title="Replace the local library?"
        body="The current browser data will be replaced by this backup."
        confirmLabel="Replace"
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => {
          setConfirmReplace(false);
          if (restorePreview?.backup) void store.restore(restorePreview.backup, "replace").then(() => setRestoreMessage("Library replaced from the backup."));
        }}
      />
    </div>
  );
}
