"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RichText } from "@/components/RichText";
import { cardClass, fieldClass, primaryButtonClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { formatClock } from "@/lib/format";
import type { Confidence, OptionKey } from "@/domain/types";

const keys: OptionKey[] = ["A", "B", "C", "D"];

export function SessionRunner({ attemptId, kind }: { attemptId: string; kind: "practice" | "mock" }) {
  const store = useStore();
  const attempt = store.attempts.find((item) => item.id === attemptId);
  const [index, setIndex] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const hydrated = useRef(false);
  const shownAt = useRef<number | null>(null);
  const shownQuestion = useRef<string | null>(null);
  const submitting = useRef(false);

  const order = attempt?.questionOrder ?? [];
  const questionId = order[index];
  const question = store.questions.find((item) => item.id === questionId);
  const item = store.items.find((entry) => entry.attemptId === attemptId && entry.questionId === questionId);
  const savedNote = store.notes.find((entry) => entry.targetType === "question" && entry.targetId === questionId);

  useEffect(() => {
    if (!attempt || hydrated.current) return;
    hydrated.current = true;
    setIndex(Math.min(attempt.cursor, Math.max(attempt.questionOrder.length - 1, 0)));
  }, [attempt]);

  useEffect(() => {
    setNote(savedNote?.text ?? "");
  }, [savedNote?.text, questionId]);

  async function flushTime() {
    if (!attempt || attempt.status !== "in_progress" || !shownQuestion.current || shownAt.current === null) return;
    const seconds = Math.min(120, Math.round((Date.now() - shownAt.current) / 1000));
    shownAt.current = Date.now();
    if (seconds > 0) await store.addTime(attempt.id, shownQuestion.current, seconds);
  }

  useEffect(() => {
    if (!questionId || !attempt || attempt.status !== "in_progress") return;
    void flushTime();
    shownQuestion.current = questionId;
    shownAt.current = Date.now();
    return () => {
      void flushTime();
    };
    // Flush when the visible question changes. flushTime reads the latest refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, attempt?.status]);

  useEffect(() => {
    if (!attempt?.deadlineAt || attempt.status !== "in_progress") return;
    const tick = () => {
      const remain = new Date(attempt.deadlineAt!).getTime() - Date.now();
      setRemaining(remain);
      if (remain <= 0 && !submitting.current) {
        submitting.current = true;
        void flushTime().then(() => store.submit(attempt.id, "expired"));
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt?.id, attempt?.deadlineAt, attempt?.status]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
      if (!attempt || attempt.status !== "in_progress" || !question) return;
      const digit = keys[Number(event.key) - 1];
      if (digit) {
        event.preventDefault();
        void choose(digit);
      } else if (event.key === "n" || event.key === "j" || event.key === "ArrowRight") {
        event.preventDefault();
        void go(index + 1);
      } else if (event.key === "p" || event.key === "k" || event.key === "ArrowLeft") {
        event.preventDefault();
        void go(index - 1);
      } else if (event.key === "f") {
        event.preventDefault();
        void store.patchAnswer(attempt.id, question.id, { flaggedForReview: !item?.flaggedForReview }, false);
      } else if (event.key === "b") {
        event.preventDefault();
        void store.toggleBookmark(question.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!store.ready) return <p role="status">Opening the session…</p>;
  if (!attempt || !question || !item) {
    return (
      <section className={cardClass}>
        <h1 className="font-serif text-3xl">Session not found</h1>
        <p className="mt-2 text-sm text-muted">It is not in this browser’s library.</p>
        <Link className={`${quietButtonClass} mt-4`} href={kind === "mock" ? "/mock" : "/practice"}>
          Back
        </Link>
      </section>
    );
  }

  const reveal = attempt.mode === "learn";
  const finished = attempt.status !== "in_progress";
  const bookmarked = store.bookmarks.some((bookmark) => bookmark.questionId === question.id);
  const answered = attempt.questionOrder.filter((id) => store.items.some((entry) => entry.attemptId === attempt.id && entry.questionId === id && entry.chosenOption)).length;
  const flagged = store.items.filter((entry) => entry.attemptId === attempt.id && entry.flaggedForReview).length;

  async function choose(option: OptionKey) {
    if (finished) return;
    await store.patchAnswer(attempt!.id, question!.id, { chosenOption: option }, reveal);
  }

  async function go(next: number) {
    const clamped = Math.max(0, Math.min(order.length - 1, next));
    await flushTime();
    setIndex(clamped);
    await store.moveCursor(attempt!.id, clamped);
  }

  async function finish(reason: "manual" | "expired") {
    if (submitting.current && reason === "manual") return;
    submitting.current = true;
    await flushTime();
    await store.submit(attempt!.id, reason);
    setConfirm(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {attempt.mode === "mock" ? "Mock" : attempt.mode === "learn" ? "Learn" : "Timed practice"} · {index + 1} / {order.length}
            </p>
            <h1 className="font-serif text-3xl">{attempt.title}</h1>
          </div>
          {attempt.deadlineAt ? (
            <p className="rounded-md border border-line px-3 py-2 font-mono text-lg" aria-live="polite">
              {formatClock(Math.ceil((remaining ?? 0) / 1000))}
            </p>
          ) : null}
        </div>
        {attempt.mode === "mock" ? (
          <p className="mt-3 text-sm text-muted">No calculator is provided. The timer continues if you refresh or leave this tab. Answers stay hidden until submission.</p>
        ) : null}
        {question.demo ? (
          <p className="mt-3 rounded-md bg-paper px-3 py-2 text-sm text-warn">Demo question. Not an official PSC item.</p>
        ) : null}
        <div className="mt-4 text-lg">
          <RichText text={question.stem} />
        </div>
        <div className="mt-4 grid gap-2" role="group" aria-label="Answer choices">
          {question.options.map((option) => {
            const selected = item.chosenOption === option.key;
            const showCorrect = reveal && item.chosenOption && option.key === question.correctOption;
            const showWrong = reveal && selected && option.key !== question.correctOption;
            return (
              <button
                key={option.key}
                type="button"
                disabled={finished}
                aria-pressed={selected}
                onClick={() => void choose(option.key)}
                className={`min-h-11 rounded-md border px-3 py-3 text-left ${
                  showCorrect ? "border-good bg-good/10" : showWrong ? "border-bad bg-bad/10" : selected ? "border-accent bg-accent/10" : "border-line bg-paper"
                }`}
              >
                <span className="mr-2 font-semibold">{option.key}.</span>
                {option.text}
              </button>
            );
          })}
        </div>
        {reveal && item.chosenOption ? (
          <div className="mt-4 rounded-md border border-line bg-paper p-3 text-sm" aria-live="polite">
            <p className="font-semibold">{item.isCorrect ? "Correct" : `Correct answer: ${question.correctOption}`}</p>
            {question.shortExplanation ? (
              <div className="mt-2">
                <RichText text={question.shortExplanation} />
              </div>
            ) : (
              <p className="mt-2 text-muted">No explanation has been written for this question.</p>
            )}
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={quietButtonClass} disabled={index === 0} onClick={() => void go(index - 1)}>
            Previous
          </button>
          <button type="button" className={quietButtonClass} disabled={index >= order.length - 1} onClick={() => void go(index + 1)}>
            Next
          </button>
          <button
            type="button"
            className={quietButtonClass}
            disabled={finished || !item.chosenOption}
            onClick={() => void store.patchAnswer(attempt.id, question.id, { chosenOption: null }, reveal)}
          >
            Clear
          </button>
          <button
            type="button"
            className={quietButtonClass}
            disabled={finished}
            aria-pressed={item.flaggedForReview}
            onClick={() => void store.patchAnswer(attempt.id, question.id, { flaggedForReview: !item.flaggedForReview }, reveal)}
          >
            {item.flaggedForReview ? "Flagged" : "Flag"}
          </button>
          <button type="button" className={quietButtonClass} aria-pressed={bookmarked} onClick={() => void store.toggleBookmark(question.id)}>
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
        </div>
        <label className="mt-4 grid gap-1 text-sm">
          Confidence
          <select
            className={fieldClass}
            disabled={finished}
            value={item.confidence ?? ""}
            onChange={(event) =>
              void store.patchAnswer(
                attempt.id,
                question.id,
                { confidence: (event.target.value || null) as Confidence | null },
                reveal,
              )
            }
          >
            <option value="">Not set</option>
            <option value="sure">Sure</option>
            <option value="unsure">Unsure</option>
            <option value="guess">Guess</option>
          </select>
        </label>
        <label className="mt-3 grid gap-1 text-sm">
          Personal note
          <textarea className={fieldClass} rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <button type="button" className={`${quietButtonClass} mt-2`} onClick={() => void store.saveNote("question", question.id, note)}>
          Save note
        </button>
        <p className="mt-4 text-xs text-muted">Keys: 1–4 answer, N/P next and previous, F flag, B bookmark.</p>
      </section>
      <aside className={cardClass}>
        <h2 className="font-serif text-2xl">Paper</h2>
        <p className="mt-1 text-sm text-muted">
          {answered} answered · {order.length - answered} unanswered · {flagged} flagged
        </p>
        <div className="mt-3 grid grid-cols-5 gap-2" aria-label="Question palette">
          {order.map((id, position) => {
            const entry = store.items.find((row) => row.attemptId === attempt.id && row.questionId === id);
            const current = position === index;
            return (
              <button
                key={id}
                type="button"
                aria-current={current ? "true" : undefined}
                aria-label={`Question ${position + 1}${entry?.chosenOption ? ", answered" : ", unanswered"}${entry?.flaggedForReview ? ", flagged" : ""}`}
                className={`min-h-11 rounded-md border text-sm font-semibold ${
                  current ? "border-accent bg-accent text-accentink" : entry?.chosenOption ? "border-good bg-good/10" : "border-line"
                } ${entry?.flaggedForReview ? "ring-2 ring-warn" : ""}`}
                onClick={() => void go(position)}
              >
                {position + 1}
              </button>
            );
          })}
        </div>
        {finished ? (
          <Link className={`${primaryButtonClass} mt-4 w-full`} href={`/results/${attempt.id}`}>
            Open results
          </Link>
        ) : (
          <button type="button" className={`${primaryButtonClass} mt-4 w-full`} onClick={() => setConfirm(true)}>
            {attempt.mode === "mock" ? "Submit mock" : "End session"}
          </button>
        )}
        {finished ? (
          <p className="mt-3 text-sm" role="status">
            This session is {attempt.status === "expired" ? "auto-submitted" : "submitted"} and cannot be changed.
          </p>
        ) : null}
      </aside>
      <ConfirmDialog
        open={confirm}
        title={attempt.mode === "mock" ? "Submit this mock?" : "End this session?"}
        body="Unanswered questions score zero under the saved rules. After submission the answers cannot be changed."
        confirmLabel="Submit"
        onCancel={() => setConfirm(false)}
        onConfirm={() => void finish("manual")}
      />
    </div>
  );
}
