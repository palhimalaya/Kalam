"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { summarizeDashboard } from "@/domain/dashboard";
import { cardClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { formatMarks, formatPercent, formatWhen } from "@/lib/format";

const TrendChart = dynamic(() => import("@/components/TrendChart").then((mod) => mod.TrendChart), {
  ssr: false,
  loading: () => <p role="status">Loading chart…</p>,
});

export default function DashboardPage() {
  const store = useStore();
  if (!store.ready) return <p role="status">Loading dashboard…</p>;
  const model = summarizeDashboard({
    syllabus: store.syllabus,
    attempts: store.attempts,
    items: store.items,
    questions: store.questions,
    targetAccuracyPercent: store.settings.targetScore,
    now: new Date(),
  });

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-serif text-4xl">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Every figure is calculated from saved attempts. Mastery labels appear only after 10 scored answers in that topic.
        </p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Finished sessions", String(model.finishedAttempts)],
          ["Answered", String(model.answeredCount)],
          ["Accuracy", formatPercent(model.overallAccuracy)],
          ["Latest mock", model.latestMock ? formatMarks(model.latestMock.netScore) : "—"],
        ].map(([label, value]) => (
          <article key={label} className={cardClass}>
            <p className="text-sm text-muted">{label}</p>
            <p className="font-serif text-3xl">{value}</p>
          </article>
        ))}
      </section>
      <section className={cardClass}>
        <h2 className="font-serif text-2xl">Mock score trend</h2>
        <p className="mt-2 text-sm text-muted">{model.readinessNote}</p>
        {model.mockTrend.length === 0 ? <p className="mt-3 text-sm">No submitted mock yet.</p> : <TrendChart points={model.mockTrend} />}
        {model.bestMock ? <p className="mt-2 text-sm">Best saved mock: {formatMarks(model.bestMock.netScore)}.</p> : null}
      </section>
      <section className={cardClass}>
        <h2 className="font-serif text-2xl">Topics</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3">Topic</th>
                <th className="py-2 pr-3">Scored</th>
                <th className="py-2 pr-3">Accuracy</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2">Last practised</th>
              </tr>
            </thead>
            <tbody>
              {model.topics.map((topic) => (
                <tr key={topic.nodeId} className="border-b border-line">
                  <td className="py-2 pr-3">
                    {topic.code} {topic.title}
                  </td>
                  <td className="py-2 pr-3">{topic.answered}</td>
                  <td className="py-2 pr-3">{formatPercent(topic.accuracy)}</td>
                  <td className="py-2 pr-3">{topic.label}</td>
                  <td className="py-2">{formatWhen(topic.lastPractisedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className={cardClass}>
        <h2 className="font-serif text-2xl">What to practise next</h2>
        {model.recommendations.length === 0 ? <p className="mt-2 text-sm">Nothing is below your target accuracy.</p> : null}
        <ol className="mt-3 grid gap-3">
          {model.recommendations.slice(0, 5).map((item) => (
            <li key={item.code} className="rounded-md border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  {item.code} · {item.title}
                </h3>
                <Link className={quietButtonClass} href={`/practice?topic=${store.syllabus.find((node) => node.code === item.code)?.id ?? ""}`}>
                  Practise
                </Link>
              </div>
              <ul className="mt-2 grid gap-1 text-sm text-muted">
                {item.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
