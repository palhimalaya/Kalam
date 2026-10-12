"use client";

import Link from "next/link";
import { cardClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { formatMarks, formatWhen } from "@/lib/format";

export default function ResultsPage() {
  const store = useStore();
  if (!store.ready) return <p role="status">Loading results…</p>;
  const finished = store.attempts
    .filter((attempt) => attempt.status !== "in_progress")
    .slice()
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-serif text-4xl">Results</h1>
        <p className="mt-2 text-sm text-muted">Scores use the rules saved with each attempt, so later setting changes do not rewrite history.</p>
      </header>
      {finished.length === 0 ? <p className={cardClass}>No finished sessions yet. A submitted practice or mock will appear here.</p> : null}
      <ul className="grid gap-3">
        {finished.map((attempt) => (
          <li key={attempt.id} className={cardClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {attempt.mode} · {attempt.status}
                </p>
                <h2 className="font-serif text-2xl">{attempt.title}</h2>
                <p className="text-sm text-muted">
                  {formatWhen(attempt.submittedAt)} · net {formatMarks(attempt.netScore)} / {attempt.templateSnapshot.totalMarks} · {attempt.correctCount} correct, {attempt.wrongCount} wrong, {attempt.skippedCount} skipped
                </p>
              </div>
              <Link className={quietButtonClass} href={`/results/${attempt.id}`}>
                Review
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
