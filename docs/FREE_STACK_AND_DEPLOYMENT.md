# Free-First Stack and Deployment

## Guiding Rule

Build the Civil PSC Level 7 MCQ Platform using free-tier services wherever practical, without requiring paid AI APIs or paid development tools.

The recommended deployment stack is:

- **Vercel Hobby** for application hosting.
- **Neon PostgreSQL Free** for the hosted database, connected through the Vercel Marketplace integration.
- **Prisma ORM** for database access, schema management, and migrations.
- **Next.js + React + TypeScript** for the application.

Free-tier quotas, availability, and terms may change. Verify current limits before deployment and periodically review usage.

The application must not depend on a paid AI API to function.

## Recommended MVP Stack


| Layer                | Technology                                       | Purpose                                                    |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| Application          | Next.js + React + TypeScript                     | User interface and server-side application logic           |
| Styling              | Tailwind CSS + lightweight accessible components | Responsive and accessible UI                               |
| Hosting              | Vercel Hobby                                     | Deploy the web application                                 |
| Database             | Neon PostgreSQL Free                             | Shared question bank and user data                         |
| Database ORM         | Prisma ORM                                       | Type-safe database queries and migrations                  |
| Validation           | Zod                                              | Validate API inputs, question data, and imports            |
| Forms                | React Hook Form + Zod                            | Question editor and administrative forms                   |
| Local persistence    | IndexedDB + Dexie.js                             | Offline question cache, drafts, and pending study attempts |
| State management     | React state or Zustand when needed               | Manage exam sessions and UI state                          |
| Equations            | KaTeX                                            | Render mathematical and engineering formulas               |
| CSV import/export    | Papa Parse                                       | Bulk question import and export                            |
| Excel import/export  | SheetJS, if required                             | Support spreadsheet-based workflows                        |
| Charts               | Recharts, when needed                            | Topic-wise performance and progress                        |
| Unit/component tests | Vitest + React Testing Library                   | Verify business logic and UI                               |
| End-to-end tests     | Playwright                                       | Verify practice, exams, imports, and administration        |
| PWA                  | Web app manifest + service worker                | Installability and selected offline functionality          |
| Source control       | Git + GitHub or another Git provider             | Version control and collaboration                          |


Keep the dependency list small. Add packages only when they provide a concrete benefit.

## Architecture Choice: Hosted PostgreSQL First

Use Neon PostgreSQL as the central source of truth.

The platform should support question management by an authorized administrator and make published questions available to all users.

### Primary data flow

1. The user opens the Next.js application hosted on Vercel.
2. The application retrieves published questions through server-side database access.
3. Prisma ORM communicates with Neon PostgreSQL.
4. Users submit answers, complete mock exams, and save bookmarks or progress.
5. The application stores persistent records in PostgreSQL.
6. The administrator imports, edits, reviews, and publishes questions through a protected admin interface.



### Architectural rules

- Keep database access on the server. Never connect directly to PostgreSQL from browser code.
- Store the database connection string in environment variables.
- Never expose database credentials, administrative secrets, or privileged API keys to the client.
- Use Prisma migrations to manage database schema changes.
- Commit migration files to version control.
- Use separate development and production database environments when practical.
- Enforce authorization on the server for all administrative operations.
- Do not trust client-submitted scores, correct answers, roles, or permissions.
- Keep question publication status explicit, such as `DRAFT`, `REVIEWED`, and `PUBLISHED`.
- Avoid exposing correct answers and explanations during an active mock exam unless the exam configuration permits it.



## Database and Deployment Providers



### Vercel

Use Vercel Hobby for the initial deployment, subject to its current eligibility, usage limits, and terms.

Responsibilities:

- Deploy the Next.js application.
- Manage environment variables.
- Build and deploy application changes from Git.
- Provide server-side routes or server actions within the supported deployment limits.

Do not assume that Vercel itself supplies an unlimited PostgreSQL database. Use the selected database provider through its Marketplace integration.

### Neon PostgreSQL

Use Neon Free as the initial hosted database.

Responsibilities:

- Store the shared question bank.
- Store topics, options, explanations, and source metadata.
- Store user profiles when accounts are implemented.
- Store mock exam attempts, answers, bookmarks, and progress.
- Provide the PostgreSQL connection used by Prisma.

Before deployment, verify the current free-plan limits for storage, compute, database branches, connections, and other relevant features.

Configure connection pooling or the recommended serverless connection method for the selected Neon and Prisma setup.

Do not assume free hosting includes point-in-time recovery, guaranteed uptime, or production-grade backups.

### Prisma ORM

Use Prisma ORM to define and query the database schema.

Responsibilities:

- Maintain the database schema in version control.
- Generate the Prisma Client.
- Apply reviewed schema migrations.
- Query and update application records.
- Support typed database operations.

Prisma ORM is not the hosted database itself. Neon provides PostgreSQL, while Prisma provides the application-side database tooling.

Use the appropriate connection configuration for the installed Prisma version. Do not copy setup instructions from a different major version without checking compatibility.

## Local-First and Offline Study Support

The hosted database is the primary source of truth, but the application should preserve useful offline functionality.

### Online behavior

- Load published questions from the server.
- Save submitted attempts to PostgreSQL.
- Synchronize bookmarks and progress where supported.
- Make administrative question updates available to users on subsequent refreshes or cache updates.



