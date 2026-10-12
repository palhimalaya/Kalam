# Implementation Plan for an AI Coding Agent

## Phase 0 — audit and plan
- Inspect the repository and all docs.
- Identify existing framework/package manager and preserve working conventions.
- Confirm what is already implemented.
- Output a file-by-file plan and a short list of unresolved assumptions.

**Exit check:** plan reviewed; no destructive changes.

## Phase 1 — app shell
- Responsive navigation and app layout.
- Design tokens, accessible controls, empty/loading/error states.
- Routes: Home, Syllabus, Practice, Mock, Results/Review, Dashboard, Learn, Settings/Import.
- Use demo content labelled as demo.
- Lint/type-check/build.

**Exit check:** routes render at mobile and desktop sizes.

## Phase 2 — domain engine and storage
- Typed entities and runtime schemas.
- IndexedDB repositories with schema version.
- Pure functions for scoring, blueprint validation, question selection, topic accuracy, and mastery labels.
- Seed minimal sample data.
- JSON export/import with preview and validation.

**Exit check:** unit tests cover core domain functions and local data survives refresh.

## Phase 3 — syllabus and content tools
- Syllabus tree and clause detail.
- Question bank table/list with filters and status.
- CSV/JSON import preview, validation errors, duplicate detection, and review-before-publish.
- Keep manual file upload as primary import route.

**Exit check:** a sample file can be imported without bypassing validation.

## Phase 4 — practice
- Learn mode and Timed mode.
- Session setup, answer selection, skip, mark review, bookmark, notes.
- Resume active practice after refresh.
- Session summary and mistakes drill.

**Exit check:** practice flow works end-to-end and answers persist.

## Phase 5 — mock exam
- Configurable template and exact-total validation.
- 100-question composition using topic blueprint.
- Timer from persisted deadline, autosave, resume, final confirmation, auto-submit at expiry.
- Results based on template snapshot.
- Insufficient-bank warning.

**Exit check:** manual and timed submission are idempotent; timer cannot reset on refresh.

## Phase 6 — review and dashboard
- Full answer review, scoring impact, explanations, sources.
- Topic accuracy, mock trend, attempted counts, weak-topic classifications after 10 attempts.
- Explain each recommendation.
- Export reports/data.

**Exit check:** dashboard values reconcile with attempt records.

## Phase 7 — learning enhancements
- Knowledge packs, related-question links, revision queue, confidence and error-type analysis.
- Only after source and verification workflows exist.
- No unsupported exam-frequency predictions.

**Exit check:** knowledge packs have sources and a review status.

## Phase 8 — release
- Accessibility, responsive, offline and browser tests.
- Test backup/restore and data deletion.
- Security review for imports and client storage.
- README setup/deploy/backup docs.
- Verify hosting provider free-tier terms at release time.

## Rules for agent execution
- One phase per work session.
- Do not generate hundreds of questions as a substitute for verified content.
- Do not introduce new libraries without explaining why.
- Keep diffs focused and tests meaningful.
- If requirements conflict, flag the conflict instead of silently choosing.
