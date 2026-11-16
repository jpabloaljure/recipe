# 0005. Single-package repository layout

- **Status:** Accepted
- **Date:** 2026-11-16
- **Deciders:** Project owner

## Context

The repo holds docs, the backlog and OpenSpec, but no application code yet.
Two containers will live in it:

- the Next.js web app and its API routes, deployed to Vercel (ADR 0002);
- the daily ingestion script, run by GitHub Actions (ADR 0004).

Both must share the Drizzle schema and types (ADR 0003). There is one
deployable (the Vercel app). The ingestion script runs from the repo, not as
its own deployment. The project adds no tools or libraries beyond the
decided stack without approval (`AGENTS.md`).

## Decision

We will keep one package at the repo root, with one `package.json` and one
lockfile shared by the web app and the ingestion job:

- `src/app/` for the Next.js App Router (pages and, later, route handlers);
- `src/lib/` for shared code (later the Drizzle schema and feed types);
- `scripts/` for the ingestion entry point, which imports from `src/lib/`.

## Alternatives

- **pnpm workspace** (`apps/web`, `packages/db`, `jobs/ingest`): enforces
  clearer boundaries, but means three `package.json` files, workspace
  configuration and a Vercel root-directory setting for an app with only
  one deployable.
- **`app/` at the repo root, without `src/`:** mixes application code with
  the `docs/`, `backlog/` and `openspec/` folders.

## Consequences

- **Positive:** the ingestion script imports the schema directly, with one
  `tsconfig`, one lockfile and no package build step; Vercel needs no
  extra configuration.
- **Negative:** the web app and the ingestion job share one set of
  dependencies, so ingestion-only libraries (for example, the LLM client)
  are also installed for the web app build. Next.js includes only the code
  that pages import, so they do not reach the client.
- **Negative:** boundaries are folder conventions, not package boundaries.
  If a second deployable appears (PRD §10), a new ADR can supersede this
  one with a workspace split.

## Links

- Change: [`scaffold-web-app`](../../openspec/changes/scaffold-web-app/design.md) (design Decision 1)
- C4: [Level 2: containers](../architecture/c4/02-containers.md)
- Related ADRs: [0002](0002-nextjs-on-vercel.md),
  [0003](0003-postgres-neon-drizzle.md),
  [0004](0004-ingestion-on-github-actions.md)
