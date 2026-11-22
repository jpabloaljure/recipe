# Design

## Context

See proposal.md - Why. The source of the criteria and decisions is the REC-019
section of `backlog/E01-browse-feed.md` (52 validator findings, all settled
2026-11-20/21); this design only says how they are built. State on
2026-11-21:

- **No database code exists.** `package.json` has no Drizzle or `pg`;
  `vitest.config.ts` includes `src/**/*.test.ts`; `.github/workflows/ci.yml`
  has one `check` job with no Postgres; there is no `scripts/` folder and no
  `.env.example` (`.gitignore` already allows one).
- **Layout** follows ADR 0005: shared code in `src/lib/`, scripts in
  `scripts/`. The Drizzle schema and migrations "live in the repo and are
  shared" (ADR 0003). ADR 0002 describes a read-only runtime, which the
  `app_readonly` user makes true at the database. ADR 0004 already expects the
  database URL as a GitHub secret.
- **Data model document** (`docs/architecture/data-model.md`, `Status:
  Proposed`) is the target schema; this change makes the code match it and
  edits it where the validation settled something new.
- **Neon facts are inferred** from its public model and checked against its
  docs when PR 2 is built: a pooled host (the `-pooler` one) and a direct
  host, an owner role created with the project, roles made in the Console
  joining `neon_superuser`, roles made with SQL not, a compute that suspends
  when idle.
- **Drizzle facts are inferred** and settled by the spike in task 1.1:
  `drizzle-kit generate --custom` writes an empty SQL migration and updates
  the journal; the migration history sits in a `drizzle` schema, not
  `public`; statements are split on `--> statement-breakpoint` markers.

## Goals / Non-Goals

**Goals:**
- Every rule in the `video-catalog` spec holds for every writer, including a
  maintainer's console edit, and is proved by a database test.
- `pnpm test` stays fast and database-free; `pnpm test:db` runs the same on a
  laptop and in CI.
- Production changes only through reviewed migrations applied by one workflow.

**Non-Goals:**
- Reading the database from `GET /api/feed`, the seed script and the curated
  loader (REC-002); ingestion writes (REC-005, REC-008, REC-010).
- A data-only write user for ingestion, a Neon branch per preview, automatic
  rollback of migrations.

## Decisions

### 1. One change, two PRs; split where Neon begins

- **PR 1 (foundation):** ADR 0007, dependencies, schema, hand-written SQL,
  client, test harness, local and CI Postgres, and the docs that describe
  them. It needs no Neon and can merge first.
- **PR 2 (production):** `migrate.yml`, the two manual checks, C4 level 2 and
  `Status: Current` on the data model. It starts after the human's Neon setup.
- The change is archived and REC-019 set to `done` after PR 2.
- **Why:** PR 1 is the large review (three SQL migrations, about 25 database
  tests); PR 2 waits on a human task and ends in manual checks that keep a PR
  open for days. **Alternative:** one PR. Rejected for both reasons.
- **Why C4 and `Current` are in PR 2:** the diagram shows the migration
  workflow, which only exists in PR 2, and the data model document describes
  the production database, so it becomes `Current` once the schema runs
  there.

### 2. Spec scenarios are proved by Vitest database tests, not E2E

REC-019 is `layer:db` and changes nothing the user sees, so "done with unit or
contract tests" applies (`AGENTS.md`, E2E rule 12). Each scenario of
`video-catalog` gets one database test whose name is
`video-catalog › <Requirement> › <Scenario>`. The task-rule that asks for an
E2E task per scenario is met by listing this: no scenario here is
browser-visible. Two scenarios are manual and say why: "Migration merged to
`main`" (needs production) and the `app_readonly` write check on production.
Four decided details are unit-test-only, not criteria: the feed index, the
`created_at` default, the millisecond precision, and the check that
`ingredients` and `steps` are JSON lists.

### 3. Connections and roles

