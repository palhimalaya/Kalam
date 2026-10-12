"use client";

import { useMemo, useState } from "react";
import { eligibilityBlockReason } from "@/domain/eligibility";
import { cardClass, fieldClass, labelClass, primaryButtonClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import type { OptionKey, Question, ReviewStatus } from "@/domain/types";

const statuses: ReviewStatus[] = ["draft", "needs_verification", "verified", "live", "flagged", "retired"];

export default function QuestionsPage() {
  const store = useStore();
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [nodeId, setNodeId] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      store.questions.filter((question) => {
        if (status !== "all" && question.reviewStatus !== status) return false;
        if (nodeId !== "all" && question.nodeId !== nodeId) return false;
        if (query && !question.stem.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [store.questions, status, nodeId, query],
  );
  const selected = store.questions.find((question) => question.id === selectedId) ?? null;
  const [draft, setDraft] = useState<Question | null>(null);
  const editing = draft && draft.id === selected?.id ? draft : selected;

  function choose(question: Question) {
    setSelectedId(question.id);
    setDraft(structuredClone(question));
    setChecked(false);
    setMessage(null);
  }

  async function save() {
    if (!editing) return;
    if ((editing.reviewStatus === "verified" || editing.reviewStatus === "live") && !checked) {
      setMessage("Confirm that you checked the answer, explanation, and rights before saving a verified or live question.");
      return;
    }
    await store.updateQuestion(editing);
    setMessage("Saved. Practice and mocks only use verified or live questions that are not restricted.");
    setDraft(null);
  }

  if (!store.ready) return <p role="status">Loading the question bank…</p>;

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-serif text-4xl">Question bank</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Imported questions stay in draft until you review them. A live or verified status is what makes a question eligible, and restricted rights still block it.
        </p>
      </header>
      <section className={`${cardClass} grid gap-3 sm:grid-cols-3`}>
        <label className={labelClass}>
          Status
          <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">All</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Topic
          <select className={fieldClass} value={nodeId} onChange={(event) => setNodeId(event.target.value)}>
            <option value="all">All</option>
            {store.syllabus.map((node) => (
              <option key={node.id} value={node.id}>
                {node.code}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Search
          <input className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Stem" />
        </label>
      </section>
      {visible.length === 0 ? <p className={cardClass}>No questions match these filters.</p> : null}
      <ul className="grid gap-2">
        {visible.map((question) => (
          <li key={question.id}>
            <button type="button" className={`${cardClass} w-full text-left`} onClick={() => choose(question)}>
              <span className="text-xs uppercase tracking-[0.12em] text-muted">
                {store.syllabus.find((node) => node.id === question.nodeId)?.code} · {question.reviewStatus} · {question.rightsStatus}
                {question.demo ? " · demo" : ""}
              </span>
              <span className="mt-1 block text-sm">{question.stem}</span>
            </button>
          </li>
        ))}
      </ul>
      {editing ? (
        <form
          className={`${cardClass} grid gap-3`}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <h2 className="font-serif text-2xl">Edit</h2>
          <label className={labelClass}>
            Stem
            <textarea className={fieldClass} rows={4} value={editing.stem} onChange={(event) => setDraft({ ...editing, stem: event.target.value })} />
          </label>
          {editing.options.map((option, index) => (
            <label key={option.key} className={labelClass}>
              Option {option.key}
              <input
                className={fieldClass}
                value={option.text}
                onChange={(event) => {
                  const options = editing.options.map((item, itemIndex) => (itemIndex === index ? { ...item, text: event.target.value } : item));
                  setDraft({ ...editing, options });
                }}
              />
            </label>
          ))}
          <label className={labelClass}>
            Correct option
            <select
              className={fieldClass}
              value={editing.correctOption}
              onChange={(event) => setDraft({ ...editing, correctOption: event.target.value as OptionKey })}
            >
              {editing.options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.key}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Short explanation
            <textarea
              className={fieldClass}
              rows={3}
              value={editing.shortExplanation ?? ""}
              onChange={(event) => setDraft({ ...editing, shortExplanation: event.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Status
              <select
                className={fieldClass}
                value={editing.reviewStatus}
                onChange={(event) => setDraft({ ...editing, reviewStatus: event.target.value as ReviewStatus })}
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Rights
              <select
                className={fieldClass}
                value={editing.rightsStatus}
                onChange={(event) => setDraft({ ...editing, rightsStatus: event.target.value as Question["rightsStatus"] })}
              >
                {["original", "permission_confirmed", "licensed", "link_only", "private_study_only", "unknown", "restricted"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            Source name
            <input className={fieldClass} value={editing.sourceName ?? ""} onChange={(event) => setDraft({ ...editing, sourceName: event.target.value })} />
          </label>
          <label className={labelClass}>
            Source URL
            <input className={fieldClass} value={editing.sourceUrl ?? ""} onChange={(event) => setDraft({ ...editing, sourceUrl: event.target.value })} />
          </label>
          <p className="text-sm text-muted">{eligibilityBlockReason(editing.reviewStatus, editing.rightsStatus) ?? "Eligible for practice and mocks."}</p>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
            I checked the answer, explanation, source, and rights.
          </label>
          {message ? <p className="text-sm text-warn">{message}</p> : null}
          <div className="flex gap-2">
            <button className={primaryButtonClass} type="submit">
              Save
            </button>
            <button className={quietButtonClass} type="button" onClick={() => setDraft(null)}>
              Close
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
