# Proposal

## Why

The stack is decided (ADRs 0002–0004), but the repo has no application code:
no `package.json`, no Next.js app, no test runner, no deploy. REC-001, the
first validated story, cannot be built until the project exists, and its
estimate (3 points) assumes the setup is done outside the story. Every later
story needs the same base, so it is set up once, on its own.

## What Changes

- Create the Next.js (App Router) app with React 19 and TypeScript (strict)
  as a single package at the repo root, managed with pnpm.
- Styling with plain CSS modules and a global stylesheet; no CSS framework.
- Add Vitest with one smoke test, and `dev`, `build`, `start`, `test` and
  `typecheck` scripts.
- A placeholder home page set up for mobile (viewport, full-height layout),
  with no product behavior.
- Initialize git with a `.gitignore`; add a GitHub Actions CI workflow that
  runs typecheck, tests and build.
- Deploy to Vercel from the GitHub repository (the human creates the GitHub
  repository and the Vercel project).
- Record the repository layout (one package that the web app and the future
  ingestion job share) in a new ADR.
- Fill the README's "Getting started" section and update `docs/checklist.md`.
- No database, Drizzle schema, API routes or ingestion script: those belong
  to the data-model, API and ingestion changes.

This change implements no backlog story (`REC-*`). It is project setup that
enables REC-001 (validated, `Estimate: 3`) and the later stories, so the
`needs-human-validation` restriction does not apply to it. No story's scope
or acceptance criteria change.

## Capabilities

### New Capabilities
None. Setup and tooling add no system behavior, so the change sets
`skip_specs: true`. The first capability spec comes with REC-001.

### Modified Capabilities
None.

## Impact

- **Code:** new `package.json`, `pnpm-lock.yaml`, `tsconfig.json`,
  `next.config.ts`, `vitest.config.ts`, `src/app/` (layout, page, global
  CSS), one test file, `.gitignore`, `.nvmrc`.
- **Dependencies:** `next`, `react`, `react-dom` (runtime); `typescript`,
  `@types/*`, `vitest` (dev). All are in the decided stack; nothing else is
  added.
- **Systems:** a git repository and GitHub remote, GitHub Actions (CI),
  Vercel (hosting). Setting up the accounts, the remote and the Vercel
  project is the human's job.
- **Docs:** new ADR 0005 and ADR index, `README.md` (Getting started,
  repository and deployed URL), `docs/checklist.md`. The C4 diagrams keep
  their shape: no container or component is added.
- **Unblocks:** an OpenSpec change for REC-001, then the data-model and API
  changes.
