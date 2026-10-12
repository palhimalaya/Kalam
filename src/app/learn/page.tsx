"use client";

import Link from "next/link";
import { useState } from "react";
import { RichText } from "@/components/RichText";
import { cardClass, fieldClass, primaryButtonClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { formatWhen } from "@/lib/format";

export default function LearnPage() {
  const store = useStore();
  const due = store.revisions.filter((item) => new Date(item.dueAt).getTime() <= Date.now());
  const [packId, setPackId] = useState(store.packs[0]?.id ?? "");
  const pack = store.packs.find((item) => item.id === packId) ?? store.packs[0];

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-serif text-4xl">Learn</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Knowledge packs stay tied to a source and a review status. Nothing here predicts that a topic is likely to appear in the exam. Past-paper frequency is shown only when you have entered sourced past-paper data, which this demo does not include.
        </p>
      </header>
      <section className={cardClass}>
        <h2 className="font-serif text-2xl">Revision queue</h2>
        <p className="mt-2 text-sm text-muted">
          Intervals: {store.settings.revisionIntervalsDays.join(", ")} days. A miss returns to the first interval.
        </p>
        {due.length === 0 ? <p className="mt-3 text-sm">Nothing is due. Wrong answers from finished sessions are queued here.</p> : null}
        <ul className="mt-3 grid gap-2">
          {store.revisions.map((item) => {
            const question = store.questions.find((entry) => entry.id === item.questionId);
            return (
              <li key={item.id} className="text-sm">
                {question?.stem.slice(0, 90) ?? item.questionId} · due {formatWhen(item.dueAt)} · stage {item.stage + 1}
              </li>
            );
          })}
        </ul>
        {due.length > 0 ? (
          <Link className={`${primaryButtonClass} mt-4`} href={`/practice?questions=${due.map((item) => item.questionId).join(",")}`}>
            Review due questions
          </Link>
        ) : null}
      </section>
      <section className={cardClass}>
        <label className="grid gap-1 text-sm font-medium">
          Knowledge pack
          <select className={fieldClass} value={pack?.id ?? ""} onChange={(event) => setPackId(event.target.value)}>
            {store.packs.map((item) => (
              <option key={item.id} value={item.id}>
                {store.syllabus.find((node) => node.id === item.nodeId)?.code} · {item.status}
              </option>
            ))}
          </select>
        </label>
        {pack ? (
          <div className="mt-4 grid gap-3 text-sm leading-6">
            <p>
              Status <strong>{pack.status}</strong>
              {pack.verifiedAt ? ` · reviewed ${pack.verifiedAt.slice(0, 10)}` : " · not reviewed"}
            </p>
            <p>{pack.syllabusText}</p>
            <h3 className="font-semibold">Concepts</h3>
            <ul className="list-disc pl-5">{pack.coreConcepts.map((item) => <li key={item}>{item}</li>)}</ul>
            {pack.formulaeAndTables.length > 0 ? (
              <>
                <h3 className="font-semibold">Formulae</h3>
                {pack.formulaeAndTables.map((item) => (
                  <RichText key={item} text={item} />
                ))}
              </>
            ) : null}
            <h3 className="font-semibold">Worked examples</h3>
            <ul className="list-disc pl-5">{pack.workedExamples.map((item) => <li key={item}>{item}</li>)}</ul>
            <h3 className="font-semibold">Common traps</h3>
            <ul className="list-disc pl-5">{pack.commonTraps.map((item) => <li key={item}>{item}</li>)}</ul>
            <p>{pack.nepalContext}</p>
            <h3 className="font-semibold">Sources</h3>
            <ul className="grid gap-2">
              {pack.sources.map((source) => (
                <li key={source.url}>
                  <a className="font-semibold underline" href={source.url}>
                    {source.title}
                  </a>
                  <span className="text-muted"> · accessed {source.accessedDate}. {source.claimSupported}</span>
                </li>
              ))}
            </ul>
            {pack.status === "draft" ? (
              <button
                type="button"
                className={quietButtonClass}
                onClick={() => void store.updatePack({ ...pack, status: "reviewed", verifiedAt: new Date().toISOString() })}
              >
                Mark pack reviewed
              </button>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm">No knowledge packs are stored.</p>
        )}
      </section>
    </div>
  );
}
