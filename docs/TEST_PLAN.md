# Test Plan and Acceptance Criteria

## Domain unit tests
- Blueprint marks total exactly 100; reject totals of 99 or 101.
- Score calculation: correct, wrong, skipped; penalty changes when template changes.
- Historical attempt score remains unchanged when settings later change.
- Topic accuracy and overall accuracy use correct denominators.
- Weak/strong label remains `Not enough data` below 10 attempts.
- Mastery thresholds: Weak <50%; Improving 50–69%; Strong 70–84%; Mastered >=85% after minimum sample.
- Question selection never duplicates a question in one mock.
- Only verified + live questions are eligible.
- Selection reports insufficient inventory rather than silently breaking topic weights.
- Import validation rejects missing options, invalid correct-option keys, unknown syllabus IDs, and invalid statuses.
- Duplicate fingerprints detect exact/near duplicates as supported by the chosen algorithm.

## Mock exam integration tests
- Starting a mock snapshots exam rules and question order.
- Selected answer and review flag survive page reload.
- Remaining time is based on deadline, not page mount time.
- At zero, the attempt auto-submits once.
- Manual submit asks for confirmation and becomes final.
- A submitted mock cannot be changed or scored twice.
- Browser refresh or tab sleep does not grant extra time.
- Results and review include every question in the attempt.

## UI/end-to-end tests
- Navigate syllabus → topic practice → answer → review.
- Start full mock → answer/skip/flag → refresh → resume → submit.
- Import valid JSON; inspect preview; reject invalid file with helpful messages.
- Export and restore a backup.
- Dashboard score trend agrees with submitted attempts.
- Keyboard-only navigation works for practice and mock.
- Test at narrow mobile, tablet, and desktop widths.
- Empty states work when no questions or attempts exist.
- Offline app shell and locally saved attempts remain usable.

## Release gates
- Lint passes.
- Type-check passes.
- Unit tests pass.
- Production build passes.
- Critical browser tests pass where configured.
- No secrets in repository or client bundle.
- No unverified/restricted question can appear in a mock.
- README explains storage limitations and backup steps.
