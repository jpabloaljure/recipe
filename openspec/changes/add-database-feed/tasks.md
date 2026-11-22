# Tasks

Decisions are in `design.md` (D1–D9); requirements in the delta specs
`specs/feed/spec.md` and `specs/video-catalog/spec.md`. Work on a branch and
open a pull request (`main` is protected); run `pnpm typecheck`, `pnpm test`,
`pnpm test:db` and `pnpm test:e2e` before each push.

## 1. Start and CI seeding (the riskiest part, first)

- [x] 1.1 Set REC-002 to `**Status:** in-progress` in `backlog/E01-browse-feed.md` with the Edit tool (so `.claude/hooks/validate-ac.sh` runs); verify the hook accepts the edit and the story's Flags are still `—`
- [x] 1.2 Add `scripts/db/seed.mts` (D7) that writes fixture videos through `createDirectDb()`: `ready` videos with recipes, `needs_recipe`, and one of each excluded status, with ties from one transaction and an order from separate ones; add a unit test for the pure part that builds the rows; verify `pnpm test` passes and a second run against the same database fails clearly or changes nothing (documented in the script header)
- [ ] 1.3 Add a CI step before `E2E tests` in `.github/workflows/ci.yml` (D6) that migrates the service container, runs `setup-roles`, runs the seed script, and sets `DATABASE_URL` (the `app_readonly` role) for the E2E step; verify the CI `check` job runs the step green on the pull request and that `pnpm start` serves `/api/feed` from the seeded database (read the job log)

## 2. Feed route and cursor

- [x] 2.1 Add `src/lib/feed/cursor.ts` (D1) that encodes and decodes the cursor `{t, i}`; verify `pnpm test` covers: round trip, the empty string, non-base64, JSON of the wrong shape, an invalid time and a non-integer ID each reported as invalid
- [x] 2.2 Add the feed query (D1, D4) in `src/lib/feed/` using Drizzle: status filter, keyset condition, newest first, `limit 11`, left join on `recipe`; add `*.db.test.ts` and verify `pnpm test:db` covers: only `ready` and `needs_recipe` returned, walking every page returns each video exactly once, ties on `entered_feed_at` at a page boundary neither repeat nor skip, an exactly full last page returns `nextCursor: null`, a cursor past the end returns no rows, `ready` carries its recipe and `needs_recipe` has `recipe: null`
- [x] 2.3 Replace the fixture inside `src/app/api/feed/route.ts` with the query, injected as a function (D2), and a single cache-header helper (D3); verify `pnpm test` passes a rewritten `route.test.ts` with hand-written expected values covering: page with items has `public, s-maxage=3600` (first and cursor pages), empty first page returns `items: []`, `nextCursor: null` and `no-store`, a decodable cursor with nothing after it returns the same empty page, an undecodable cursor returns 400 `invalid_cursor` with `no-store`, and a throwing query returns 500 `internal_error` with `no-store`
- [x] 2.4 Delete `src/lib/feed/fixture.ts`, `fixture-pages.ts` and `fixture-pages.test.ts`; verify `pnpm typecheck` and `pnpm test` pass and `grep -r "fixture" src` finds no leftover import of them
- [x] 2.5 Update `docs/api/openapi.yaml` (the implementers; the `Cursor` parameter and the 400 response no longer say "points past the end" returns 400; an empty last page instead) and keep `src/lib/feed/types.ts` in sync; verify by reading both side by side and run the `doc-checker` agent on the file

## 3. Client shuffle and E2E rework

