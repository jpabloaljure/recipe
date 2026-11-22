# Development

How to install, run and test Easy Recipes on your machine.

## Prerequisites

- Node 26 or later (see `.nvmrc`).
- pnpm: `npm install -g pnpm` (Node 25+ no longer ships Corepack).
- Docker, for the local database (or Homebrew's `postgresql@17`, see
  [Use Homebrew instead of Docker](#use-homebrew-instead-of-docker)).

The page and the stub `GET /api/feed` need no database. The database setup
below is for working on the schema and for `pnpm test:db`.

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
```

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
[`video-catalog`](../openspec/changes/add-video-catalog-schema/specs/video-catalog/spec.md).

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
push to `main`; `main` is protected and needs it green.
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
