# Architecture

## 1. Shape
Use a modular, local-first application. Keep the core exam engine independent of React and storage implementation.

Suggested layers:
- `src/domain/`: pure types and rules (scoring, blueprint validation, question selection, mastery classification).
- `src/application/`: use cases (start practice, create mock, save answer, submit attempt, import/export).
- `src/infrastructure/storage/`: IndexedDB repositories, migrations, seed loader.
- `src/infrastructure/import/`: CSV/JSON parsing, validation, duplicate fingerprinting.
- `src/components/`: reusable UI components.
- `src/features/syllabus/`
- `src/features/questions/`
- `src/features/practice/`
- `src/features/mock-exam/`
- `src/features/review/`
- `src/features/dashboard/`
- `src/features/settings/`
- `src/app/`: routes and app shell.

Adapt paths to the repository if it already has a structure; do not force a wholesale rewrite.

## 2. Data flow
UI action → application use case → domain validation/calculation → repository → UI state.

The UI must not independently calculate scores. Scoring and blueprint logic should be pure functions with unit tests. Derive dashboard summaries from saved attempt records so duplicated totals cannot drift.

## 3. Persistence
IndexedDB is the MVP source of truth. Store:
- syllabus nodes
- questions
- exam settings/templates
- attempts
- attempt items
- bookmarks
- notes
- revision schedule (later)
- import jobs / error reports where needed

Add schema versioning and migration tests. Use stable IDs. Store an attempt's exam rules and blueprint snapshot at start.

## 4. Timer and recovery
- Persist mock start time, deadline, question order, selected answers, review flags, and exam-rule snapshot.
- Derive remaining time from the persisted deadline, not from a counter that resets after refresh.
- Autosave after each answer and relevant state change.
- On resume, compute remaining time from deadline.
- At zero, submit once idempotently. Protect against duplicate auto-submit.
- Do not permit pause in mock mode.
- Handle browser tab sleep, refresh, and temporary network loss.

## 5. Question selection
1. Filter to verified + live questions matching the blueprint.
2. Exclude duplicates in the current paper.
3. Prefer unseen questions.
4. Then previously wrong questions.
5. Then previously seen/correct questions.
6. Apply topic weights and difficulty mix as far as available inventory allows.
7. If inventory is insufficient for a valid 100-mark mock, explain which topic lacks enough questions; do not silently produce an invalid mock.

Use a seeded/randomizable strategy that is deterministic for a saved attempt.

## 6. PWA/offline
Cache the application shell and static assets. Keep question/attempt data in IndexedDB. Avoid caching sensitive imported files in shared caches without a clear reason. Provide a visible offline state and ensure mock answers remain locally saved.

## 7. Future backend seam
If multi-device sync is later required, define repository interfaces so an optional remote implementation can be added without rewriting domain logic. Do not build sync, auth, or a server database before the local MVP is reliable.
