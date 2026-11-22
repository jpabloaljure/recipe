# Tasks

PR 1 is groups 1–8 (branch `feat/rec-019-video-catalog-schema`, no Neon
needed). PR 2 is groups 10–12 (branch `feat/rec-019-migrate-production`) and
starts after group 9, which is done by the human.

Every database test is a Vitest file named `*.db.test.ts`, and each test is
named `video-catalog › <Requirement> › <Scenario>`. No scenario here is
visible in a browser (`layer:db`, E2E rule 12), so there are no E2E tasks;
the two scenarios that need production are manual checks in group 11.

## 0. Before starting

- [x] 0.1 From an up-to-date `main`, create `feat/rec-019-video-catalog-schema`; set REC-019 to `**Status:** in-progress` in `backlog/E01-browse-feed.md` with the Edit tool (so `.claude/hooks/validate-ac.sh` runs); verify the hook accepts the edit, REC-019's Flags are only `split-from:REC-002`, and `git status` shows nothing else

## 1. Spike, decision record and dependencies

- [x] 1.1 Throwaway spike (scratchpad, not committed): with a local `postgres:17`, run `drizzle-kit generate`, then `generate --custom` with a hand-written `plpgsql` function body split by `--> statement-breakpoint`, then `drizzle-kit migrate` twice; verify the second run changes nothing, the function exists, the history table sits outside `public`, and write the outcome in design.md "Context" (and, if it differs from the assumptions, change Decision 6 before going on)
- [x] 1.2 Write ADR 0007 "Database connections, roles and migrations" with the `write-adr` skill (Accepted; refines ADR 0003, does not supersede it): `pg` driver, pooled `DATABASE_URL` as `app_readonly` and direct `DATABASE_URL_DIRECT` as the owner, Postgres 17, CI service container and local `docker compose`, additive-only migrations, migrate on merge, the app pool size default; add its row to `docs/adr/README.md`; verify the `doc-checker` agent reports no problem on the ADR files
- [x] 1.3 Add `drizzle-orm`, `pg`, `@types/pg` and `drizzle-kit` (dev) to `package.json`; verify `pnpm install --frozen-lockfile` and `pnpm typecheck` pass and no other dependency changed

## 2. Local database and test harness

- [x] 2.1 Add `docker-compose.yml` (`postgres:17`, host port 54329, a volume, a healthcheck), `.env.example` (`DATABASE_URL`, `DATABASE_URL_DIRECT`, `TEST_DATABASE_URL` with local values), `drizzle.config.ts`, `scripts/db/setup-roles.sql` (creates `app_readonly` with a dev-only password, safe to run twice) and the `db:up`, `db:down`, `db:setup`, `db:generate`, `db:migrate` scripts loading `.env.local` with `process.loadEnvFile` when it exists; verify `pnpm db:up` starts Postgres 17 and `pnpm db:setup` runs twice with no error
- [x] 2.2 Split `vitest.config.ts` into the `unit` project (`src/**/*.test.ts` except `*.db.test.ts`) and the `db` project (`*.db.test.ts`, with a global setup), and point `pnpm test` at `unit` and a new `pnpm test:db` at `db`; verify `pnpm test` passes with no database running
- [x] 2.3 Write the global setup and a per-file helper in `src/lib/db/test/`: run the role script, create `template_catalog` and run the migrations once, then give each test file a database copied from it and drop it afterwards (`DROP DATABASE … WITH (FORCE)`); with no reachable database, fail with one message that says to run `pnpm db:up`; verify two harness tests run in parallel, cannot see each other's rows, and leave no `t_*` database behind
- [x] 2.4 In `.github/workflows/ci.yml`, add the `postgres:17` service (health-checked, `TEST_DATABASE_URL` set) and a `Database tests` step running `pnpm test:db` after `pnpm test`; verify on the PR that `check` runs the step and passes

## 3. Tables and integrity rules

- [x] 3.1 Write `src/lib/db/schema.ts` (video and recipe tables, the status and source enums, `entered_feed_at` as `timestamptz(3)`, check constraints, unique `youtube_id`, recipe foreign key `ON DELETE CASCADE`, `jsonb` lists, the feed index on (status, `entered_feed_at`, `id`)) and generate migration `0000`; verify `drizzle-kit generate` shows no further change and the migration runs on an empty database
- [x] 3.2 Add `catalog.db.test.ts` for the requirements Catalog tables, Unique YouTube ID, Required video fields, Recipe rules and Recipe is deleted with its video, one test per scenario; verify `pnpm test:db` passes and each of these tests fails when the matching constraint is removed from the migration
- [x] 3.3 Add the unit-test-only checks to the same file: the feed index exists on (status, `entered_feed_at`, `id`), `created_at` defaults to now, and `ingredients` and `steps` must be JSON lists; verify they pass

## 4. Feed-entry time and rejected

- [x] 4.1 Write migration `0001` (hand-written SQL via `drizzle-kit generate --custom`): the `BEFORE INSERT OR UPDATE` trigger on `video` from design Decision 4 and the check constraint that requires the time for `ready` and `needs_recipe`; verify it runs on the empty database from 2.3 and twice in a row
- [x] 4.2 Add `entered-feed-at.db.test.ts` for the requirements Feed-entry time is set by the database, Feed-entry time is protected, Feed-entry time is kept otherwise and Rejected is only for first-time candidates, one test per scenario; verify `pnpm test:db` passes and each of these tests fails when the trigger is removed from the migration
- [x] 4.3 Add the unit-test-only checks: the stored time has millisecond precision, a time sent with a status change into the feed is ignored, and two videos inserted in one transaction share one time; verify they pass

