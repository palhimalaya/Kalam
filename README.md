# Loksewa Civil MCQ Trainer

Personal, local-first practice app for Nepal Public Service Commission Level 7 Civil Engineering Paper I. It runs in the browser with no account, no paid API, and no hosted database.

## Stack

- Next.js, React, and TypeScript
- Tailwind CSS
- IndexedDB through `idb`
- Zod for import and backup validation
- Vitest for the exam engine
- KaTeX for `$formula$` text, Papa Parse for CSV, and Recharts for the mock trend

The deployment note in `docs/FREE_STACK_AND_DEPLOYMENT.md` describes Neon Postgres and Prisma. The product decisions, architecture, and master prompt say the first version is local-first and must work with every external service unavailable. This build follows that decision. Hosted Postgres is not included.

## Local setup

```bash
npm install
npm test
npm run typecheck
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production check:

```bash
npm run build
npm start
```

`.env.example` has a placeholder only. The app does not read environment variables.

## What you can do

- Browse the proposed syllabus topics. Clause wording is empty on purpose: it was not supplied, and the app does not invent it.
- Practise in Learn mode or Timed mode. Filter by topic, difficulty, unseen, incorrect, or bookmarked questions.
- Sit the proposed 100-mark mock, or the 14-question demo paper that fits the built-in bank.
- Resume after refresh. Mock time comes from a saved deadline, so a reload does not add time. At zero the mock submits once.
- Review every question, then open a dashboard calculated from saved attempts.
- Import CSV or JSON, preview errors and duplicates, and save accepted rows as drafts.
- Export a JSON backup or a question CSV, then merge or replace from a backup.
- Delete the local library and return to the demo seed.

## Demo content

The seeded questions are original demo items. They are labelled in the interface and in `reviewNotes`. They are not official PSC questions and have not had an independent subject review. Only questions with status `verified` or `live`, and without restricted rights, enter practice or a mock.

The proposed rules are 100 questions, 90 minutes, 1 mark for a correct answer, 0.2 deducted for a wrong answer, zero for an unanswered question, and a pass mark of 40. Confirm the current official notice before you rely on them. Templates stay editable. A finished attempt keeps the rules it started with.

The full proposed paper needs more verified questions than the demo bank. The mock screen lists the shortfall instead of building a short paper. Use **Demo short paper** to try submission, review, and the dashboard.

## Backup

Settings → Export JSON backup downloads the syllabus, questions, attempts, notes, bookmarks, and packs. Restore shows a preview. Merge keeps current records and skips conflicting question fingerprints. Replace asks for confirmation, then overwrites this browser’s library.

Question text is rendered as text. CSV cells that start with `=`, `+`, `-`, or `@` are prefixed on export so a spreadsheet does not treat them as formulas.

IndexedDB is the only copy. Clearing site data, or using another browser, loses it unless you exported a backup.

## Installable app

`public/manifest.webmanifest` and `public/sw.js` make a simple installable shell. The service worker registers in production builds only. Question and attempt data stay in IndexedDB, not in the shared cache.

## Limits

- One candidate, this browser only. No login, sync, payments, ads, or leaderboard.
- Correct answers are stored on the device, including during a mock. The exam screen hides them; someone inspecting IndexedDB can still read them.
- No PDF, DOCX, OCR, or Drive import.
- No runtime AI.
- Playwright is not set up. Domain rules are covered by Vitest.
- Free-tier hosting terms were not re-checked here because this version does not require a host. If you later deploy the static app, check that host’s current limits.
