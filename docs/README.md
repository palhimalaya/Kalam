# Loksewa Civil MCQ Trainer — AI Build Pack

This folder contains the implementation brief and working specifications for building a free-first, single-candidate web app based on the two supplied PRDs.

## Read in this order
1. `MASTER_AGENT_PROMPT.md` — paste this into your coding agent from the repository root.
2. `PRODUCT_SPEC.md` — consolidated MVP behavior and exam rules.
3. `FREE_STACK_AND_DEPLOYMENT.md` — zero-cost-first technology and deployment plan.
4. `ARCHITECTURE.md` — boundaries, data flow, offline-first approach.
5. `DATA_MODEL.md` — entities and relationships.
6. `IMPLEMENTATION_PLAN.md` — phased agent workflow and checkpoints.
7. `TEST_PLAN.md` — required tests and acceptance checks.
8. `CONTENT_GOVERNANCE.md` — safe question sourcing, verification, and import process.
9. `DECISIONS_AND_OPEN_QUESTIONS.md` — assumptions the app must keep configurable.

## How to use
- Copy this `docs/` directory into your project at `projectfolder/docs/`.
- Commit the docs before implementation.
- Start your AI coding agent in the project root and give it `docs/MASTER_AGENT_PROMPT.md`.
- Ask the agent to work in small phases. Review each phase and run tests before asking it to continue.
- Do not ask the agent to build every feature in one giant pass.

## Free-service principle
The application must remain useful without any paid API, paid AI model, or paid hosted service. Treat all hosted free tiers as optional conveniences with limits, not as guarantees of permanent free operation. A local-first mode must work even if every external provider is unavailable.
