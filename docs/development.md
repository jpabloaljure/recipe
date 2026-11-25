# Development

How to install, run and test Easy Recipes on your machine.

## Prerequisites

- Node 26 or later (see `.nvmrc`).
- pnpm: `npm install -g pnpm` (Node 25+ no longer ships Corepack).
- Docker, for the local database (or Homebrew's `postgresql@17`, see
  [Use Homebrew instead of Docker](#use-homebrew-instead-of-docker)).

The page loads without a database, but `GET /api/feed` reads one: without
`DATABASE_URL` it answers 500 and the feed shows no videos. The database setup
below serves that, the schema work and `pnpm test:db`.

## Run the app

```bash
pnpm install      # install dependencies
pnpm dev          # dev server at http://localhost:3000
pnpm build        # production build
```

## Database

Postgres 17, with Drizzle for the schema and migrations
([ADR 0003](adr/0003-postgres-neon-drizzle.md), [ADR 0007](adr/0007-database-connections-roles-and-migrations.md)).
The schema is `src/lib/db/schema.ts`; the migrations are
`src/lib/db/migrations/`.

```bash
cp .env.example .env.local   # once: local values, git-ignored
pnpm db:up                   # start Postgres 17 in Docker (host port 54329)
pnpm db:setup                # create the read-only role app_readonly (safe to repeat)
pnpm db:migrate              # apply the migrations
pnpm db:seed                 # add made-up fixture videos (safe to repeat)
```

With the seed in place, `pnpm dev` or `pnpm build && pnpm start` serves a real
`GET /api/feed`. Point the app at the local database with
`DATABASE_URL=postgres://app_readonly:app_readonly@localhost:54329/easy_recipes`
(the value in `.env.example`; Next.js reads `.env.local`).

Other commands:

```bash
pnpm db:generate             # after editing schema.ts: write a new migration
pnpm db:generate --custom --name <name>   # an empty SQL migration: triggers, grants
pnpm db:down                 # stop the database (data stays in a Docker volume)
docker compose down -v       # stop it and delete the data: start again from empty
```

- **Two roles.** The app connects as `app_readonly` through `DATABASE_URL` and
  can only read. Migrations and scripts connect as the owner through
  `DATABASE_URL_DIRECT`. `.env.example` has both for the local database.
- **Port 54329**, not 5432, so it does not clash with another Postgres on your
  machine. It listens on `127.0.0.1` only: the superuser password is the
  well-known `postgres`, so it is not reachable from your network.
- **Local only.** `pnpm db:setup` and `pnpm test:db` create a role with a
  dev-only password and create and drop databases, so they refuse to run
  against a host that is not this machine (for example a Neon URL left in
  `.env.local`). `ALLOW_NON_LOCAL_DATABASE=1` overrides it; use it only on a
  throwaway Postgres.
- **Never edit a migration that is merged**: production has already run it.
  Add a new one.
- **Reset after changing an unmerged migration:** `docker compose down -v`, then
  `pnpm db:up`, `pnpm db:setup`, `pnpm db:migrate`.

### Seed script and curated-list loader

- **`pnpm db:seed`** (`scripts/db/seed.mts`) adds 14 made-up videos (11 in the
  feed, 3 outside it) for local development and for CI's end-to-end step. A
  video already stored is left as it is, so running it twice changes nothing.
  It refuses a database that is not this machine.
- **`pnpm db:load-curated [list.json]`** (`scripts/db/load-curated.mts`) loads the
  curated list of real Shorts, `scripts/db/curated-shorts.json` by default. Each
  entry has `youtube_id`, `title`, `channel_name`, `channel_id`,
  `duration_seconds`, `embeddable` and `language`. A Short that is at most 3
  minutes, embeddable and in English is stored as `needs_recipe`; one that
  fails those checks is stored as `rejected` and never shows in the feed. An
  entry with a missing field or a repeated ID is skipped and logged with its
  YouTube ID. A missing or invalid file fails before anything is written, and
  a video already stored is never changed. It uses `DATABASE_URL_DIRECT`, so
  locally it writes to the local database.
- **First deploy of the real feed:** the production smoke run on the merge
  commit fails until the loader has run, because the `@smoke` test needs a
  video. Run the loader workflow, then re-run that smoke run.
- **In production** the loader runs as the manual workflow
  `.github/workflows/load-curated.yml` (Actions tab, "Load curated Shorts", or
  `gh workflow run load-curated.yml`). It runs only from `main` and uses the
  `DATABASE_URL_DIRECT` secret. New videos can take up to an hour to show in the
  feed because of the CDN cache.

### Placeholder recipes for the curated Shorts

The curated Shorts are loaded as title-only (`needs_recipe`). Until the real
extraction exists (REC-008, REC-010), `scripts/db/curated-recipes.json` holds
**dummy recipes**, one per video, written from each video's title (not from its
description or comments) for 21 of the 24 curated videos that are in the
feed (the other 3 of the 27 in the list are `rejected` and never shown). Three
good videos (`U-GTBW-s2RU`, `jPB1-F87ZME` and `qZ-rT0A7MgM`) are left without a
recipe on purpose, to show the title-only state. They are
stored with source `description`, the closest value the schema allows; the
recipe panel's source label would be wrong for them, so replace them before
REC-006 is shown to real users.

- **`pnpm db:load-recipes`** applies the file: for each video that is still
  `needs_recipe`, in one transaction, it writes the recipe, sets the status
  (`ready` when the recipe is easy, PRD 6.3, else `not_easy`) and sets the
  title to the dish name. The original title stays in `curated-shorts.json`.
  `--dry-run` shows the plan and writes nothing; `--revert` puts the original
  title and `needs_recipe` back, only for a recipe that is still the
  placeholder; `--check` only runs the read-only catalog health check. A video
  that is no longer `needs_recipe` is never touched, so running it again
  changes nothing. It uses `DATABASE_URL_DIRECT`, so locally it writes to the
  local database.
- **The health check** runs at the end of every run and fails if a catalog
  rule is broken: a `ready` or `not_easy` video without a recipe, a
  `needs_recipe` or `rejected` one with a recipe, a wrong `ingredient_count`,
  an incomplete recipe (EXT-5), a `ready` recipe that is not easy or a
  `not_easy` one that is.
- **In production** it runs as the manual workflow
  `.github/workflows/load-recipes.yml` (Actions tab, "Load placeholder
  recipes", mode `dry-run` by default, or
  `gh workflow run load-recipes.yml -f mode=apply`). It runs only from `main`.
  The real extraction skips known videos (ING-3), so these recipes stay until
  they are reverted (draft backlog D-22).

### Reviewing a migration

A migration runs on production right after the merge and cannot be edited
afterwards. When one is in a pull request, check that:

- it matches the story and `docs/architecture/data-model.md`;
- it only adds (tables, columns, indexes, constraints); a `DROP`, a rename or a
  type change takes two pull requests, so the app works whether the deploy or
  the migration finishes first;
- a new `NOT NULL` column has a default, and a new constraint will not fail on
  rows that already exist: CI starts from an empty database and cannot catch
  this;
- a generated migration matches the change in `schema.ts` (run
  `pnpm db:generate`: it should say there is nothing to migrate), and a
  hand-written one reads correctly, including that it can run on a database
  that already has the change;
- no earlier migration file was edited, and the new file is numbered after the
  last merged one.

## Checks

```bash
pnpm typecheck    # TypeScript strict check
pnpm test         # unit tests (Vitest); needs no database
pnpm test:db      # database tests; needs `pnpm db:up`
```

`pnpm test:db` builds a template database from the migrations once, gives every
test file its own copy (so files run in parallel and cannot see each other) and
drops the copies afterwards. Every database it creates is named
`er_test_<run id>_…`, and at the end it drops only the ones of its own run, so
it never touches `easy_recipes`, your other databases or production, and two
runs at the same time do not disturb each other. Each test is named after a
scenario of
[`video-catalog`](../openspec/specs/video-catalog/spec.md).

If the database is not running you will see `Cannot reach the test database.
Start Postgres with pnpm db:up`. Vitest may print `No test files found` just
before it; that line is a quirk of how it reports a failing setup, not the
problem.

## End-to-end tests

Playwright in Chromium, on three screen projects: `phone-portrait`,
`phone-landscape` and `desktop` ([ADR 0006](adr/0006-playwright-end-to-end-tests.md)).
The rules for writing them are in [AGENTS.md › End-to-end (E2E) test rules](../AGENTS.md#end-to-end-e2e-test-rules);
shared code is in `e2e/support/`.

```bash
pnpm exec playwright install chromium   # once: download the test browser
pnpm test:e2e                           # build, start and test on 3 screen sizes
pnpm test:e2e --grep @smoke             # smoke test only
```

`pnpm test:e2e` reuses a server already running on port 3000; stop `pnpm dev`
first so the tests run against the production build.

The `@smoke` test does not stub `/api/feed`: it loads the real route and checks
the feed shows a video, so it needs `DATABASE_URL` to point at a migrated,
seeded database (`pnpm db:seed`). Every other test stubs the feed itself.

## Test a deployed site

Set `BASE_URL` and Playwright tests that URL instead of starting a local
server. The production smoke check (run automatically after each production
deploy, see [CONTRIBUTING.md › Production smoke check](../CONTRIBUTING.md#production-smoke-check)):

```bash
BASE_URL=https://recipe-henna-pi.vercel.app pnpm test:e2e --grep @smoke --project=desktop --project=phone-portrait
```

## Continuous integration

`.github/workflows/ci.yml` runs typecheck, unit tests, database tests (against a
`postgres:17` service container), build and E2E tests on every pull request and
push to `main` (the E2E step migrates and seeds that container and starts the
build against it as `app_readonly`); `main` is protected and needs it green.
`.github/workflows/smoke-production.yml` runs the smoke test against
production after each deploy.

## Use Homebrew instead of Docker

```bash
brew install postgresql@17 && brew services start postgresql@17
createdb easy_recipes
```

Then, in `.env.local`, point the three URLs at port 5432 and your macOS user
(for example `postgres://<you>@localhost:5432/easy_recipes`), and run
`pnpm db:setup` and `pnpm db:migrate` as above. `TEST_DATABASE_URL` is the same
server with the `postgres` database.

## Create the Neon project (production)

Done once by the maintainer, before the migration workflow runs. **Never paste a
connection string or password into a chat, an issue or a commit.**

1. **Create the project** in the Neon console on **Postgres 17**, in a region
   close to Vercel's. Neon creates an owner role and a database.
2. **Copy the two connection strings** from Neon's connection details: the
   *direct* one and the *pooled* one (its host has `-pooler`).
3. **Create the read-only role with SQL**, in Neon's *SQL editor*, connected as
   the owner. Do **not** create it from the console's roles page: roles made
   there become members of `neon_superuser` and can write.

   ```sql
   CREATE ROLE app_readonly WITH LOGIN PASSWORD '<a long random password>';
   ```

   Check it has no extra rights; this must return no rows:

   ```sql
   SELECT * FROM pg_auth_members WHERE member = 'app_readonly'::regrole;
   ```

4. **Set the secrets:**
   - `DATABASE_URL` in **Vercel** (Production and Preview): the *pooled* string,
     with the `app_readonly` user and password. The app, and every preview,
     only reads.
   - `DATABASE_URL_DIRECT` in **GitHub Actions secrets** (never in Vercel): the
     *direct* string, with the owner role.
5. **Migrations** are applied only by the migration workflow, as the owner, so
   the grants in migration `0003` cover every table later migrations create. Do
   not run them from another role.

A preview whose code needs a migration that is not merged yet can fail; test
schema changes locally first.

## Production migrations

`.github/workflows/migrate.yml` applies the migrations to the production
database after a merge to `main`.

- **When it runs:** on a push to `main` that changes `src/lib/db/migrations/`
  (so Neon is not woken for nothing), or by hand from `main`:

  ```bash
  gh workflow run migrate.yml        # then: gh run watch
  ```

  Started from any other branch, the job is skipped, so an unmerged migration
  can never reach production.
- **How:** as the owner role, through `DATABASE_URL_DIRECT` (a GitHub Actions
  secret), one run at a time (a later run waits). The first connection after the
  database has been idle can meet Neon's cold start, so it tries up to three
  times, ten seconds apart.
- **Only new migrations run.** Drizzle records the ones already applied in its
  own `drizzle` schema, so a run with nothing new does nothing.
- **If a run fails:** it is a red run. There is no automatic rollback: read the
  log, and fix it with a **new** migration in a new pull request. Never edit a
  migration that is merged.
- **Additive only:** Vercel deploys and the migration finish in either order, so
  a migration only adds (see "Reviewing a migration" above).
