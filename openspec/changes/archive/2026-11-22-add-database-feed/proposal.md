# Proposal

## Why

`GET /api/feed` still pages a fixture of three title-only videos (REC-001),
so the deployed app shows no real data. The catalog tables now exist
(REC-019, `add-video-catalog-schema`), and the client, the contract
(`docs/api/openapi.yaml`, REC-021) and the stub route are in place. REC-002
connects them: the route reads the database, the visit gets a fresh order,
and a curated list of real Shorts is loaded into production so Entrega 2
shows real videos before daily discovery (REC-005) exists.

## What Changes

Implements **REC-002** (re-validated 2026-11-22, team estimate 8, `size:L`,
no `needs-human-validation` flag; confirmed before writing). One change.

- **Feed route reads the database.** `GET /api/feed` returns `ready` and
  `needs_recipe` videos newest first, 10 per page, with a keyset cursor on
  (`entered_feed_at`, `id`), one extra row read so an exactly full last page
  already reports no more pages, and cache headers by response type
  (`s-maxage=3600` for a page with videos, `no-store` for empty and error
  responses). A cursor that cannot be decoded returns 400; a cursor that
  decodes but has no videos after it returns an empty last page.
- **Light shuffle on the client.** A pure function with an injectable random
  source shuffles each server page once per visit; loaded pages are never
  reshuffled. REC-001's three wrap E2E tests become independent of arrival
  order.
- **CI serves real data to the smoke test.** The E2E step migrates, creates
  `app_readonly` and seeds the Postgres service container, and starts the
  production build against it, so `@smoke` still exercises the real route.
- **Seed script and curated-list loader.** A seed script gives tests and CI
  fixture videos. The loader reads a JSON list of real Shorts and stores
  each as `needs_recipe`, or `rejected` when it fails the ING-2 checks,
  skipping invalid entries and videos already stored; it runs as a manual
  GitHub Actions workflow with `DATABASE_URL_DIRECT`.
- **Removed:** the fixture, its paging and the offset cursor `{"o":n}` with
  page size 3. **BREAKING (accepted):** a page open at deploy time holding an
  old-format cursor gets 400 and the client treats it as a failed page
  (REC-018).
- **Docs:** `docs/api/openapi.yaml` (implementers; a cursor past the end
  returns an empty last page, not 400), C4 containers and level 3 "Feed
  route" wording, and REC-001's Technical context line about where the
  shuffle lives.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `feed`: the scenario "Catalog spans several pages" no longer says "the
  first video of the first page"; the wrap replays this visit's order, which
  the shuffle makes different from arrival order. A requirement for the
  feed's contents and paging (which videos, newest first, last-page and
  cache behavior) is added, and one for the per-visit shuffle.
- `video-catalog`: new requirements for loading a curated list (stored as
  `needs_recipe` or `rejected`, invalid entries skipped, re-runs change
  nothing).

## Impact

- **Code:** `src/app/api/feed/route.ts`, new feed query and cursor modules in
  `src/lib/feed/`, `src/lib/feed/feed-state.ts` (shuffle),
  `src/lib/feed/types.ts`; deleted `fixture.ts`, `fixture-pages.ts` and
  tests; new `scripts/db/seed.mts` and loader with its list file;
  `.github/workflows/ci.yml` and a new manual loader workflow.
- **Tests:** Vitest unit tests for the route, cursor, shuffle and loader;
  `*.db.test.ts` for the keyset walk and loader against a real database;
  Playwright wrap tests reworked.
- **Docs:** `openapi.yaml`, C4 `02-containers.md` and level 3, REC-001's
  Technical context.
- **Dependencies and ADRs:** none added; ADR 0007 already covers `pg`,
  Drizzle and the roles.
- **Out of scope (owned elsewhere):** schema and migrations (REC-019),
  next-page trigger (REC-001), failed-page and end-of-list loading states
  (REC-018), title-only display (REC-006), deep-link join (REC-014), daily
  discovery (REC-005), availability check and CDN refresh on ingestion
  (`draft-backlog-list.md` D-5, D-6).
