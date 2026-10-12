"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/components/Store";
import { quietButtonClass } from "@/components/styles";

const links = [
  { href: "/", label: "Home" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/practice", label: "Practice" },
  { href: "/mock", label: "Mock" },
  { href: "/results", label: "Results" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
  { href: "/questions", label: "Bank" },
  { href: "/settings", label: "Settings" },
];

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-3 py-2 text-sm font-semibold ${active ? "bg-accent text-accentink" : "text-ink hover:bg-paper"}`}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { offline, ready, error } = useStore();
  const [more, setMore] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:bg-elev focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="hidden border-r border-line bg-elev lg:flex lg:flex-col lg:gap-6 lg:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Paper I</p>
          <p className="font-serif text-2xl leading-tight">Loksewa Civil</p>
        </div>
        <nav className="grid gap-1" aria-label="Primary">
          {links.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>
      </aside>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-elev/95 px-4 py-3 backdrop-blur lg:hidden">
          <p className="font-serif text-xl">Loksewa Civil</p>
          <button type="button" className={quietButtonClass} aria-expanded={more} onClick={() => setMore((open) => !open)}>
            Menu
          </button>
        </header>
        {more ? (
          <nav className="grid gap-1 border-b border-line bg-elev p-3 lg:hidden" aria-label="More">
            {links.map((link) => (
              <NavLink key={link.href} {...link} onClick={() => setMore(false)} />
            ))}
          </nav>
        ) : null}
        {offline ? (
          <p className="bg-warn px-4 py-2 text-sm text-white" role="status">
            You are offline. Answers stay in this browser.
          </p>
        ) : null}
        {!ready ? (
          <p className="px-4 py-2 text-sm text-muted" role="status">
            Opening your local study library…
          </p>
        ) : null}
        {error ? (
          <p className="bg-bad px-4 py-2 text-sm text-white" role="alert">
            {error}
          </p>
        ) : null}
        <main id="content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 lg:pb-10">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-4 text-xs leading-5 text-muted">
          Proposed exam rules are a starting point from the product brief, not an official PSC notice. Confirm the current notice before you rely on the duration, penalty, pass mark, or blueprint.
        </footer>
        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-elev lg:hidden" aria-label="Shortcuts">
          {[
            ["/", "Home"],
            ["/practice", "Practice"],
            ["/mock", "Mock"],
            ["/dashboard", "Dashboard"],
          ].map(([href, label]) => (
            <NavLink key={href} href={href!} label={label!} />
          ))}
        </nav>
      </div>
    </div>
  );
}
