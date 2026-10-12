"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { validateBlueprint } from "@/domain/blueprint";
import { isPracticeEligible } from "@/domain/eligibility";
import { buildQuestionHistory } from "@/domain/history";
import { selectMockQuestions } from "@/domain/selection";
import { cardClass, fieldClass, labelClass, primaryButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { formatClock } from "@/lib/format";

export default function MockPage() {
  const store = useStore();
  const router = useRouter();
  const [templateId, setTemplateId] = useState(store.settings.examTemplateId);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const template = store.templates.find((item) => item.id === templateId) ?? store.templates[0];
  const active = store.attempts.filter((attempt) => attempt.mode === "mock" && attempt.status === "in_progress");

  const preview = useMemo(() => {
    if (!template) return null;
    return selectMockQuestions({
      topicWeights: template.topicWeights,
      difficultyWeights: template.difficultyWeights,
      questions: store.questions,
      nodes: store.syllabus,
      history: buildQuestionHistory(store.attempts, store.items),
      seed: "preview",
    });
  }, [template, store.questions, store.syllabus, store.attempts, store.items]);

  async function start() {
    if (!template) return;
    setPending(true);
    const result = await store.startMock(template.id);
    setPending(false);
    if (!result.id) {
      setMessage(result.error ?? "Mock could not start.");
      return;
    }
    router.push(`/mock/${result.id}`);
  }

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-serif text-4xl">Mock exam</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          The timer is stored as a deadline, so a refresh does not add time. There is no pause and no calculator. Confirm these proposed rules against the current official notice.
        </p>
      </header>
      {active.map((attempt) => (
        <article key={attempt.id} className={cardClass}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-muted">Mock in progress</p>
              <h2 className="font-serif text-2xl">{attempt.title}</h2>
            </div>
            <Link className={primaryButtonClass} href={`/mock/${attempt.id}`}>
              Resume
            </Link>
          </div>
        </article>
      ))}
      <section className={cardClass}>
        <label className={labelClass}>
          Template
          <select className={fieldClass} value={template?.id ?? ""} onChange={(event) => setTemplateId(event.target.value)}>
            {store.templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {template ? (
          <div className="mt-4 grid gap-2 text-sm leading-6">
            <p>
              {template.questionCount} questions · {template.totalMarks} marks · {formatClock(template.durationSeconds)} · +{template.marksPerCorrect} correct · −{template.penaltyPerWrong} wrong · skipped {template.skippedMarks}
            </p>
            <p>Pass mark: {template.passMark ?? "not set"} · Calculator: {template.calculatorAllowed ? "allowed" : "not provided"}</p>
            <p>{template.sourceNote}</p>
            <p className="text-muted">Last checked against an official notice: {template.lastVerifiedAt ?? "not recorded"}.</p>
            <p>{validateBlueprint(template.topicWeights, template.totalMarks).message}</p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {Object.entries(template.topicWeights).map(([code, marks]) => {
                const node = store.syllabus.find((item) => item.code === code);
                const have = store.questions.filter((question) => question.nodeId === node?.id && isPracticeEligible(question)).length;
                return (
                  <li key={code}>
                    {code}: {marks} needed, {have} available
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-sm">No template is stored yet.</p>
        )}
        {preview && !preview.ok ? (
          <div className="mt-4 rounded-md border border-warn bg-paper p-3 text-sm" role="status">
            <p className="font-semibold">This paper cannot be built from the current bank.</p>
            <ul className="mt-2 grid gap-1">
              {preview.gaps.map((gap) => (
                <li key={gap.code}>
                  {gap.code} {gap.title}: needs {gap.needed}, has {gap.available}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {preview?.ok && preview.warnings.length > 0 ? (
          <ul className="mt-3 grid gap-1 text-xs text-muted">
            {preview.warnings.slice(0, 6).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-bad" role="alert">
            {message}
          </p>
        ) : null}
        <button className={`${primaryButtonClass} mt-4`} type="button" disabled={!template || pending || (preview ? !preview.ok : true)} onClick={() => void start()}>
          {pending ? "Starting…" : "Start mock"}
        </button>
      </section>
    </div>
  );
}
