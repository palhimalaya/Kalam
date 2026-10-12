"use client";

import Link from "next/link";
import { cardClass, primaryButtonClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { isPracticeEligible } from "@/domain/eligibility";

export function TopicDetail({ nodeId }: { nodeId: string }) {
  const store = useStore();
  const node = store.syllabus.find((item) => item.id === nodeId);
  const pack = store.packs.find((item) => item.nodeId === nodeId);
  const questions = store.questions.filter((question) => question.nodeId === nodeId);
  const note = store.notes.find((item) => item.targetType === "syllabus_node" && item.targetId === nodeId);

  if (!store.ready) return <p role="status">Loading topic…</p>;
  if (!node) {
    return (
      <section className={cardClass}>
        <h1 className="font-serif text-3xl">Topic not found</h1>
        <Link className={`${quietButtonClass} mt-4`} href="/syllabus">
          Back to syllabus
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      <section className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Part {node.part} · {node.code}
        </p>
        <h1 className="font-serif text-4xl">{node.title}</h1>
        <p className="mt-2 text-sm text-muted">{node.marks ?? "—"} proposed marks</p>
        <div className="mt-4 rounded-md border border-dashed border-line bg-paper p-3 text-sm leading-6">
          {node.clauseText ??
            "Clause text has not been loaded. The brief mentions about 120 clauses, but this project does not invent their wording."}
        </div>
        {node.sourceRef ? <p className="mt-3 text-xs leading-5 text-muted">{node.sourceRef}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className={primaryButtonClass} href={`/practice?topic=${node.id}`}>
            Practise this topic
          </Link>
          <Link className={quietButtonClass} href="/syllabus">
            All topics
          </Link>
        </div>
      </section>
      <section className={cardClass}>
        <h2 className="font-serif text-2xl">Question bank</h2>
        <ul className="mt-3 grid gap-1 text-sm">
          {["draft", "needs_verification", "verified", "live", "flagged", "retired"].map((status) => (
            <li key={status}>
              {status.replaceAll("_", " ")}: {questions.filter((question) => question.reviewStatus === status).length}
            </li>
          ))}
          <li>Practice eligible: {questions.filter(isPracticeEligible).length}</li>
        </ul>
      </section>
      <section className={cardClass}>
        <h2 className="font-serif text-2xl">Knowledge pack</h2>
        {pack ? (
          <div className="mt-3 grid gap-2 text-sm leading-6">
            <p>
              Status: <strong>{pack.status}</strong>
              {pack.verifiedAt ? ` · checked ${pack.verifiedAt.slice(0, 10)}` : ""}
            </p>
            <p>{pack.syllabusText}</p>
            {pack.status === "draft" ? <p className="text-warn">This pack is a draft and is not shown as settled study material.</p> : null}
            <Link className={quietButtonClass} href="/learn">
              Open learning desk
            </Link>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No knowledge pack is linked to this topic.</p>
        )}
      </section>
      {note ? (
        <section className={cardClass}>
          <h2 className="font-serif text-2xl">Your note</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{note.text}</p>
        </section>
      ) : null}
    </div>
  );
}
