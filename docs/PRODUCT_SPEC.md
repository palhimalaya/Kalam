# Product Specification

## 1. Product
Working name: **Loksewa Civil MCQ Trainer**. Personal, mobile-first, installable web app for Nepal PSC Level 7 Civil Engineering Paper I (General Subject). Initial release is for one candidate; multi-user support is not required.

## 2. Core user journeys
1. Browse syllabus by part, topic, and clause.
2. Start Learn mode for instant correctness and explanation.
3. Start Timed practice where answers are revealed at the end.
4. Sit a full mock with question palette, timer, unanswered count, and review flags.
5. Submit or auto-submit; see score and review each item.
6. Review topic accuracy and recent mock score trend.
7. Bookmark a question, add a personal note, revisit mistakes.
8. Import an authorized question file, review it, verify it, then publish it to practice.
9. Export personal data for backup.

## 3. Exam blueprint from the more specific PRD
Default proposed mock:
- Paper I, General Subject
- 100 questions / 100 marks
- 90 minutes
- 1 mark per correct answer
- 0.2 marks deducted per wrong answer
- unanswered answer = 0
- calculator not provided
- proposed pass mark = 40
- Part I = 50 questions; Part II = 50 questions

These values were transcribed from the supplied PRD, which itself says to verify the duration and penalty against the current official notice. Therefore, every exam rule and topic weight must be configurable and must be visibly described before the user starts.

### Proposed topic blueprint
| Code | Topic | Marks/questions |
|---|---|---:|
| GA | General Awareness and Contemporary Issues | 25 |
| LR | Logical Reasoning | 9 |
| NR | Numerical Reasoning | 8 |
| SR | Spatial Reasoning | 8 |
| T1 | Structural Engineering | 5 |
| T2 | Engineering Survey | 7 |
| T3 | Construction Materials | 6 |
| T4 | Concrete Technology | 5 |
| T5 | Geotechnical Engineering | 6 |
| T6 | Construction Management | 6 |
| T7 | Estimating, Costing, Specification and Valuation | 5 |
| T8 | Engineering Drawing | 4 |
| T9 | Engineering Economics | 3 |
| T10 | Professional Practices | 3 |
| **Total** | | **100** |

The syllabus document identifies 120 clauses. Load the actual clause text from supplied/authorized syllabus material; do not invent clause wording. The GA split is not specified by the PRD and should be editable, with equal distribution only as a proposed default.

## 4. Question modes and status
- Learn: show feedback and explanation immediately after the answer.
- Timed: hide correctness until the session ends.
- Mock: exam-like behavior; no correctness until submission.
- Filters: topic/clause, difficulty, unseen, incorrect, bookmarked, source type.
- Per question: select/clear answer, skip, mark for review, bookmark, optional note and confidence.
- Only `verified` and `live` questions may appear in sessions.
- No duplicate question within one mock.
- Prefer unseen questions, then previously incorrect, then seen/correct.
- Default difficulty mix: 30% easy, 50% medium, 20% hard, if sufficient verified content exists.

## 5. Scoring
`net_score = correct_count * marks_per_correct - wrong_count * penalty_per_wrong`
Skipped questions normally score zero. Keep all scoring parameters on the attempt snapshot so historical results remain reproducible after settings change. Clamp or display negative scores consistently; do not silently change the formula.

## 6. Dashboard
MVP: attempts, answered count, accuracy, latest/best mock, score trend, topic accuracy, weak-topic candidates, and next suggested topic.
- Fewer than 10 attempts: `Not enough data`.
- Initial labels from the specific PRD: Weak <50%, Improving 50–69%, Strong 70–84%, Mastered >=85%; all only after 10 attempts.
- Show sample count and last-practised date.
- Recommendation priority may use topic marks × (target accuracy − current accuracy) × recency factor. Explain why a topic was recommended.
- Do not display projected readiness as statistically reliable until enough mock data exists.

## 7. Review page
For every question show:
- question and all options
- user's answer and correct answer
- time spent, if captured
- marks earned/lost
- explanation and option explanations where available
- source link and verification status
- knowledge-pack summary when available
- action to practise the same clause

## 8. Scope
### MVP
Syllabus tree, local question bank, import/export, topic practice, full mock, deterministic scoring, results/review, basic dashboard, bookmarks/notes, PWA shell and local persistence.

### Later
Drive OAuth sync, PDF/DOCX parsing and OCR, legacy Preeti-to-Unicode conversion, knowledge packs, related-question generation workflow, spaced repetition, external-practice log, advanced analytics, multi-user sync.

## 9. Not in MVP
Payments, ads, public sharing, leaderboard, Paper II subjective preparation, interview/group test, mandatory hosted AI, automated scraping of third-party question banks.