| Role | Who | Connection | Where it is set |
|---|---|---|---|
| `app_readonly` | the web app, so every Vercel preview | pooled `DATABASE_URL` | Vercel (Production and Preview) |
| owner (Neon's project owner) | migrations, later ingestion and the loader, the maintainer's console | direct `DATABASE_URL_DIRECT` | GitHub Actions secrets only |

- The owner owns the tables, so default privileges granted by that role cover
  tables created by later migrations. Ingestion keeping schema rights is
  accepted for the MVP.
- `pg` with Drizzle's `node-postgres` driver. The app uses a small `Pool`
  over the pooled string; migrations and scripts use the direct string. With
  seed mode gone the trigger needs no session settings, so the pooler's
  transaction mode is safe (inferred).
- Locally and in CI, the container's superuser `postgres` plays the owner and
  `scripts/db/setup-roles.sql` creates `app_readonly` with a dev-only
  password. On Neon the human creates it with SQL from `docs/development.md`.
- **Alternative:** Neon's serverless driver. Rejected: it does not run against
  a plain Postgres in CI, so tests would not match production.

### 4. Triggers decide the feed-entry time

A `BEFORE INSERT OR UPDATE` trigger on `video` (hand-written SQL, `plpgsql`):

```
in_feed(s) = s in ('ready', 'needs_recipe')

INSERT:  entered_feed_at := now() if in_feed(status) else NULL
         (any sent value is overwritten)
UPDATE:  if not in_feed(OLD.status) and in_feed(NEW.status)
              entered_feed_at := now()          (sent value ignored)
         elif entered_feed_at changed
              RAISE EXCEPTION                   (incl. clearing it)
         if (OLD.status = 'rejected') <> (NEW.status = 'rejected')
              RAISE EXCEPTION
```

- A check constraint on the table requires `entered_feed_at` for `ready` and
  `needs_recipe`. It runs after the trigger, so the two never disagree.
- The column is `timestamptz(3)`: the stored value rounds to the millisecond,
  so it survives a JS `Date` round trip in REC-002's cursor; equal times are
  ties broken by `id`.
- A second trigger on both tables sets `updated_at := now()` on update.
- **Alternative:** an application helper. Rejected: a console edit or any
  other writer would bypass it (the point of REC-020 Rule 2).

### 5. Grants live in a migration

A custom migration runs `GRANT USAGE ON SCHEMA public`, `GRANT SELECT ON ALL
TABLES`, and, inside a `DO` block, `ALTER DEFAULT PRIVILEGES FOR ROLE
<current_user> … GRANT SELECT ON TABLES TO app_readonly`, built with
`format('%I', current_user)` because Neon's owner role name is
project-specific. It first checks `app_readonly` exists and raises a clear
error if not. It must run as the same role every time, so the migration
workflow and the local script both use the direct connection.

### 6. Migrations: generated first, hand-written after

`src/lib/db/migrations/`: `0000` generated from `schema.ts` (tables, enums,
check constraints, unique key, foreign key with `ON DELETE CASCADE`, feed
index); `0001` the feed-entry and `rejected` trigger; `0002` the `updated_at`
trigger; `0003` the grants. Additive only after merge. The first task is a
throwaway spike that proves `--custom` plus the journal plus statement
breakpoints around `$$` function bodies, because that is the one unknown in
the tooling.

### 7. Test harness

```
vitest.config.ts   projects: unit  (src/**/*.test.ts, minus *.db.test.ts)
                              db    (src/**/*.db.test.ts, globalSetup)
pnpm test     -> --project unit        (no database)
pnpm test:db  -> --project db

globalSetup: connect as the owner to the test cluster
             run setup-roles.sql (idempotent)
             create template_catalog, run the migrations once, disconnect
per file:    CREATE DATABASE t_<random> TEMPLATE template_catalog
             ... tests ...   DROP DATABASE ... WITH (FORCE)
teardown:    drop template_catalog
```

- A copy from a template is fast and files cannot see each other, so they run
  in parallel. Roles are per cluster, created once.
- The read-only tests connect to the per-file database as `app_readonly`.
- "Migrations run twice" runs the migrator again on a per-file database.
- With no database reachable, the setup fails with one message saying to run
  `pnpm db:up`.
- The test cluster is `TEST_DATABASE_URL`, default the local compose database;
  CI sets it to the service container.

### 8. Local and CI Postgres

`docker-compose.yml` runs `postgres:17` (port 5432, a volume, a healthcheck);
`pnpm db:up` / `db:down`. Homebrew's `postgresql@17` also works; both are in
`docs/development.md`. CI's `check` job gets `services: postgres:17` with a
health check and runs `pnpm test:db` after `pnpm test`. Scripts load env with
`node --env-file=.env.local`, so there is no `dotenv`; `.env.example` is
committed with local values and `docs/development.md` says to copy it.
`docker compose` is a development tool, recorded in ADR 0007.

### 9. Production migrations (PR 2)

`.github/workflows/migrate.yml`: `on: push` to `main` with a `paths` filter
on `src/lib/db/migrations/**` (no needless wake-ups of Neon), plus
`workflow_dispatch`; `concurrency` group `migrate-production` with
`cancel-in-progress: false` (a later run waits); `permissions: contents:
read`; it installs, then runs `pnpm db:migrate` with `DATABASE_URL_DIRECT`
inside a three-attempt retry with a short pause for the cold start. A failure
is a red run with GitHub's notice; the fix is a new migration in a new PR.
Because Vercel and the migration finish in either order, migrations are
additive only (removing or renaming takes two PRs).

### 10. Architecture records and docs

- **ADR 0007** "Database connections, roles and migrations" (Accepted; refines
  ADR 0003, does not supersede it): the driver, the two connection strings,
  the two roles, Postgres 17, the CI service container and local compose,
  additive-only migrations, migrate on merge. Written with `write-adr`; the
  ADR index gains its row.
- **C4 level 2** (PR 2): a migration workflow container writing to the
  database as the owner; the app-to-database relation reads "as
  `app_readonly`"; a Paths bullet for the CI test database; ADR 0007 in
  Related ADRs.
- `docs/development.md` gains the database setup, a "Create the Neon project"
  section (project on Postgres 17, `app_readonly` created with SQL, the two
  secrets) and a short "Reviewing a migration" checklist (additive only,
  `NOT NULL` needs a default, constraints on existing rows, generated files
  match `schema.ts`).
- `docs/api/openapi.yaml`: the two lines that describe the recipe as one JSON
  value on `videos` now describe two tables. `data-model.md`: "Built now"
  dropped, `timestamptz(3)`, `jsonb` kept, Rule 2 says the database ignores a
  sent time and rejects changes to it, and the time is kept on leaving.

## Risks / Trade-offs

- **Drizzle's custom migrations and journal** → the first task is a spike; if
  they do not work as assumed, the hand-written SQL is applied by a small
  runner with the same ordering and the ADR says so.
- **Template-database copies need no open connections to the template** →
  `globalSetup` disconnects before tests start; the harness never connects to
  it afterwards.
- **A role created in Neon's Console joins `neon_superuser`** → the docs say
  SQL only, and PR 2's manual check proves a write as `app_readonly` is
  rejected on production.
- **Grants depend on who runs the migration** → one workflow, one connection;
  `docs/development.md` says never to migrate from another role.
- **First production migration meets a suspended compute** → the three-attempt
  retry; if Neon's connect time proves longer, the pause is raised.
- **A preview needing an unmerged migration fails before merge** → accepted
  (decided 2026-11-20); schema PRs are tested locally.
- **CI grows** (a Postgres service and about 25 tests) → measured in PR 1;
  the database project is parallel by file.

## Migration Plan

PR 1 changes no production system: revert it to undo. PR 2 adds the workflow;
after the human's Neon setup the first merge runs the first migration, and the
two manual checks are done by hand. A failed migration is fixed forward with a
new migration; there is no automatic rollback.

## Open Questions

- Pool size and idle timeout for the app's `Pool` on Vercel: set with real
  traffic by REC-002; PR 1 ships a small default and the ADR names it.
