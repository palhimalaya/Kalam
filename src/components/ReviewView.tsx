"use client";

import Link from "next/link";
import { RichText } from "@/components/RichText";
import { cardClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { scoreAttempt } from "@/domain/scoring";
import { formatClock, formatMarks, formatWhen } from "@/lib/format";

export function ReviewView({ attemptId }: { attemptId: string }) {
  const store = useStore();
  const attempt = store.attempts.find((item) => item.id === attemptId);

  if (!store.ready) return <p role="status">Loading review…</p>;
  if (!attempt) {
    return (
      <section className={cardClass}>
        <h1 className="font-serif text-3xl">Result not found</h1>
        <Link className={`${quietButtonClass} mt-4`} href="/results">
          All results
        </Link>
      </section>
    );
  }
  if (attempt.status === "in_progress") {
    return (
      <section className={cardClass}>
        <h1 className="font-serif text-3xl">This session is still open</h1>
        <Link className={`${primaryLink} mt-4`} href={attempt.mode === "mock" ? `/mock/${attempt.id}` : `/practice/${attempt.id}`}>
          Return to session
        </Link>
      </section>
    );
  }

  const items = attempt.questionOrder
    .map((questionId) => store.items.find((item) => item.attemptId === attempt.id && item.questionId === questionId))
    .filter((item) => item !== undefined);
  const correctById = new Map(store.questions.map((question) => [question.id, question.correctOption]));
  const scored = scoreAttempt(attempt.templateSnapshot, items, correctById);
  const rules = attempt.templateSnapshot;
  const wrongIds = items.filter((item) => item.isCorrect === false).map((item) => item.questionId);
  const passed = rules.passMark !== null && attempt.mode === "mock" ? attempt.netScore >= rules.passMark : null;

  return (
    <div className="grid gap-4">
      <section className={cardClass}>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          {attempt.mode} · {attempt.status}
        </p>
        <h1 className="font-serif text-4xl">{attempt.title}</h1>
        <p className="mt-2 text-sm text-muted">{formatWhen(attempt.submittedAt)}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Net score", `${formatMarks(attempt.netScore)} / ${rules.totalMarks}`],
            ["Correct", String(attempt.correctCount)],
            ["Wrong", String(attempt.wrongCount)],
            ["Skipped", String(attempt.skippedCount)],
            ["Raw score", formatMarks(attempt.rawScore)],
            ["Penalty", formatMarks(attempt.penaltyMarks)],
            ["Time used", formatClock(attempt.durationSeconds)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="font-serif text-2xl">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-6">
          Net = {attempt.correctCount} × {rules.marksPerCorrect} − {attempt.wrongCount} × {rules.penaltyPerWrong}
          {rules.skippedMarks !== 0 ? ` + ${attempt.skippedCount} × ${rules.skippedMarks}` : ""}. These rules were copied when the session started.
        </p>
        {passed !== null ? (
          <p className="mt-2 text-sm">
            Proposed pass mark {rules.passMark}: {passed ? "at or above the mark" : "below the mark"}. This is not an official result.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {wrongIds.length > 0 ? (
            <Link className={quietButtonClass} href={`/practice?questions=${wrongIds.join(",")}`}>
              Drill these mistakes
            </Link>
          ) : null}
          <Link className={quietButtonClass} href="/dashboard">
            Dashboard
          </Link>
        </div>
      </section>
      {attempt.questionOrder.map((questionId, index) => {
        const question = store.questions.find((item) => item.id === questionId);
        const item = items.find((entry) => entry.questionId === questionId);
        const impact = scored.itemImpacts.find((entry) => entry.questionId === questionId);
        const node = store.syllabus.find((entry) => entry.id === question?.nodeId);
        const pack = store.packs.find((entry) => entry.nodeId === question?.nodeId && entry.status !== "draft");
        if (!question || !item) {
          return (
            <article key={questionId} className={cardClass}>
              Question {index + 1} is missing from this browser.
            </article>
          );
        }
        return (
          <article key={questionId} className={cardClass}>
            <p className="text-xs text-muted">
              {index + 1}. {node?.code} · {impact?.outcome} · {formatMarks(impact?.impact ?? 0)} · {formatClock(item.timeSpentSeconds)}
            </p>
            <div className="mt-2">
              <RichText text={question.stem} />
            </div>
            <ul className="mt-3 grid gap-1 text-sm">
              {question.options.map((option) => (
                <li key={option.key} className={option.key === question.correctOption ? "font-semibold text-good" : option.key === item.chosenOption ? "text-bad" : ""}>
                  {option.key}. {option.text}
                  {option.key === item.chosenOption ? " · your answer" : ""}
                  {option.key === question.correctOption ? " · correct" : ""}
                </li>
              ))}
            </ul>
            {question.shortExplanation ? (
              <div className="mt-3 text-sm">
                <RichText text={question.shortExplanation} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No explanation is stored.</p>
            )}
            {question.detailedExplanation ? (
              <div className="mt-2 text-sm">
                <RichText text={question.detailedExplanation} />
              </div>
            ) : null}
            <p className="mt-3 text-xs leading-5 text-muted">
              Source: {question.sourceName ?? "not recorded"}
              {question.sourceUrl ? ` · ${question.sourceUrl}` : ""} · rights {question.rightsStatus} · status {question.reviewStatus}
              {question.demo ? " · demo" : ""}
            </p>
            {pack ? <p className="mt-2 text-sm">Knowledge pack: {pack.coreConcepts[0]}</p> : null}
            {node ? (
              <Link className={`${quietButtonClass} mt-3`} href={`/practice?topic=${node.id}`}>
                Practise {node.code}
              </Link>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

const primaryLink = quietButtonClass;
