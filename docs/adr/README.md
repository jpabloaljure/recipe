# Architecture Decision Records

Each significant architecture decision is recorded as one ADR file in this
folder. Diagrams live in [`../architecture/`](../architecture/README.md).

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-11-15 |
| [0002](0002-nextjs-on-vercel.md) | Next.js (App Router) on Vercel for the web app and API | Accepted | 2026-11-15 |
| [0003](0003-postgres-neon-drizzle.md) | Postgres on Neon with Drizzle ORM | Accepted | 2026-11-15 |
| [0004](0004-ingestion-on-github-actions.md) | Daily ingestion as a TypeScript script on GitHub Actions | Accepted | 2026-11-15 |
| [0005](0005-single-package-repository-layout.md) | Single-package repository layout | Accepted | 2026-11-16 |
| [0006](0006-playwright-end-to-end-tests.md) | Playwright for end-to-end tests | Accepted | 2026-11-16 |
| [0007](0007-database-connections-roles-and-migrations.md) | Database connections, roles and migrations (refines 0003) | Accepted | 2026-11-21 |

## Pending decisions

Decisions known to be needed but not made yet. They get an ADR when decided
(no empty ADR files).

| Decision | Blocked by / decided in | Affects |
|---|---|---|
| LLM provider and model for recipe extraction | Ingestion/extraction change | Ingestion job: recipe extractor |
| Captions as the third extraction source | Spike REC-009 | Ingestion job: recipe extractor |
| Whether favorites store a copy of the recipe | Product decision (PRD §12) | Web app: favorites store |
| Whether an ingestion run is stored (for monitoring) | Ingestion change (REC-005, REC-008) | Ingestion job; [data model](../architecture/data-model.md) |

## Rules

- **File name:** `NNNN-kebab-case-title.md`, numbered in order. Numbers are
  never reused.
- **Template:** copy [`template.md`](template.md).
- **Status:** `Proposed` while under discussion, `Accepted` once decided,
  `Superseded by NNNN` when replaced.
- **Accepted ADRs are not edited** (typo fixes aside). To change a decision,
  write a new ADR that supersedes it, and set the old one's status to
  `Superseded by NNNN`.
- **Every ADR links** to the OpenSpec change that made it and to the C4
  diagrams it affects. Update those diagrams in the same change. When the
  change is archived, update the link to its
  `openspec/changes/archive/<date>-<name>/` path (a path fix, allowed in
  Accepted ADRs).
- **Use the `write-adr` skill** to create an ADR: it picks the next number,
  fills the template, updates this index and the affected C4 diagrams.
