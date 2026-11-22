# 0007. Database connections, roles and migrations

- **Status:** Accepted
- **Date:** 2026-11-21
- **Deciders:** Project owner

## Context

[ADR 0003](0003-postgres-neon-drizzle.md) chose Postgres on Neon with Drizzle
and said the schema and migrations live in the repo, shared by the web app
and the ingestion job. It did not say how the code connects, who may write,
how migrations reach production, or how the database rules are tested.
REC-019 (validated 2026-11-21) needs those answers:

- The MVP runs read-only on Vercel ([ADR 0002](0002-nextjs-on-vercel.md)):
  the feed and the single-video endpoint only read (PRD §6.5). Every Vercel
  preview reads the production database, so any credential in the app is a
  credential on production.
- Writers are the ingestion job (GitHub Actions, [ADR 0004](0004-ingestion-on-github-actions.md))
  and a maintainer in the Neon console (ADR 0003, PRD §9). Database rules must
  hold for all of them.
- Vercel functions open many short connections; Neon offers a pooled and a
  direct connection string, and a compute that suspends when idle (inferred
  from Neon's model, checked when the project is created).
- The rules (the feed-entry time, `rejected`, the read-only user) are only
  proved against a real Postgres.

## Decision

We will connect to Postgres with the `pg` driver through Drizzle's
`node-postgres` support, over two connection strings and two roles:

- **The app** reads through a read-only role, `app_readonly`, with the pooled
  `DATABASE_URL`, set in Vercel for Production and Preview. Its pool is small
  by default (3 connections per instance, 10 seconds idle); REC-002 tunes it
  with real traffic.
- **Migrations, the ingestion job and the maintainer** use Neon's owner role
  with the direct `DATABASE_URL_DIRECT`, set only in GitHub Actions secrets,
  never in Vercel. The owner owns the tables, so default privileges granted
  by it cover tables created by later migrations.
- **`app_readonly` is created with SQL**, not from the Neon console, so it has
  no other rights. A migration grants it `SELECT` on the tables and default
  privileges for the migrating role.
- **Postgres 17** everywhere: the Neon project, the CI service container and
  the local database.
- **Migrations** are Drizzle's: one generated migration for the tables and
  hand-written SQL migrations (`drizzle-kit generate --custom`) for triggers
  and grants. After merge they are additive only (removing or renaming takes
  two pull requests), so the app works whether the deploy or the migration
  finishes first. A GitHub Actions workflow applies them on a push to `main`
  with the direct connection, one run at a time. A failed run is fixed with a
  new migration; there is no automatic rollback.
- **Tests** run against a real Postgres: a `postgres:17` service container in
  CI and `docker compose` (or Homebrew's `postgresql@17`) locally, never the
  production database. `pnpm test:db` runs them; `pnpm test` stays
  database-free.

## Alternatives

- **Neon's serverless driver:** designed for edge and serverless use, but it
  does not run against a plain Postgres in CI, so the tests would not match
  production.
- **One database user for everything:** simpler, but every Vercel preview
  would hold a credential that can write to production.
- **A data-only write user for ingestion (a third role):** stops ingestion from
  changing the schema, but adds a user and a secret. Not needed for the MVP;
  can be added later.
- **Running migrations during the Vercel build:** no extra workflow, but every
  preview build would need the owner secret and could run a migration on
  production before review.
- **Migrating by hand after each merge:** full control, but easy to forget,
  and the new app can go live before its schema.
- **A Neon branch per preview or for development:** isolates schema changes
  and local work, but needs the Neon–Vercel integration and an account step
  per developer, and local tests would depend on the network. May be revisited.

## Consequences

- **Positive:** previews and the app cannot write to production; one path
  puts schema changes into production, and it is reviewed first; the tests and
  production run the same migrations on the same Postgres version; the rules
  live in the database, so a console edit cannot break them.
- **Negative:** the ingestion job keeps schema rights through the owner role
  (accepted for the MVP); a preview whose code needs an unmerged migration may
  fail until the migration is merged; `docker compose` is one more development
  tool; the first migration after the database has been idle meets Neon's cold
  start, so the workflow retries; roles on Neon must be created with SQL, and
  `docs/development.md` says how.
- **Risk:** grants depend on which role runs the migrations, so they are only
  run through the direct connection with the owner role.

## Links

- Change: [`add-video-catalog-schema`](../../openspec/changes/add-video-catalog-schema/design.md)
- Story: REC-019 in [`backlog/E01-browse-feed.md`](../../backlog/E01-browse-feed.md)
- C4: [Level 2: containers](../architecture/c4/02-containers.md) (updated in
  the change's second pull request, with the migration workflow)
- Data model: [`data-model.md`](../architecture/data-model.md)
- Related ADRs: [0003](0003-postgres-neon-drizzle.md) (refined, not
  superseded), [0002](0002-nextjs-on-vercel.md),
  [0004](0004-ingestion-on-github-actions.md),
  [0005](0005-single-package-repository-layout.md)
- PRD: §6.4, §6.5, §9
