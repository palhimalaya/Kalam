"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { cardClass, fieldClass, labelClass, primaryButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { isPracticeEligible } from "@/domain/eligibility";

export function PracticeSetup() {
  const store = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const presetTopic = params.get("topic");
  const presetQuestions = params.get("questions");
  const [mode, setMode] = useState<"learn" | "timed_practice">("learn");
  const [selected, setSelected] = useState<string[]>(presetTopic ? [presetTopic] : []);
  const [difficulty, setDifficulty] = useState<"any" | "easy" | "medium" | "hard">("any");
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(20);
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [incorrectOnly, setIncorrectOnly] = useState(params.get("incorrect") === "1");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(params.get("bookmarked") === "1");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const active = store.attempts.filter((attempt) => attempt.status === "in_progress" && attempt.mode !== "mock");
  const questionIds = useMemo(() => (presetQuestions ? presetQuestions.split(",").filter(Boolean) : null), [presetQuestions]);

  async function start() {
    setPending(true);
    setMessage(null);
    const result = await store.startPractice({
      mode,
      nodeIds: selected,
      questionIds,
      difficulty,
      unseenOnly,
      incorrectOnly,
      bookmarkedOnly,
      count,
      minutes: mode === "timed_practice" ? minutes : null,
    });
    setPending(false);
    if (result.error || !result.id) {
      setMessage(result.error ?? "Practice could not start.");
      return;
    }
    if (result.warnings.length > 0) setMessage(result.warnings.join(" "));
    router.push(`/practice/${result.id}`);
  }

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-serif text-4xl">Practice</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Learn mode shows the answer immediately. Timed mode hides it until you end the session. Only verified or live questions with usable rights are included.
        </p>
      </header>
      {active.map((attempt) => (
        <article key={attempt.id} className={cardClass}>
          <p className="text-sm text-muted">In progress</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-2xl">{attempt.title}</h2>
            <Link className={primaryButtonClass} href={`/practice/${attempt.id}`}>
              Resume
            </Link>
          </div>
        </article>
      ))}
      <form
        className={cardClass}
        onSubmit={(event) => {
          event.preventDefault();
          void start();
        }}
      >
        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold">Mode</legend>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === "learn"} onChange={() => setMode("learn")} /> Learn
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="radio" name="mode" checked={mode === "timed_practice"} onChange={() => setMode("timed_practice")} /> Timed
          </label>
        </fieldset>
        {questionIds ? (
          <p className="mt-3 text-sm">This session will use {questionIds.length} selected questions.</p>
        ) : (
          <fieldset className="mt-4 grid gap-2">
            <legend className="text-sm font-semibold">Topics</legend>
            {store.syllabus.map((node) => {
              const ready = store.questions.filter((question) => question.nodeId === node.id && isPracticeEligible(question)).length;
              return (
                <label key={node.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(node.id)}
                    onChange={() =>
                      setSelected((current) => (current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id]))
                    }
                  />
                  {node.code} · {node.title}
                  <span className="text-muted">({ready})</span>
                </label>
              );
            })}
            <p className="text-xs text-muted">Leave every topic clear to use the whole eligible bank.</p>
          </fieldset>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className={labelClass}>
            Difficulty
            <select className={fieldClass} value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}>
              <option value="any">Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className={labelClass}>
            Questions
            <input className={fieldClass} type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} />
          </label>
          {mode === "timed_practice" ? (
            <label className={labelClass}>
              Minutes
              <input className={fieldClass} type="number" min={1} max={180} value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} />
            </label>
          ) : null}
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={unseenOnly} onChange={(event) => setUnseenOnly(event.target.checked)} /> Unseen only
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={incorrectOnly} onChange={(event) => setIncorrectOnly(event.target.checked)} /> Previously incorrect
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" checked={bookmarkedOnly} onChange={(event) => setBookmarkedOnly(event.target.checked)} /> Bookmarked
          </label>
        </div>
        {message ? (
          <p className="mt-3 text-sm text-warn" role="status">
            {message}
          </p>
        ) : null}
        <button className={`${primaryButtonClass} mt-4`} type="submit" disabled={pending || !store.ready}>
          {pending ? "Starting…" : "Start"}
        </button>
      </form>
    </div>
  );
}
