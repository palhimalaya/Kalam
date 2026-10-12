# Decisions and Open Questions

## Defaults chosen for the first build
- Single-candidate, personal-use app.
- Local-first; no required login or remote database.
- No payment, ads, public sharing, or leaderboard.
- English UI with Nepali Unicode text support; a language toggle can be added later.
- CSV/JSON import first; Drive OAuth and OCR later.
- Default mock settings from the more specific PRD: 100 questions, 90 minutes, 1 mark correct, -0.2 wrong, zero for skipped, pass mark 40.
- All exam settings remain editable and must be confirmed against the current official notice before relying on them.
- No runtime AI API dependency.

## Resolve before public launch
1. Verify the current official PSC notice and syllabus, including duration, negative marking, pass mark, question format, and blueprint.
2. Confirm rights/permission for every imported file and whether any file is private-study-only.
3. Confirm whether the app will remain personal or support multiple users.
4. Decide if multi-device sync is worth the additional backend and account complexity.
5. Confirm whether Nepali UI is required or only Nepali question display.
6. Decide which hosting provider to use after checking current free-tier limits.
7. Confirm whether a public deployment may include any user-supplied content.

## Conflicts between the supplied PRDs
- The general PRD treats duration, question distribution, and penalty as assumptions to confirm. The more specific PRD proposes 100 questions, 90 minutes, -0.2 per wrong answer, and a pass mark of 40. Implement them as defaults, not immutable official facts.
- One document describes a generic Level 7 Civil exam with broad civil topics; the other specifically defines Paper I General Subject with 50 Part I and 50 Part II questions. Use the more specific blueprint as the initial configurable template.
- One PRD puts Drive integration in a later phase/manual import first; the other labels Drive import P0. For a free, low-risk MVP, manual CSV/JSON and authorized file upload should come first; Drive OAuth is a later enhancement.
- One PRD has advanced analytics and recommendation features in MVP; the more specific PRD phases knowledge packs and spaced repetition later. Ship core practice/mock/review first, then deepen analytics.
