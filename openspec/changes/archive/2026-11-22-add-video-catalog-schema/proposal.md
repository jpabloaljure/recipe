# Proposal

## Why

The feed API, the ingestion job and the recipe panel all read and write the
same data, but no database exists yet: `package.json` has no Drizzle or `pg`,
CI has no Postgres, and `GET /api/feed` is still the stub from REC-001.
REC-019 is the story that builds the schema, and it is on the critical path
for Entrega 2: REC-002 (feed API, blocked by it), REC-005, REC-008, REC-010
and REC-014 all depend on it. Its rules are the kind that must hold for every
writer, including a maintainer editing in the Neon console (the feed-entry
time that REC-002's cursor relies on, the read-only user behind every Vercel
preview), so they belong in the database, not in application code.

## What Changes

Implements **REC-019** (validated 2026-11-21, team estimate 8, `size:L`, no
`needs-human-validation` flag; confirmed before writing). One change, shipped
in two pull requests:

**PR 1, foundation (needs no Neon):**
- **ADR 0007** refining ADR 0003 (it does not supersede it): the `pg` driver,
  pooled `DATABASE_URL` for the app through the read-only `app_readonly` user
  and direct `DATABASE_URL_DIRECT` for migrations and ingestion through
  Neon's owner role, Postgres 17, a Postgres service container in CI, a
  local Postgres through `docker compose`, additive-only migrations.
- **Dependencies:** `drizzle-orm`, `pg`, `@types/pg`, and `drizzle-kit`
  (dev). `.env.example` and `node --env-file` for scripts (no `dotenv`).
- **Schema** in `src/lib/db/schema.ts` and migrations in
  `src/lib/db/migrations/`: the `video` and `recipe` tables of the data
  model document, the status and source enums, check constraints, a unique
  `youtube_id`, the recipe deleted with its video, `entered_feed_at` as
  `timestamptz(3)`, and the feed index on (status, `entered_feed_at`, `id`).
- **Hand-written SQL migrations** (`drizzle-kit generate --custom`): the
  trigger that always decides `entered_feed_at` and rejects any other change
  to it, `rejected` allowed only on insert, the `updated_at` trigger, and the
  grants for `app_readonly` (with default privileges).
- **Shared client** `src/lib/db/client.ts` (pooled for the app, direct for
  migrations and jobs) and `scripts/db/setup-roles.sql` (creates
  `app_readonly` locally and in CI).
- **Tests:** a separate Vitest project for `*.db.test.ts` files, run with
  `pnpm test:db`, one fresh database per file from a template database;
  `pnpm test` stays database-free. CI's `check` job gains the `postgres:17`
  service and runs `pnpm test:db`.
- **Docs:** `docs/development.md` (database setup, a "Create the Neon
  project" section and a short "Reviewing a migration" checklist), README
  §1.4 and §2.4, `docs/api/openapi.yaml` (two lines that describe the recipe
  as one JSON value), `docs/architecture/data-model.md` (drop "Built now",
  `timestamptz(3)`, Rule 2 wording, time kept on leaving, the check
  constraint).

**PR 2, production (after the human sets up Neon):**
- `.github/workflows/migrate.yml`: migrations on push to `main`, one run at a
  time, a short retry for Neon's cold start, with `DATABASE_URL_DIRECT`.
- Two manual checks: the workflow applies a merged migration to production,
  and a write as `app_readonly` on production is rejected.
- C4 level 2 (the migration workflow, the app reading as `app_readonly`, the
  CI test database as tooling).
- **Close-out** (one more PR), after the two manual checks pass:
  `docs/architecture/data-model.md` and `docs/architecture/README.md` set to
  `Status: Current` (they describe what runs in production), the checklist,
  the README's list of validated stories, REC-019 set to `done`, and the
  archive.

**Precondition done by the human** before PR 2: a Neon project on Postgres
17, `app_readonly` created with SQL (not from the Console), `DATABASE_URL` in
Vercel and `DATABASE_URL_DIRECT` in GitHub Actions secrets.

Out of scope: the feed route reading the database, the seed script and the
curated-list loader (REC-002); discovery and extraction (REC-005, REC-008);
a Neon branch per preview; a data-only write user for ingestion.

## Capabilities

### New Capabilities
- `video-catalog`: the database rules for the video catalog: schema, the
  feed-entry time, status rules, integrity constraints, the recipe table, and
  the read-only user. Its requirements and scenarios map the 21 acceptance
  criteria of REC-019.

### Modified Capabilities
None.

## Impact

- **Code:** new `src/lib/db/`, `scripts/db/`, `drizzle.config.ts`,
  `docker-compose.yml`, `.env.example`; `package.json` (new dependencies and
  `db:*` / `test:db` scripts); `vitest.config.ts` (exclude `*.db.test.ts`,
  add the database project).
- **CI:** `.github/workflows/ci.yml` (Postgres service, `pnpm test:db`); new
  `.github/workflows/migrate.yml` in PR 2.
- **Docs:** ADR 0007 and its index row, C4 level 2
  (`docs/architecture/c4/02-containers.md`, in PR 2),
  `docs/architecture/data-model.md`, `docs/api/openapi.yaml`,
  `docs/development.md`, `README.md`, `docs/checklist.md` (items 7, 12, 13 and 15,
  in the close-out).
- **Backlog:** REC-019 set to `done` in the close-out, once the two production
  checks pass and the Definition of Done is met.
- **Architecture:** new ADR 0007 and a C4 level 2 update (a new job and a new
  dev and CI tool). No existing ADR is edited.
- **Dependencies on people:** the Neon setup (human) gates PR 2 only.