## 5. Updated time, read-only access and repeatable migrations

- [x] 5.1 Write migration `0002` (the `updated_at` trigger on both tables) and migration `0003` (the grants for `app_readonly`: `USAGE` on `public`, `SELECT` on all tables, default privileges for the migrating role, with a clear error if the role is missing) as hand-written SQL; verify they run twice with no error
- [x] 5.2 Add `access.db.test.ts` for the requirements Updated time is kept by the database, Read-only access for the app and Migrations are repeatable: the read tests and the write-rejection test connect as `app_readonly`, and the repeat test runs the migrator again on a per-file database; verify `pnpm test:db` passes

## 6. Shared client

- [x] 6.1 Write `src/lib/db/client.ts` (a small `Pool` over the pooled `DATABASE_URL` for the app, and a direct client over `DATABASE_URL_DIRECT` for migrations and scripts, with `drizzle-orm`) and a migration script that uses the direct one; add `client.db.test.ts` checking the pooled client reads as `app_readonly` and its write is rejected, and the direct client writes; verify `pnpm db:migrate` applies the four migrations to the local database and `pnpm test:db` passes

## 7. Documentation for PR 1

- [x] 7.1 Update `docs/development.md` (start Postgres with `pnpm db:up` or Homebrew's `postgresql@17`, copy `.env.example`, `db:*` and `test:db` scripts, a "Create the Neon project" section: Postgres 17, `app_readonly` created with SQL not the Console, the two secrets, and a "Reviewing a migration" checklist: additive only, `NOT NULL` needs a default, constraints on existing rows, generated files match `schema.ts`) and README §1.4 and §2.4; verify the commands in them run as written on a clean checkout
- [x] 7.2 Update `docs/api/openapi.yaml` (the two lines that describe the recipe as one JSON value) and `docs/architecture/data-model.md` (drop "Built now", `entered_feed_at` as `timestamptz(3)`, `jsonb` kept, Rule 2 says the database ignores a sent time and rejects changes to it and keeps the time on leaving, the check constraint), leaving its `Status:` as `Proposed`; verify the `doc-checker` agent reports no problem on the changed files

## 8. Ship PR 1

- [ ] 8.1 Run `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build` and `pnpm test:e2e` locally; open the PR from `feat/rec-019-video-catalog-schema` with the PR template, run `/code-review --comment <PR#>`, resolve every thread and merge once CI `check` is green; verify the AGENTS.md "Stack" table and the PR description name the new dependencies

## 9. Neon setup (human; PR 2 waits for it)

- [ ] 9.1 The human creates the Neon project on Postgres 17 (a region near Vercel's), following `docs/development.md`; verify they confirm in chat and give no secret
- [ ] 9.2 The human creates `app_readonly` with SQL in Neon's SQL editor, not from the Console's roles page; verify they confirm the role is not a member of `neon_superuser` (Neon docs, checked when done)
- [ ] 9.3 The human sets `DATABASE_URL` (pooled, `app_readonly`) in Vercel for Production and Preview and `DATABASE_URL_DIRECT` (direct, owner) in GitHub Actions secrets; verify `gh secret list` shows `DATABASE_URL_DIRECT` and the human confirms the Vercel variable (values are never shown in chat)

## 10. Migration workflow and C4 (PR 2)

- [ ] 10.1 From an up-to-date `main`, create `feat/rec-019-migrate-production` and add `.github/workflows/migrate.yml` (design Decision 9: push to `main` with the migrations `paths` filter, `workflow_dispatch`, concurrency group `migrate-production` without cancelling, `contents: read`, three attempts with a pause); verify the YAML parses and the workflow appears in `gh workflow list` after the PR is opened
- [ ] 10.2 Update `docs/architecture/c4/02-containers.md` (the migration workflow container writing as the owner, the app-to-database relation as `app_readonly`, a Paths bullet for the CI test database, ADR 0007 in Related ADRs) and set `docs/architecture/data-model.md` and `docs/architecture/README.md` to `Status: Current`; verify the Mermaid block still renders and the `doc-checker` agent reports no problem
- [ ] 10.3 Update `docs/checklist.md` Entrega 2 items 12 (Neon, secrets and the migration workflow done) and 15 (database tests); verify the statuses match what exists

## 11. Production checks (manual, after PR 2 merges)

- [ ] 11.1 Manual check: the first run of the migration workflow (triggered by the merge, or `workflow_dispatch`) is green and applies all four migrations to the production database; verify the run's log and that the `video` and `recipe` tables exist in Neon's SQL editor. Reason it is manual: it needs the production database
- [ ] 11.2 Manual check: connected as `app_readonly` to production, a `SELECT` on `video` succeeds and an `INSERT` is rejected; verify and write the result in the PR. Reason it is manual: only the human holds the production credential, and the test database cannot prove Neon's role model

## 12. Ship PR 2 and close out

- [ ] 12.1 Open the PR from `feat/rec-019-migrate-production` with the PR template, resolve review threads and merge once `check` is green; verify the migration workflow's first run starts on the merge
- [ ] 12.2 Set REC-019 to `**Status:** done` with the Edit tool once 11.1 and 11.2 pass and the Definition of Done is met; verify the hook accepts the edit and the validation log row stays `validated`

## Workflow follow-up

- Archive this change after PR 2 merges (sync `specs/video-catalog` into `openspec/specs/video-catalog/`).
- REC-002 is then unblocked: remove its `blocked-by:REC-019` flag when its validation resumes, and revisit its estimate for the curated-list loader.
