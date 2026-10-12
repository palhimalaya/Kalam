"use client";

import { quietButtonClass } from "@/components/styles";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="rounded-xl border border-line bg-elev p-5" role="alert">
      <h1 className="font-serif text-3xl">This page failed to load</h1>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button type="button" className={`${quietButtonClass} mt-4`} onClick={reset}>
        Try again
      </button>
    </section>
  );
}
