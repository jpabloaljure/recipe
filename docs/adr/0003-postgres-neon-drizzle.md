# 0003. Postgres on Neon with Drizzle ORM

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Project owner

## Context

The database holds videos, recipes, their statuses (`ready`,
`needs_recipe`, `not_easy`, `unavailable`) and the raw "easy" facts (PRD
§6.2–§6.4). It is written by the daily ingestion job on GitHub Actions and
read by the API on Vercel, so both must reach it over the network. A
maintainer edits it directly (§6.4). The catalog starts at ~50 recipes and
grows daily; the roadmap adds search once it reaches 500+ (§10).

## Decision

We will use Postgres hosted on Neon (free tier to start) and access it with
Drizzle ORM. The Drizzle schema and migrations live in the repo and are
shared by the web app and the ingestion job.

## Alternatives

- **SQLite (file or embedded):** simplest, but one writer at a time and hard
  to share between Vercel functions and GitHub Actions.
- **Prisma instead of Drizzle:** mature, but a heavier runtime and a
  code-generation step.
- **Other hosted Postgres (Supabase, Vercel Postgres):** comparable; Neon's
  free tier and web console cover the MVP and the maintainer's manual edits.

## Consequences

- **Positive:** handles the catalog well past the MVP; Postgres full-text
  search is available for the roadmap's search feature; type-safe queries
  shared across containers.
- **Negative:** the Neon free tier pauses when idle, adding a cold start;
  mitigated by CDN caching of feed responses, and by upgrading if PERF-2
  fails on the real-device check (REC-015).
- **Negative:** a hosted database is one more account and secret to manage.

## Links

- Change: [`choose-tech-stack`](../../openspec/changes/archive/2026-11-15-choose-tech-stack/design.md) (archived)
- C4: [Level 2: containers](../architecture/c4/02-containers.md),
  [Level 3: ingestion](../architecture/c4/03-components-ingestion.md)
- PRD: §6.2, §6.3, §6.4, §10
