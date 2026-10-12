"use client";

import Link from "next/link";
import { cardClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";
import { isPracticeEligible } from "@/domain/eligibility";

export default function SyllabusPage() {
  const store = useStore();
  const parts = ["I", "II"] as const;

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-serif text-4xl">Syllabus</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          These are the proposed Paper I topics and marks. Clause wording is not in the app because it was not supplied. Import an authorised syllabus file through a backup if you have one. Do not treat the marks as an official notice.
        </p>
      </header>
      {store.syllabus.length === 0 ? <p className={cardClass}>No syllabus is stored in this browser yet.</p> : null}
      {parts.map((part) => (
        <section key={part} className="grid gap-3">
          <h2 className="font-serif text-2xl">Part {part}</h2>
          <div className="grid gap-3">
            {store.syllabus
              .filter((node) => node.part === part)
              .map((node) => {
                const questions = store.questions.filter((question) => question.nodeId === node.id);
                const eligible = questions.filter(isPracticeEligible).length;
                return (
                  <article key={node.id} className={cardClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{node.code}</p>
                        <h3 className="font-serif text-2xl">{node.title}</h3>
                        <p className="mt-1 text-sm text-muted">
                          {node.marks ?? "—"} proposed marks · {eligible} practice-ready · {questions.length} in bank
                        </p>
                      </div>
                      <Link className={quietButtonClass} href={`/syllabus/${node.id}`}>
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