### Offline behavior

- Cache the application shell and selected published question data.
- Allow users to continue supported practice sessions using cached questions.
- Save offline attempts locally with a stable client-generated identifier.
- Queue eligible changes for synchronization when connectivity returns.
- Prevent duplicate attempt creation when queued changes are retried.
- Clearly indicate whether progress is saved locally, synchronized, or awaiting synchronization.

Do not silently discard offline attempts.

Offline support must be implemented deliberately. A service worker alone does not make server-dependent application features work offline.

For the first release, prioritize reliable online functionality and backup/export. Add full offline attempt synchronization only after the basic exam workflow is stable.

## Question Management and Bulk Import

The application must provide an authorized admin interface for adding and maintaining questions.

Support these workflows:

1. Create and edit questions manually.
2. Import questions from CSV.
3. Download a CSV template.
4. Validate imported records before saving.
5. Preview valid records and import errors.
6. Detect likely duplicate questions.
7. Assign questions to the correct subject and topic.
8. Record difficulty, explanation, source, and content-rights information.
9. Save new questions as drafts.
10. Review and publish approved questions.
11. Export question data for backup or migration.

Excel import can be added using SheetJS if it provides sufficient value. CSV should be the initial bulk-import format.

PDF/DOCX extraction should be a later feature. Extracted questions must be reviewed for answer accuracy, formula formatting, and source permissions before publication.

## Authentication and Authorization

The public question bank and the administration interface have different security requirements.

- Public users may access published questions and the features permitted by the product.
- Administrative routes must require authentication.
- Question creation, editing, deletion, and publication must require server-verified administrative permissions.
- Never rely only on hiding admin buttons in the frontend.
- Validate all input on the server.
- Apply rate limiting or other appropriate abuse protections where supported and necessary.

Choose an authentication implementation that works with the selected deployment and free-tier constraints. Do not introduce a paid identity provider unless the project explicitly approves the cost.

## AI and Content Generation

- No runtime AI provider is required.
- Use a coding agent during development to implement features and assist with original question drafting from authorized reference material.
- Generated questions and answers must be reviewed before being marked as verified or published.
- Preserve the source, review status, and content-rights metadata of imported or generated questions.
- Never put AI provider secrets in frontend code.
- Do not build an AI API dependency into the normal practice or exam workflow.
- If a local model such as Ollama is used for question drafting, treat it as an optional authoring tool rather than a production dependency.



## Free-Tier Constraints and Cost Controls

The application must be designed with free-tier limits in mind.

- Keep database queries efficient and paginate large question lists.
- Avoid retrieving the entire question bank when only a subset is needed.
- Add indexes for frequently queried fields, such as topic, publication status, and question identifiers, based on actual query patterns.
- Avoid unnecessary database requests during an exam.
- Avoid unbounded serverless functions and large imports in a single request.
- Process large imports in validated batches.
- Monitor database storage, compute, and application usage.
- Avoid artificial traffic or periodic requests solely to prevent a database from becoming idle.
- Document any feature that depends on a provider-specific free-tier capability.
- Keep the application portable enough to move to another PostgreSQL provider if required.

Do not promise unlimited free usage or permanent free availability.

## Data Integrity and Backup

Provide administrative backup and restore workflows.

Required features:

- Export questions to JSON and CSV.
- Export relevant application data where appropriate.
- Validate backup files before restoring them.
- Preview restore operations.
- Detect duplicates and conflicting records.
- Support an explicit merge or replace decision.
- Require confirmation before destructive operations.
- Keep question IDs stable when importing or restoring existing records.
- Preserve topic assignments, explanations, source metadata, and publication status.
- Document how to perform and verify database backups independently of browser exports.

Browser exports are useful for portability, but they are not a substitute for a database backup. A question export also does not necessarily contain user accounts or all attempt history.

Never claim that data is backed up unless the backup has actually been created and verified.

## Deployment Checklist

1. Review the current Vercel Hobby and Neon Free plan limits and terms.
2. Create the Neon PostgreSQL database through the selected integration.
3. Configure database connection variables securely.
4. Generate the Prisma Client.
5. Apply reviewed migrations to the intended database.
6. Verify that development and production environments point to the correct databases.
7. Run linting, type checking, unit tests, and the production build.
8. Run end-to-end tests for question import, practice, scoring, mock exams, and administrative authorization.
9. Verify that unauthenticated users cannot perform administrative actions.
10. Confirm that secrets and private source material are not bundled into the frontend or committed to a public repository.
11. Test question export, backup, and restore.
12. Test offline caching and synchronization behavior if implemented.
13. Verify that exam scoring and negative marking follow the configured rules.
14. Check database storage, compute, connection, and hosting quotas.
15. Confirm that published questions are accurate and legally permitted to be distributed.
16. Add a privacy statement and appropriate data deletion/export mechanisms.
17. Document database migration, backup, restore, and provider migration procedures.



## Final Recommendation

Start with:

**Next.js + TypeScript + Vercel Hobby + Neon PostgreSQL Free + Prisma ORM.**

Use PostgreSQL as the shared source of truth, CSV/JSON as the initial question-import and backup formats, and a protected admin interface for question management.

Keep runtime AI optional, implement authorization correctly, and add offline synchronization incrementally. The goal is to make the platform useful on free tiers without making it dependent on a particular provider's permanent free availability.