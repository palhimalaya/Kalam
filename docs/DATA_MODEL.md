# Data Model

Use typed schemas and stable IDs. Exact database technology may change; these concepts should remain stable.

## SyllabusNode
- `id`
- `parentId` nullable
- `code` (e.g. GA, LR, T5, or clause code)
- `title`
- `part` (I or II where applicable)
- `marks` nullable
- `clauseText` nullable
- `sortOrder`
- `sourceRef` nullable
- `createdAt`, `updatedAt`

## Question
- `id`
- `stem`
- `options`: exactly four options in MVP, each with stable key and text
- `correctOption`
- `shortExplanation` nullable
- `detailedExplanation` nullable
- `optionExplanations` nullable
- `nodeId`
- `difficulty`: easy, medium, hard, unknown
- `estimatedTimeSeconds` nullable
- `language`: en, ne, mixed
- `figureRef` nullable
- `tags`
- `sourceType`: original, user_file, past_paper, external_link, licensed
- `sourceName`, `sourceUrl`, `sourceFileRef`, `sourcePage`, `sourceYear`, `sourceSeries`
- `rightsStatus`: original, permission_confirmed, licensed, link_only, private_study_only, unknown, restricted
- `attribution` nullable
- `reviewStatus`: draft, needs_verification, verified, live, flagged, retired
- `reviewNotes` nullable
- `author`, `reviewer` nullable
- `duplicateFingerprint`
- `createdAt`, `updatedAt`, `verifiedAt` nullable

## ExamTemplate / ExamRules
- `id`, `name`, `version`
- `questionCount`, `totalMarks`, `durationSeconds`
- `marksPerCorrect`, `penaltyPerWrong`, `skippedMarks`
- `passMark` nullable
- `topicWeights`: node/code → marks or count
- `difficultyWeights`
- `calculatorAllowed`
- `active`
- `sourceNote` and `lastVerifiedAt`
- Validate that the blueprint sums exactly to `totalMarks`.

## Attempt
- `id`
- `mode`: learn, timed_practice, mock
- `startedAt`, `submittedAt` nullable
- `deadlineAt` nullable
- `status`: in_progress, submitted, expired
- `templateSnapshot`: exam rules and weights copied at start
- `questionOrder`: ordered question IDs
- `correctCount`, `wrongCount`, `skippedCount`
- `rawScore`, `penaltyMarks`, `netScore`, `durationSeconds`
- `createdAt`, `updatedAt`

## AttemptItem
- `id`, `attemptId`, `questionId`
- `chosenOption` nullable
- `isCorrect` nullable until submission where appropriate
- `timeSpentSeconds`
- `flaggedForReview`
- `confidence`: sure, unsure, guess, nullable
- `answeredAt` nullable

## Bookmark
- `id`, `questionId`, `createdAt`

## PersonalNote
- `id`
- `targetType`: question or syllabus_node
- `targetId`
- `text`
- `createdAt`, `updatedAt`

## KnowledgePack (later phase)
- `nodeId`
- `syllabusText`
- `coreConcepts`
- `formulaeAndTables`
- `workedExamples`
- `commonTraps`
- `nepalContext`
- `sources[]` with title, URL, claim supported, accessed date
- `status`: draft, reviewed, live
- `verifiedAt`

## ImportJob
- `id`, `filename`, `format`, `startedAt`, `finishedAt`
- `status`: preview, imported, failed
- `rowCount`, `acceptedCount`, `rejectedCount`, `duplicateCount`
- `errors[]`

## Settings
- `targetScore`
- `examTemplateId`
- `languagePreference`
- `theme`
- `createdAt`, `updatedAt`

## Important invariants
- Never publish `draft`, `needs_verification`, `flagged`, or `retired` questions into practice.
- A submitted attempt keeps the exam settings snapshot used to score it.
- A question's source and rights metadata travel with it through export/import.
- Imported IDs and fields must be validated. Never run imported strings as code or HTML.