- [x] 3.1 Add `shufflePage(items, random)` in `src/lib/feed/` and use it in `appendPage` with an optional random source defaulting to `Math.random` (D5); verify `pnpm test` covers: a shuffled page holds exactly the server page's videos, a seeded source gives a known order, pages already in the visit keep their order when a later page loads, and a video already in the visit is still skipped
- [x] 3.2 Rework `e2e/feed/wrap-to-the-start-after-the-last-video.spec.ts` so its three tests (`feed › Wrap to the start after the last video › Swipe past the last video`, `› Catalog spans several pages`, `› Keep swiping after the wrap`) read the first, second and last video of the order actually shown and do not assume arrival order; verify `pnpm test:e2e` passes on `phone-portrait`, `phone-landscape` and `desktop`, and that the tests still stub `/api/feed` with `page.route`
- [x] 3.3 Keep the `@smoke` test unstubbed (REC-001 #45), now `e2e/feed/real-data-reaches-the-deployed-feed-build.spec.ts` (E2E rule 4): verify it passes in CI against the seeded database (scenario `feed › Real data reaches the deployed feed build › Smoke test against a seeded database`)
- [x] 3.4 Update the REC-001 Technical context line that says REC-002 "puts the shuffle in the route" in `backlog/E01-browse-feed.md`, with the Edit tool; verify the line now says the shuffle is a client function (REC-002 D5)

## 4. Curated-list loader

- [x] 4.1 Add `validateEntry` and the list reading in `scripts/db/` (D7): fails before any write when the file is missing or not valid JSON; skips an entry without a title, channel, `channel_id`, `duration_seconds`, `embeddable` or `language`, logging its YouTube ID and reason; keeps the first of a duplicated ID and logs the later one; marks an entry that fails the ING-2 checks `rejected`; add unit tests and verify `pnpm test` covers each of those cases
- [x] 4.2 Add `scripts/db/load-curated.mts`, which inserts with `on conflict (youtube_id) do nothing` through `createDirectDb()` and sets no feed-entry time; add `*.db.test.ts` and verify `pnpm test:db` covers: entries stored as `needs_recipe` with the listed values, a failing Short stored as `rejected` and absent from the feed query, a second run changing and duplicating nothing, and a run that failed partway followed by a re-run loading only the remaining entries
- [ ] 4.3 Add `.github/workflows/load-curated.yml` (D8): `workflow_dispatch` only, `main` only, `DATABASE_URL_DIRECT` from secrets, one run at a time; verify it parses by running `gh workflow list` after the pull request is open and by reading it against `migrate.yml`
- [x] 4.4 Add `scripts/db/curated-shorts.json` with 24 real, public, embeddable English cooking Shorts that pass the checks, plus 3 that fail on purpose (one too long, two not embeddable), 27 in all, each with title, channel name and the four ING-2 facts, written and checked by the maintainer (no invented IDs); verify each ID plays at `https://www.youtube-nocookie.com/embed/<id>` and a dry run of the validation reports no skipped entries

## 5. Architecture docs and close-out

- [x] 5.1 Update `docs/architecture/c4/02-containers.md` (the `s-maxage` "with revalidation" wording becomes a plain 1 hour cache; the batch path names the manual loader) and `docs/architecture/c4/03-components-web-app.md` (drop "fixture data until REC-002" and "light shuffle with REC-002"; "Reads (from REC-002)" becomes "Reads"); verify the diagrams render in the Mermaid preview and run the `doc-checker` agent on both files
- [x] 5.2 Document the loader and the seed script in `docs/development.md` (how to run each locally and how to start the loader workflow); verify the documented commands run as written against a local database
- [ ] 5.3 Run `pnpm typecheck`, `pnpm test`, `pnpm test:db`, `pnpm build` and `pnpm test:e2e` together; verify all pass and the pull request's CI `check` is green
- [x] 5.4 Run the `doc-checker` agent on every doc file changed in groups 2 to 5; fix or explain each `problem` and `unsure` item

## Manual checks (E2E rule 13, to run after the first deploy)

- [ ] M.1 A second request to `https://recipe-henna-pi.vercel.app/api/feed` shows a Vercel cache `HIT`; only the deployed CDN can show whether it keeps `s-maxage`
- [ ] M.2 Recheck that the list's embeds still play (blocks can change by region or over time) and skim the language guesses noted for the list, then run the loader workflow once on `main` with the real list; verify the videos exist as `needs_recipe` in the production database and appear in the feed after the 1 hour cache
- [ ] M.3 Real finger flick and real mouse-wheel wrap on the real feed (E2E rule 13), checking that the first video after the wrap is the first of the order just seen

## Scenarios covered by unit or database tests, not E2E (E2E rule 1)

These scenarios are server or pure-logic rules, with no layout, scrolling or
component wiring only a browser can show: `Feed contains ready and title-only
videos › Mixed statuses`, `Feed pages are newest first` (both), `The last page
says there are no more pages` (all four), `Invalid page requests are
rejected` (both), `Feed pages are cacheable, errors and empty pages are not`
(all four) and `Fresh order within each page` (both) are covered by tasks 2.1
to 2.3 and 3.1; the `video-catalog` loader scenarios by tasks 4.1 and 4.2.

## Workflow follow-up

- The first production smoke run on the merge commit is expected to fail (production has no videos yet). After the loader workflow has run (M.2), re-run that smoke run (`gh run rerun <run-id>`) and check it is green.
- After the merge and the deploy, run M.1 to M.3, then archive the change with `openspec-archive-change` and set REC-002 to `Status: done` once the Definition of Done is met.
