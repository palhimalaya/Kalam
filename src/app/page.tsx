"use client";

import Link from "next/link";
import { isPracticeEligible } from "@/domain/eligibility";
import { cardClass, primaryButtonClass, quietButtonClass } from "@/components/styles";
import { useStore } from "@/components/Store";

export default function HomePage() {
  const store = useStore();
  const active = store.attempts.filter((attempt) => attempt.status === "in_progress");
  const eligible = store.questions.filter(isPracticeEligible).length;

  return (
    <div className="grid gap-5">
      <section className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Level 7 Civil · Paper I</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">Practise the paper without a server.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Syllabus topics, learn and timed practice, a full mock, review, and a dashboard all stay in this browser. The built-in questions are labelled demo content. Import your own authorised file when you are ready, and keep new questions in draft until you verify them.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link className={primaryButtonClass} href="/practice">
            Start practice
          </Link>
          <Link className={quietButtonClass} href="/mock">
            Sit a mock
          </Link>
          <Link className={quietButtonClass} href="/syllabus">
            Browse syllabus
          </Link>
        </div>
      </section>
      {active.length > 0 ? (
        <section className={cardClass}>
          <h2 className="font-serif text-2xl">Resume</h2>
          <ul className="mt-3 grid gap-2">
            {active.map((attempt) => (
              <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-3 py-2">
                <span>
                  {attempt.title}
                  <span className="ml-2 text-sm text-muted">{attempt.mode}</span>
                </span>
                <Link className={quietButtonClass} href={attempt.mode === "mock" ? `/mock/${attempt.id}` : `/practice/${attempt.id}`}>
                  Continue
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Topics", String(store.syllabus.length)],
          ["Questions in bank", String(store.questions.length)],
          ["Verified or live", String(eligible)],
        ].map(([label, value]) => (
          <article key={label} className={cardClass}>
            <p className="text-sm text-muted">{label}</p>
            <p className="font-serif text-3xl">{store.ready ? value : "…"}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
