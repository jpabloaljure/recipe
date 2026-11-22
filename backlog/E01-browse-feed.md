---
id: E01
title: Browse a curated feed with no waiting
prd-goal: G1
---

## REC-001 · Vertical full-screen feed with manual swipe
- **Status:** done
- **Labels:** module:feed, type:feature, size:M, layer:fullstack
- **PRD:** 5.1, 5.2
- **Flags:** —
- **AI estimate:** 5
- **Estimate:** 5

As a home cook, I want to swipe through short recipe videos one at a time, so that I can quickly find something to cook today.

### Acceptance criteria
- Given I open the app on a phone in portrait, when the feed loads, then one full-screen vertical video is shown at a time.
- Given a video is playing, when it reaches the end, then the feed stays on that video.
- Given a video is active, when I swipe or scroll to another video, then the next or previous video becomes active, exactly one video per gesture.
- Given I am on desktop or on a phone in landscape, when the feed is shown, then the vertical video is centered on the screen.
- Given the last video in the catalog is active, when I swipe to the next video, then the first video of this visit's feed order becomes active.
- Given more pages remain, when the active video is within two slides of the last loaded video, then the next page is requested.

### Technical context
Built and tested with stub feed data: a stub `GET /api/feed` route returns fixture videos in the API contract's shape (REC-021, `docs/api/openapi.yaml`: `items`, `nextCursor`), and the feed client's `FeedSource` calls it (decided in the re-check, #42, 2026-11-19). The real feed data comes from REC-002, the real player from REC-003, and the < 2 s load target (PERF-2) is measured only in REC-015. The video's loop playback is owned and tested by REC-003. MVP supports Chrome on Android and desktop; iOS (WebKit, including Chrome on iPhone) is out of scope.
Feed built with CSS scroll-snap (`scroll-snap-type: y mandatory`, `scroll-snap-stop: always`) and native scroll/touch events; no carousel library (AGENTS.md: no new library without approval and an ADR). No overlay above the YouTube iframe (decided after the technical check): swipes over the player reach the feed natively, and taps on the video reach the YouTube player. Tap behavior on the video and the unmute control (an app button outside the iframe) are owned by REC-003. No app-owned "Watch on YouTube" button: the link back to the original (PRD §9) is covered by the YouTube player's own links and the recipe panel's source label (PRD 5.3, REC-006).
Technical check done 2026-11-16 (throwaway prototype, Chrome on Android and desktop): without an overlay, (1) swipes over the video move the feed, (2) the app's own unmute button gets taps and later videos keep sound, and the YouTube player's own links stay tappable, (3) a hard flick moves exactly one video. With a transparent overlay, hard flicks on Android sometimes skipped more than one video, so the overlay was dropped. The prototype had one player at a time; AC3 (one video per gesture) is re-checked with three live players in REC-004 and REC-015.
Swiping back on the first video does nothing (decided; no backward wrap). The end of the catalog is known when a page's `nextCursor` is `null` (API contract, REC-021, `docs/api/openapi.yaml`); items have no `id`, and `youtubeId` is the list key. With a single-video catalog, wrapping snaps to the same video again, with no special case (unit test). Components: "Feed", "Feed route" and "Player controller" (C4 level 3, web app). ADR 0002.
Stub route and contract (re-check #44, #46–#49, 2026-11-19): the stub route returns the contract's item shape: every fixture item has `youtubeId`, `title`, `channelName` and `recipe`. The production fixture uses real public videos with their real channel names and `recipe: null` on every item (a real title-only state), so no invented recipe ever reaches users; the `ready` shape with a recipe is covered by the unit tests' own data and by the E2E stubs. The route returns a page with items with `Cache-Control: public, s-maxage=3600`, and a cursor that cannot be decoded returns 400 with `{ "error": { "code": "invalid_cursor", "message" } }` and `no-store`. The route pages its fixture (#51): about 7 videos, 3 per page, with an opaque cursor that encodes the next offset, so the live site and the smoke test exercise real paging and the wrap; its unit test covers the first page, a valid cursor returning the next page, the last page returning `nextCursor: null`, and a cursor that cannot be decoded returning 400. Empty-feed and 5xx responses are not produced by the fixture route; REC-002 adds and tests them with the database (#48). This story adds `channelName` and `recipe` to `src/lib/feed/types.ts`. The route's unit test holds its expected values written by hand (fields, status codes, error code, `Cache-Control` values), checked against `docs/api/openapi.yaml` in review; there is no YAML parser or validator library (REC-021 Conformance). Its change also updates the C4 level 3 "Feed route" (fixture data until REC-002) and the implementers listed in `openapi.yaml` (REC-001 the client and the stub route, REC-002 the data, REC-014 the deep link).
Smoke test (#45): the `@smoke` test keeps loading `/` with no `/api/feed` stub, so it checks the deployed app's own route; with the fixture route it needs no database. Keeping it green in CI once the route reads the database is REC-002's (its #41).
Next page (AC6): the feed client owns when the next page is requested (from REC-002 validation, #31 and #32); REC-002 replaces the fixture inside the stub route with the database query and cache headers, leaving `FeedSource` and `PageRequests` unchanged; the shuffle is a client function REC-002 adds to `appendPage` (change `add-database-feed`, design D5, not a route step), which also makes the three wrap E2E tests independent of arrival order. Reaching the end of the loaded list while a page is still loading belongs to REC-018.
Players (re-check 2026-11-19, #32): the feed renders a YouTube iframe only for the active slide and its two neighbours, so the one-video-per-gesture checks run with three live players. REC-004 owns the PERF-5 limit (at most three players) and preloading.
Title-only videos (`needs_recipe`, `backlog/README.md` Decided 4) are slides like any other video; REC-006 (AC7) owns showing their title.
Tests (AGENTS.md E2E rules, ADR 0006): Playwright tests on the `phone-portrait`, `phone-landscape` and `desktop` projects, with stubbed YouTube embeds, cover AC1 (one full-screen video in portrait), AC3 (one video per gesture, with `e2e/support/gestures.ts`), AC4 (centered on desktop and in landscape), AC5 (wrap-around) and AC6 (next page requested). Each test stubs `/api/feed` with Playwright's `page.route` and chooses its own catalog (rule 5), so the tests stay valid when REC-002 replaces the route's data. Starting state is set directly (rule 3): AC5 uses a short one-page catalog and scrolls the feed container to the last slide by code before the one real gesture; AC6 checks that a request for `/api/feed?cursor=…` is made. The rule that decides when to request the next page is unit-tested in Vitest (rule 1). The stub route itself is checked with a unit test against the contract (shape, `nextCursor`, 400 for a cursor that cannot be decoded). Manual checks (rule 13): real finger flicks on Android, real mouse-wheel and trackpad scrolling on desktop, and AC2, which needs a playing video (the plain embed has no autoplay until REC-003; loop and the YouTube end screen belong to REC-003).
Recipe panel layout and gestures belong to E02 (REC-006, REC-007); on desktop the video is centered, and REC-006 owns the layout once the panel sits beside it (PRD 5.1). Deep-link start belongs to REC-014. Empty, error and unavailable states belong to REC-018. Keyboard navigation on desktop is not in scope: the browser's default scroll-snap behavior is accepted (`draft-backlog-list.md` D-1). Future gesture and browser ideas: `draft-backlog-list.md` (D-1 to D-4).

### Estimation notes
M: CSS scroll-snap feed with one video per gesture, wrap-around to the first video across API pages, centered layout on desktop and in landscape, and gesture checks on real devices.
Update after the technical check (2026-11-16): the overlay was dropped; plain scroll-snap passed all checks on Android and desktop Chrome, which removes the main risk.
AI estimate (2026-11-16): 3. Calibration: no stories have a team estimate yet (greenfield), so calibrated against a generic "single scrollable list view with layout rules and stub data" pattern. The technical check already proved the core mechanism (plain scroll-snap, one video per gesture, swipes over the iframe), and the player, real feed data, loop and taps are owned by REC-002/REC-003. Remaining work: the scroll-snap feed component, centered layout on desktop and in landscape, wrap-around from the last video to the first of this visit's order across API pages, and gesture checks on real devices. Risks that would move it to 5: wrap-around jumping from the last to the first video without a visible glitch or a double snap; and (assumed) the Next.js project scaffolding, CI and deploy are set up outside this story; if REC-001 must carry them as the first feature, it is a 5.
M (reasoning updated after the re-check, 2026-11-19): the scroll-snap feed with one video per gesture, wrap-around across API pages, the next-page request (AC6) and centered layout on desktop and in landscape; a client `FeedSource` and a stub `GET /api/feed` route that pages a title-only fixture in the contract's shape, with `channelName` and `recipe` added to the shared types; Vitest tests for the feed logic and the route; Playwright tests for AC1, AC3–AC6 on three screen projects with `/api/feed` stubbed; manual device checks; the C4 level 3 and `openapi.yaml` updates. The scaffolding risk above no longer applies: the app is scaffolded, CI runs and Vercel deploys (#37).
AI estimate (2026-11-19): 5. Calibration: REC-020 and REC-021 (team 2 each) are documentation only and clearly smaller; REC-002's 5 is set aside while it is reopened, so there is no code story with a team estimate in force; the closest pattern is "a scrollable list view with paging, a small read-only API route and browser tests". The core mechanism is already proven by the technical check, and the test setup (`e2e/support/` with the gestures helper and three projects) exists, which keeps it from an 8. The re-check added the stub route, contract types, AC6 and the E2E tests on top of the earlier 3. Risks that move it: wrap-around without a visible jump or a double snap; synthetic swipes in Chromium over scroll-snap being flaky (rule 10 treats a flaky test as a bug), which could take more time; and (assumed) the stub YouTube embeds behave like real iframes for scrolling.

## REC-002 · Feed shows ready and title-only videos, newest first with variety
- **Status:** done
- **Labels:** module:feed, type:feature, size:L, layer:fullstack
- **PRD:** 5.3, 6.4, 6.5, API-1, API-2, ING-2, ING-3, PERF-6
- **Flags:** —
- **AI estimate:** 8
- **Estimate:** 8

As a home cook, I want the feed to contain easy recipe videos, plus videos whose recipe could not be found shown by their title, in a fresh order, so that I always have something worth watching.
As a maintainer, I want a curated list of real Shorts loaded into production, so that the deployed feed shows real videos before daily discovery exists.

### Acceptance criteria
- Given videos with statuses ready, needs_recipe, not_easy, unavailable and rejected, when the feed is requested, then only `ready` and `needs_recipe` videos are returned
  And each `ready` video includes its recipe
  And each `needs_recipe` video has its title and no recipe (API-1).
- Given page 1 of the feed has been returned, when page 2 is requested, then every video on it entered the feed at the same time as or earlier than those on page 1, and none of them appears on page 1 (API-2).
- Given a page of the feed is loaded, when the client shows it, then its videos appear in the order produced by this visit's shuffle (API-2).
- Given a visit has loaded pages 1 and 2, when page 3 loads, then pages 1 and 2 keep their order.
- Given the last page of the feed is requested, when it is returned, then the response reports that there are no more pages.
- Given the last videos in the feed exactly fill a page, when that page is requested, then it already reports that there are no more pages.
- Given there are no `ready` or `needs_recipe` videos, when the first page is requested, then it returns an empty list that reports no more pages.
- Given a feed page with at least one video, when it is served, then it has a `Cache-Control` header with `s-maxage=3600` (PERF-6).
- Given a cursor page with at least one video, when it is served, then it has a `Cache-Control` header with `s-maxage=3600` (PERF-6).
- Given there are no `ready` or `needs_recipe` videos, when the first page is served, then it has a `Cache-Control: no-store` header.
- Given a feed request fails with any 4xx or 5xx status, when the response is served, then it has a `Cache-Control: no-store` header.
- Given a cursor that decodes but has no videos after it, when that page is requested, then it returns an empty list that reports no more pages
  And it has a `Cache-Control: no-store` header.
- Given the production build runs in CI against a migrated database with seed videos, when the `@smoke` test loads the app, then the feed shows a video.
- Given a curated list of Shorts that pass the ING-2 checks (Shorts length, embeddable, English), when the loader runs, then each is stored as `needs_recipe` with its title, channel and facts from the list.
- Given a list file that is missing or is not valid JSON, when the loader runs, then it fails before writing anything.
- Given a list entry without a title, a channel or one of the ING-2 facts, when the loader runs, then that entry is not written and is logged with its YouTube ID and the reason
  And the other entries are loaded.
- Given a listed Short that fails the ING-2 checks, when the loader runs, then it is stored as `rejected` and does not appear in the feed.
- Given videos from the list are already in the database, when the loader runs again, then none is changed or duplicated (ING-3).

### Technical context
"Light shuffling" (API-2), decided 2026-11-16 during validation: pages are returned in newest-first order, and the client shuffles the videos *within* each page once per visit. The server response is the same for everyone (no seed in the URL), so it stays fully cacheable at the CDN (PERF-6). The shuffle's random source is injectable, so tests can make the order deterministic. A returning user gets a different order by chance; the app does not remember the previous visit's order. That a shuffled page holds exactly the server page's videos is a unit test, not a scenario.
Pagination uses a cursor on (time the video entered the feed, id), not an offset. The database sets that time automatically when a video is inserted as, or changes to, `ready` or `needs_recipe` from a status outside the feed, and keeps it when the status moves between those two (REC-019, rule from REC-020); so it only grows for videos newly entering the feed. The database rejects a feed video without it (REC-019 check constraint, decided 2026-11-20 in REC-019 validation; this replaces "excluded and logged", REC-002 #45). So videos that enter or leave the feed mid-visit do not cause duplicates or skipped items. Reopened for validation 2026-11-17 (`backlog/README.md` Decided 4): `needs_recipe` videos are in the feed with their title only, and there are no manual edits to `ready` in the MVP. The client keeps the visit's shuffled list in memory and never reshuffles pages it has already loaded. When the last page reports no more pages, REC-001 wraps by replaying that in-memory list from the start.
Page size is 10 videos. The response has `items` (`ready` videos with their recipe, `needs_recipe` videos with their title only and `recipe: null`) and `nextCursor`, which is `null` when there are no more pages; the server reads one row beyond the page, so an exactly full last page already returns `null`. Newest-first order within a server page is covered by unit tests. A unit test also checks that walking all pages returns every `ready` and `needs_recipe` video exactly once, including ties on the feed-entry time at a page boundary (fixture data from this story's seed script). The full response contract is owned by the API specification (REC-021, `docs/api/openapi.yaml`; `backlog/README.md` Decided 5); this story implements it. When to request the next page is already owned by REC-001's feed client (within two slides of the last loaded video; `add-vertical-swipe-feed` design §4). REC-001 builds the client `FeedSource` that calls `GET /api/feed` and a stub route that returns fixture data in the contract's shape (REC-001 re-check #42, 2026-11-19); this story replaces the fixture inside that route with the database query, keeping at most one request per cursor in flight. REC-001's E2E tests stub `/api/feed` with `page.route` (see the shuffle paragraph below). REC-001's stub route already returns the contract's item shape (title-only fixture items), the 400 error body and the cache header for a page with items, and adds `channelName` and `recipe` to the shared types (REC-001 re-check #44, #49); this story adds and tests the empty-feed and 5xx responses (REC-001 #48). The `@smoke` test calls the real route with no stub (REC-001 #45). CI starts the web server with no `DATABASE_URL` today (`.github/workflows/ci.yml`; the service container gets only `TEST_DATABASE_URL`), so once the route reads the database `/api/feed` would return 5xx and every pull request would fail. Decided 2026-11-22 (#54 A): the CI E2E step migrates and seeds the service-container database with test seed videos, and starts the web server against it with the read-only role (`app_readonly`, REC-019; the CI migrate step also creates that role in the service container, as REC-019 does for `pnpm test:db`, and the smoke criterion depends on it), so no shared database is used (E2E rule 5) and the smoke test still exercises the real route. Reaching the end of the loaded list while the next page is still loading is owned by REC-018.
A cursor that cannot be decoded returns HTTP 400; the client treats it as a failed page (REC-018). Covered by unit tests, not a scenario. The 5xx case is tested by making the injected database query throw (re-check 11 N5 A). A cursor that decodes but has no videos after it (the next videos left the feed while a cached page was served, up to an hour) returns an empty last page with `no-store`, so the client wraps normally (decided 2026-11-22, #51 A; this reverses the 2026-11-20 note and `openapi.yaml`'s "points past the end of the feed returns 400" wording, written for REC-001's offset fixture; REC-021 owns the contract, so this story's change updates `openapi.yaml`).
Shuffle placement (decided 2026-11-22, #28/#50 A): the shuffle is a pure client function with an injectable random source, as in the first paragraph; REC-001's Technical context line that REC-002 "puts the shuffle in the route" is wrong and this story's change corrects it. `appendPage` in `src/lib/feed/feed-state.ts` keeps arrival order today, so this story's change adds the shuffle, makes REC-001's three wrap E2E tests (`e2e/feed/wrap-to-the-start-after-the-last-video.spec.ts`) independent of arrival order, and rewords the `feed` main spec scenario "Catalog spans several pages" ("the first video of the first page") in its delta spec.
What of REC-001's work this story replaces, keeps or deletes (decided 2026-11-22, #53 A): replaced or deleted are `src/lib/feed/fixture.ts`, `fixture-pages.ts` and its test, `src/app/api/feed/route.test.ts` (rewritten for the database route) and the offset cursor `{"o":n}` with page size 3, which becomes the keyset cursor with page size 10; kept is `PageRequests` (`src/lib/feed/page-requests.ts`), which already keeps at most one request per cursor in flight. At deploy, an open page holding an old-format cursor gets 400 and the client treats it as a failed page (accepted). Docs updated in this story's change: the implementers in `openapi.yaml` and the C4 level 3 lines "fixture data until REC-002" and "light shuffle with REC-002".
A `ready` video whose recipe row is missing, or a `needs_recipe` video that has one, is not checked by the route (decided 2026-11-22, #52 A): REC-019 leaves recipe presence to ingestion (REC-008), and the route returns the recipe that exists, or `recipe: null`. The loader inserts only `needs_recipe` and `rejected` videos, so it cannot create the mismatch.
Title-only videos may fill the first pages, since until REC-008 the Entrega 2 catalog is all `needs_recipe`; accepted as a known risk (#46 A). Title-only display is owned by REC-006 (AC7; PRD 5.3) (#44 A). Tuning the app's connection pool (ADR 0007) needs real traffic, so it is not part of this story and happens after launch (#56 A).
Built and tested on fixture data from a seed script in the repo, owned by this story; real `ready` videos come later from REC-005 and E02. For Entrega 2, this story also loads a curated list of real Shorts into the production database, so the deployed feed shows real videos before discovery (REC-005) exists (decided 2026-11-20 in REC-019 validation, #14 A); the estimates were reset to `—` on 2026-11-22 for this and the other added scope, and are made again after the criteria are approved. The loader's criteria are the five that start "Given a curated list" through "Given videos from the list are already in the database". Decided 2026-11-22 (re-check 12, M3 A): the list is a JSON file in the repo carrying each video's title, channel and the ING-2 facts (`channel_id`, `duration_seconds`, `embeddable`, `language`), because the schema requires them for non-`rejected` rows and a YouTube Data API call would add a key, a quota and a service that needs an ADR. Decided 2026-11-22 (re-check 11, N3/N4/N6 A): the loader's criteria promise what is stored, not that the video shows in the feed right after the run (the 1 h CDN cache, PERF-6, can delay it); an entry missing the title, channel or an ING-2 fact is skipped and logged, since `rejected` also needs the facts to be judged; if the run fails partway, the rows already written stay and a re-run skips them (ING-3), covered by unit tests; the same YouTube ID twice in the list loads the first entry and logs the later one as skipped (re-check 12, M2 A). Every loaded video is `needs_recipe` (or `rejected`), since Decided 4 allows no hand-added recipes and REC-008 is blocked by the LLM decision, so the Entrega 2 feed is title-only. The loader skips YouTube IDs already in the database (ING-3). The seed script and the loader write through REC-019's shared client, and the database sets every feed-entry time (REC-019 #42 A). The seed script and tests get ties by inserting the tied rows in one transaction, and an order by inserting in separate transactions. The loader writes like ingestion: each video gets the time of its load, and ties within one load are broken by `id`; it runs as a manual GitHub Actions workflow with `DATABASE_URL_DIRECT`, the only write credential (REC-019 #38 A). The database schema and migration are owned by REC-019.
The periodic availability check (PRD §9) is out of the MVP (decided 2026-11-16; `draft-backlog-list.md` D-5). This story filters by status only: a removed video that is still in the feed is skipped by the player error handling in REC-018, or a maintainer marks it `unavailable` (PRD §9); videos with status `unavailable`, `not_easy` or `rejected` are excluded by the status filter above.
CDN cache (PERF-6), decided 2026-11-16: feed pages with at least one video, cursor pages included, are cached for 1 hour (`s-maxage=3600`), with no other cache control; empty and error responses are `no-store`. New `ready` videos and status changes can take up to an hour to reach users. Refreshing the cache when ingestion finishes is a future improvement (`draft-backlog-list.md` D-6). The cache headers are checked on the route's response (Vitest) and in the local production build; after the first deploy, a one-time manual check confirms the Vercel CDN caches (a second request shows a cache `HIT`), since the CDN may remove `s-maxage` from what the browser receives. This story's change updates the C4 container diagram (`docs/architecture/c4/02-containers.md`, which says "`s-maxage` with revalidation") to match.
A next-page request that fails mid-visit is owned by REC-018 (decided 2026-11-16); its behavior is decided there. A visit opened from a deep link is owned by REC-014: the linked video plays first, then the feed starts at page 1, and the client skips that video if it comes up again.

### Estimation notes
L (re-sized from M on 2026-11-22, re-check 11 N1 B: one story kept, scope grown since 2026-11-16; the points are estimated after the criteria are approved, and the size table maps L to 8): a `GET /api/feed` route with status filtering, newest-first cursor pagination (one extra row read, 400 on an undecodable cursor, an empty last page for a stale one), and cache headers by response type; the route's database query replacing REC-001's fixture inside the existing route and client `FeedSource`; a client shuffle per page with an injectable random source, plus reworking three REC-001 E2E tests and one `feed` spec scenario; a fixture seed script; CI that migrates and seeds a database for the E2E step; and the curated-list loader (manual workflow, ING-2 checks, re-run skips). The schema and migration (REC-019), the next-page trigger (REC-001), and error and loading states (REC-018) are owned elsewhere.
Previous estimates (reset to `—` on 2026-11-22, #47 A, because the reopen and the added scope came after them): AI 5, team 5 (set before the 2026-11-17 reopen).
AI estimate (2026-11-16, superseded): 5. Calibration: REC-001 (team estimate 3) is the only estimated story; REC-002 is larger, since it adds a server side (route, Drizzle cursor query, cache headers by response type, 400 handling), a client shuffle, a `FeedSource` swap and a fixture seed script, each with unit tests, on top of a client of similar size. Risks that move it: the E2E data source and deterministic shuffle are still open (#28, waiting on the `add-e2e-testing` PR) and could add test setup; the recipe shape returned by the API depends on E02 (REC-006, REC-008) and may change the response (assumed: a placeholder recipe is enough here); and the Vercel CDN may handle `s-maxage` differently than the local build. It would drop to 3 if REC-019 lands first with the seed data path ready (assumed).
AI estimate (2026-11-22): 8. Calibration: REC-001 (team 5) is the nearest full slice (client, stub route, E2E tests) and REC-019 (team 8) is the nearest backend-heavy one. REC-002 has a server side like REC-019's (keyset cursor query, cache headers by response type, empty-page and 5xx handling), the client shuffle and the rework of three REC-001 E2E tests and one `feed` spec scenario like REC-001's, plus two pieces neither had: CI that migrates and seeds a database for the E2E step, and the curated-list loader as a manual workflow with its own criteria. Risks that move it: the CI seeding and `app_readonly` setup is new ground (it could add a day if the service container fights the production build) (assumed); the Vercel CDN may strip `s-maxage`, which only the post-deploy manual check shows; and the loader's list file has to be written and checked by the maintainer, which is human time not in the code estimate. It would drop to 5 if the loader were split out. Size check: 8 matches `size:L`, no warning. This is one voice; the team's estimate comes from your discussion, not from averaging.

## REC-003 · Autoplay muted, tap to unmute, loop
- **Status:** todo
- **Labels:** module:playback, type:feature, size:M, layer:frontend
- **PRD:** 5.2, 9 (YouTube ToS, autoplay rules)
- **Flags:** needs-human-validation; (assumed) "session" means the current browser tab/visit
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want videos to start playing on their own and keep looping, so that I can follow along without touching the screen.

### Acceptance criteria
- Given a video becomes the active one, when it is shown, then it starts playing automatically and muted.
- Given a video is playing muted, when I tap unmute once, then it plays with sound and every later video in the session also plays with sound.
- Given a video is playing, when it reaches the end, then it restarts automatically.
- Given a video is playing, when I swipe it out of view, then it is paused.
- Given any video in the feed, when it plays, then it plays inside the official YouTube embedded player and is never downloaded or re-hosted.

### Technical context
—

### Estimation notes
M: behavior is clear, but the official embedded player limits customization (§9).
Browser autoplay rules need testing across mobile browsers.

## REC-004 · Instant transition to the next video
- **Status:** todo
- **Labels:** module:playback, type:feature, size:L, layer:frontend
- **PRD:** PERF-3, PERF-5
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the next video to start almost instantly when I swipe, so that browsing never feels slow.

### Acceptance criteria
- Given a video is active, when I swipe to the next one, then it starts playing in < 500 ms (PERF-3).
- Given a video is active, when the feed is idle, then the next 1–2 videos and their recipes are already preloaded.
- Given I keep swiping through many videos, when I check the page, then at most three video players (previous, current, next) are alive at once (PERF-5).

### Technical context
From REC-001 validation (#29, recorded 2026-11-19 after its re-check #32): REC-001's feed already renders an iframe only for the active slide and its two neighbours. This story owns the PERF-5 limit and preloading, and re-checks on a real Android phone that a hard flick still moves exactly one video with three live players (also in REC-015).

### Estimation notes
L: tight latency target combined with a hard cap on live players.
Highest technical risk in E01; validated on device by REC-015.

## REC-005 · Daily discovery of new candidate videos
- **Status:** todo
- **Labels:** module:ingestion, type:feature, size:L, layer:backend
- **PRD:** 6.1, ING-1, ING-2, ING-3, ING-4, 6.4, 9 (API quota), 12 (seed channels)
- **Flags:** needs-human-validation; blocked-by:REC-019; (assumed) seed channels and search queries will be provided before build (open decision)
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want new easy recipes to show up in the feed regularly, so that there is always something new to cook.

### Acceptance criteria
- Given the daily schedule, when the discovery job runs, then it finds new candidate videos from the configured search queries and/or seed channels (ING-1).
- Given a discovered video longer than 3 minutes, not embeddable, or not in English, when it is evaluated, then it is stored as `rejected` instead of kept as a candidate (ING-2).
- Given a video ID that is already in the database, when it is discovered again, then it is skipped (ING-3).
- Given launch day, when the catalog is checked, then about 50 videos are in `ready` status (ING-4).

### Technical context
Rejected candidates are stored with status `rejected` (decided 2026-11-17, `backlog/README.md` Decided 4) so ING-3's "skip known IDs" also skips them and saves API quota. Fields and statuses follow the data model document (REC-020). Candidates are not stored before they are processed: a video is written only with its final status (from REC-020 exploration, 2026-11-17); one that fails before then is found again the next day.

### Estimation notes
L: YouTube API quota (search calls are expensive) shapes the whole job.
Depends on the open decision about seed channels and queries.

## REC-018 · Feed handles empty, error and unavailable states
- **Status:** todo
- **Labels:** module:feed, type:feature, size:M, layer:frontend
- **PRD:** 5.1, 6.4, 9 (videos removed after ingestion)
- **Flags:** needs-human-validation; split-from:REC-001
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the feed to tell me when there is nothing to show or something failed, and to skip broken videos, so that I am never stuck on a blank or broken screen.

### Acceptance criteria
- Given there are no videos in the feed (`ready` or `needs_recipe`), when the feed loads, then an empty-feed message is shown.
- Given the feed request fails, when the feed loads, then an "Oops, something went wrong" message is shown.
- Given I am offline, when the feed loads, then an "Oops, something went wrong" message is shown.
- Given the active video was removed or is no longer embeddable, when it fails to load in the player, then the next video loads automatically.

### Technical context
Split from REC-001 during its validation (findings #4 and #6). Also owns a next-page request that fails mid-visit (from REC-002 validation, #18, 2026-11-16); the user-facing behavior is still to be decided when this story is validated. Also owns reaching the end of the loaded list while the next page is still loading (from REC-002 validation, #31). Relies on the YouTube IFrame Player error event to detect removed videos; a periodic availability check that removes them from the catalog is out of the MVP (`draft-backlog-list.md` D-5).

### Estimation notes
M: three simple messages, plus skipping a video on a player error.
The player error event's timing and reliability is the main unknown.

## REC-019 · Database schema and migration for the video catalog
- **Status:** done
- **Labels:** module:ingestion, type:feature, size:L, layer:db
- **PRD:** 6.4, 6.5, ING-2, ING-3, EXT-4, EXT-6, API-2, API-3
- **Flags:** split-from:REC-002
- **AI estimate:** 8
- **Estimate:** 8

As a maintainer, I want one versioned database schema for videos, their status and their recipe, so that the feed and the ingestion job read and write the same data.

### Acceptance criteria
- Given an empty database, when the migrations run, then the video and recipe tables exist with the fields, types and keys of the data model document (REC-020)
  And the video status is limited to ready, needs_recipe, not_easy, unavailable and rejected.
- Given a video is not in the database, when it is inserted as `ready` or `needs_recipe`, then the time it entered the feed is set to the current time.
- Given a video is not in the database, when it is inserted as `not_easy`, `unavailable` or `rejected`, then it has no time it entered the feed.
- Given a video with a status outside the feed, when its status changes to `ready` or `needs_recipe`, then the time it entered the feed is set to the current time.
- Given a writer sends a time it entered the feed, when the video is inserted, then the database sets the time by its own rule.
- Given a video in the database, when the time it entered the feed is changed without its status moving into the feed, then the database rejects the change.
- Given a video in the feed, when the time it entered the feed is cleared, then the database rejects the change.
- Given a video in the feed, when its status changes between `ready` and `needs_recipe`, then the time it entered the feed is kept.
- Given a video in the feed, when its status changes to `not_easy` or `unavailable`, then the time it entered the feed is kept.
- Given a video in the database, when its status changes to or from `rejected`, then the database rejects the change.
- Given a video in the feed, when another of its fields is updated, then the time it entered the feed is unchanged.
- Given a video with a YouTube ID already in the database, when another video with that YouTube ID is inserted, then the database rejects it.
- Given a video is missing a field the data model requires (duration, embeddable flag and language are required unless it is `rejected`), when it is saved, then the database rejects it.
- Given a recipe is missing a required column, when it is saved, then the database rejects it.
- Given a recipe with a source other than `description`, `comment` or `captions`, when it is saved, then the database rejects it.
- Given a video with a recipe, when the video is deleted, then its recipe is deleted.
- Given a video or a recipe, when it is updated, then its `updated_at` is set to the current time.
- Given the migrations have run, when the app's read-only user reads any of the app's tables, then the read succeeds.
- Given the app's read-only user, when it writes to any of the app's tables, then the database rejects it.
- Given the migrations have already run, when they run again, then the schema is unchanged.
- Given a new migration is merged to `main`, when the migrate workflow runs, then the migration is applied to the production database.

### Technical context
Split from REC-002 during its validation (#27, 2026-11-16); REC-002 is blocked by this story. Drizzle ORM schema and migrations (ADR 0003), shared by the web app and the ingestion job (C4 container diagram). Adding recipes by hand is out of the MVP (`backlog/README.md` Decided 4). REC-002 owns the fixture seed script and loading the curated list of real Shorts into Neon for Entrega 2 (#14 A); REC-005, REC-008 and REC-010 write to this schema and REC-014 reads it, so each is `blocked-by:REC-019`.
Stack and tests (decided 2026-11-20, #1, #3, #12 A): `drizzle-orm`, `drizzle-kit` and the `pg` driver (it works with Neon, a local Postgres and CI). The schema rules are tested with Vitest against a real Postgres: a Postgres service container in CI and a local Postgres (Docker or Homebrew) for development, never the production database. This story owns that test database (this answers REC-002 #41). The driver, the CI Postgres service, the triggers, the connection pooling (#29 A: the app uses Neon's pooled connection string, migrations the direct one) and the two database users (#35 A) are recorded in a new ADR (`write-adr`) in this story's change.
Connections (#34, #35, #37 A, #44 A): two database users. The app, and so every Vercel preview, connects with a read-only user through `DATABASE_URL` (pooled), set in Vercel. The write user is Neon's owner role: it runs the migrations and owns the tables (so the default privileges cover tables from later migrations), and is used later by the ingestion job and REC-002's loader through `DATABASE_URL_DIRECT` (direct), set in GitHub Actions, and by the maintainer in the Neon console. Ingestion keeping schema rights is accepted for the MVP. "The app's tables" means the tables in `public`, not Drizzle's migration journal. This story builds the shared database client module in `src/lib/db/` (pooled for the app, direct for migrations and the job), used by its own tests, REC-002 and REC-005. The read-only user is named `app_readonly` (#49 A). It is created with no other rights: on Neon with SQL (`CREATE ROLE app_readonly LOGIN …`) in Neon's SQL editor as the owner, not from the Console's roles page, which would make it a member of `neon_superuser` (#50 A, inferred from Neon's role model; checked against Neon's docs when built); locally and in CI by a setup script run as the owner role, before the migrations. `docs/development.md` names it and gives the exact steps. A manual check in the change's tasks: after setup, a write as `app_readonly` on production is rejected. A migration grants it `SELECT` on all tables and sets default privileges so tables created by later migrations are readable too (#39 A). So the tests match production.
Running the tests (#27 A, #36 A): DB tests live in their own files (e.g. `*.db.test.ts`) and run with `pnpm test:db`; `pnpm test` stays database-free. CI's `check` job runs both, with the Postgres service. Each test file uses its own fresh database, so files run in parallel. Postgres 17 everywhere: chosen when the Neon project is created, and `postgres:17` in CI and locally.
Time the video entered the feed (#6 A, #30 A, #42 A, rule from REC-020): the database always decides it. A Postgres trigger in a hand-written SQL migration ignores any time the writer sends on insert: it sets the transaction time (`now()`) for a video inserted as `ready` or `needs_recipe` and leaves it empty otherwise. It sets the current time when a video's status changes into the feed from outside it, ignoring any time sent with that update (#47 A), and rejects any other change to the time, for every video and every writer (no seed mode). The time is stored to the millisecond (`timestamptz(3)`), so it survives the round trip through a JS `Date` in REC-002's cursor unchanged; videos in the same millisecond are ties, broken by `id` (#46 A). So the time only grows for videos entering the feed, and REC-002's cursor stays stable (#31 A). REC-002's seed script and the tests get ties by inserting the tied rows in one transaction, and an order by inserting in separate transactions. Updates that don't move a video into the feed keep the time, including a maintainer's edits in the Neon console. Rows written in one transaction share one time; REC-002 breaks ties by `id`. The time is kept when a video leaves the feed, and a video that comes back gets a new time (intended: it re-enters as new). A check constraint requires the time for `ready` and `needs_recipe` videos (this answers REC-002 #45). `rejected` is set only on insert (#33 A): it is only for first-time candidates (ING-2), and the trigger rejects any change into or out of it.
Recipe (#4 A, #24 A): the separate recipe table of the data model, keyed by the video. `ingredients`, `steps`, `source` and the raw easy facts (EXT-4) are required; `servings` is optional. The `source` enum includes `captions`, unused until the REC-009 spike decides. A recipe is deleted with its video. The database checks that the required columns are present and that `ingredients` and `steps` are JSON lists; the shape of each item (an ingredient's `name`, EXT-3) and completeness (EXT-5) stay with extraction (REC-008) (#45 A).
Integrity (#8 A): the database enforces the unique `youtube_id`, the required fields, the status enum, and the duration, embeddable flag and language being empty only for `rejected`. Recipe presence by status (data model Rule 3) stays with ingestion (REC-008), because it spans two tables. A trigger keeps `updated_at` on every update, console edits included, and `created_at` defaults to the current time (#23 A).
Indexes (#13 A): a feed index on (status, time the video entered the feed, `id`) for REC-002's cursor query; the unique `youtube_id` also serves the single-video lookup (API-3). The feed index, the `created_at` default, the millisecond precision of the feed-entry time, the check that `ingredients` and `steps` are JSON lists, and a time sent with a status change into the feed being ignored are checked by the change's unit tests, not by criteria (#32 A, #46 A, #48 A, #51 A).
Environments (#2 A, #19 A): one Neon database for production. A GitHub Actions workflow runs the migrations on push to `main` with the `DATABASE_URL_DIRECT` secret, one run at a time (a later run waits). Migrations are additive only (removing or renaming is done in two steps across two PRs), so the app works whether the deploy or the migration finishes first. A failed run shows as a red run with GitHub's notice; there is no automatic rollback, and the fix is a new migration in a new PR. The last criterion (the migrate workflow applies a merged migration to production) is a manual check after the first merge, listed in the change's tasks. Creating the Neon project (Postgres 17), the `app_readonly` user, and the `DATABASE_URL` (Vercel) and `DATABASE_URL_DIRECT` (GitHub) secrets is a precondition the human completes before build; this story writes the database setup in `docs/development.md` and README §1.4.
Previews (#28 A, #35 A): Vercel previews read the production database through the read-only user, so they cannot write to it; a preview whose code needs an unmerged migration may fail, so schema PRs are tested locally.
Docs and diagrams in this change (#20 A, #21 A): C4 level 2 gains the migrate workflow in the GitHub Actions job and notes the CI test database as tooling. `docs/architecture/data-model.md` drops its "Built now" note, gives `entered_feed_at` as `timestamptz(3)` and keeps `jsonb` for `ingredients` and `steps` (#52 A), Rule 2 gains "the database ignores a sent time and rejects changes to it", the time kept on leaving and the check constraint, and the document is set to `Status: Current` once the schema matches it. The two lines in `docs/api/openapi.yaml` that describe the recipe as one JSON value on the videos table are corrected.

### Estimation notes
L (reasoning updated after validation, 2026-11-20, #15 B: kept as one story): two tables with constraints and indexes, two triggers (feed-entry time and `updated_at`), the Drizzle and `pg` setup from scratch, the shared client module with two database users and their grants, a Postgres test database in CI and locally with `pnpm test:db`, a migrate workflow for production, a new ADR, a C4 level 2 update, and the data model, OpenAPI and setup docs. 21 acceptance criteria.
AI estimate (2026-11-21): 8. Calibration: REC-001 and REC-002 (team estimate 5 each) are the nearest full slices, and REC-020/REC-021 (2 each) are docs only. REC-019 carries more than either 5: the whole database stack from nothing (Drizzle, `pg`, the shared client, two roles and their grants), two triggers in hand-written SQL, a Postgres test harness with a fresh database per test file in CI and locally, a production migrate workflow, an ADR, C4 and three docs, and 21 criteria each needing a DB test. Most of it is well-known work, so 8, not 13. Risks that would move it to 13: the fresh-database-per-file harness and the trigger tests taking longer to make reliable in CI than expected (assumed: the GitHub Postgres service container works with no special setup); Drizzle's handling of hand-written SQL migrations and its journal alongside generated ones; and Neon's role model (#50) needing a different setup than assumed. Size check: 8 matches `size:L`.

## REC-020 · Data model document (no implementation)
- **Status:** done
- **Labels:** module:ingestion, type:docs, size:S, layer:db
- **PRD:** 5.3, 6.1, ING-2, ING-3, 6.2, EXT-2, EXT-3, EXT-4, EXT-5, EXT-6, 6.3, 6.4, 6.5, PERF-4
- **Flags:** —
- **AI estimate:** 2
- **Estimate:** 2

As a maintainer, I want the data model written down before the schema is built, so that the feed, the recipe panel and the ingestion job agree on the same entities and fields.

### Acceptance criteria
- Given the data model document in `docs/architecture/data-model.md`, when I read its Mermaid entity-relationship diagram, then every entity (at least video and recipe) and every relationship between them is shown.
- Given the data model document, when I read any entity, then each field has a type
  And the primary and unique keys are marked.
- Given the data model document, when I read the video entity, then it has the YouTube video ID as a unique key, the title, and the channel ID and name
  And it has the candidate facts used to select videos: duration, embeddable and language
  And it has a status limited to ready, needs_recipe, not_easy, unavailable and rejected, and the time the video entered the feed.
- Given the data model document, when I read the video statuses, then `ready` and `needs_recipe` videos are in the feed, and `not_easy`, `unavailable` and `rejected` videos are not
  And a `needs_recipe` video is shown with its title only, with no recipe
  And a `rejected` video is a candidate that failed the selection checks (ING-2), kept so ingestion skips it (ING-3).
- Given the data model document, when I read how the time a video entered the feed is set, then the database sets it when a video is inserted with, or changed to, `ready` or `needs_recipe` from a status outside the feed
  But a change between `ready` and `needs_recipe` keeps the time.
- Given the data model document, when I read the recipe entity, then it has servings, and the ingredients and numbered steps as typed lists inside the recipe
  And its source is one of `description`, `comment` or `captions` (open until the REC-009 spike)
  And it keeps the raw "easy" facts: ingredient count, estimated active minutes and special equipment (EXT-4).
- Given the data model document, when I read which videos have a recipe, then `ready` and `not_easy` videos always have one, while `needs_recipe` and `rejected` videos have none
  But an `unavailable` video keeps whatever it had before.
- Given the data model document, when I read the recipe's required fields, then each ingredient is `{name, quantity, unit}` with only the name required (EXT-3)
  And quantity and unit are text, so "1/2", "a pinch" and "to taste" are stored as written
  And servings are optional.
- Given the data model document, when I read the video's required fields, then the YouTube ID, title, channel ID and status are always required
  But duration, embeddable and language may be empty only for a `rejected` video.
- Given the data model document is written, when I check where it is linked, then the README "Data model" section and `docs/architecture/README.md` link to it.
- Given the data model document is written, when I check the pending decisions, then "is an ingestion run stored?" is listed under "Pending decisions" in `docs/adr/README.md`.

### Technical context
Documentation only: no migration, no code. The document is the logical model (the target design), drawn from the PRD and the stories as they are now; it is updated when a later validation changes the model. It owns the recipe's logical structure: E02 (REC-006, REC-008) may refine it, and a refinement updates this document in the same change. It has a short "Built now" note: REC-019 stores the recipe as one JSON value until E02 is built. The document carries `Status: Proposed` (the convention in `docs/architecture/README.md`); REC-019 sets it to `Current` once the schema matches. REC-019 is blocked by this story and implements the schema from it; when they differ, the document is updated in the same change. Decided while validating this story (2026-11-17, `backlog/README.md` Decided 4): `needs_recipe` videos enter the feed showing their title only, and adding a recipe by hand is out of the MVP (`draft-backlog-list.md` D-7), so there is no `manual` source. Extra validation to recover a recipe for a `needs_recipe` video later is also out of the MVP (D-8). Candidates that fail ING-2 are stored as `rejected` (no recipe, not in the feed), so the daily search does not check them again. The feed-entry time only grows for videos newly entering the feed, so REC-002's cursor stays stable. Seed channels and search queries are ingestion configuration (REC-005, open decision 1), not part of the data model. The completeness rule (EXT-5) is an extraction rule owned by REC-008; the document mentions it in a note, not as a database constraint (applying it to hand-added recipes is part of D-7). Quantity and unit are text because amounts are not scaled in the MVP. Title and channel come from the YouTube API at ingestion: the title is shown for `needs_recipe` videos and in the Favorites list (REC-012), and the channel ID lets extraction prefer the creator's comment (EXT-2). The link to the original video is built from the YouTube ID, not stored. Favorites are out of scope: they live in the browser (REC-011, REC-012) and the server never sees them. `docs/architecture/README.md` lists the document as a non-C4 diagram. Whether an ingestion run is stored is an open decision to record, not to invent. Also linked from the Entrega 1 checklist (item 7). An architecture decision found while writing it goes through `write-adr`.
Decided while exploring the document (2026-11-17): the ingestion job writes a video only after it is fully processed, so every stored video has a final status and there is no "pending" status; a failure before the write stores nothing, and the video is found and retried the next day (ING-3 does not skip it). The video's primary key is an internal integer `id`, with `youtube_id` as a unique key; the recipe's key is `video_id`. Ingredients and steps are drawn as `json` fields with their shape in a comment and a table, since GitHub's Mermaid may not accept list types; both entities may carry `created_at` and `updated_at`.

### Estimation notes
S: one document with a diagram, drawn from the PRD and the current stories; no code.
AI estimate (2026-11-17): 2. Calibration: REC-001 (team 3) is the only comparable estimate still in force (REC-002, team 5, is reopened); REC-020 is smaller than both, since it is documentation only with no code or tests, and every decision it records was already made during validation. Work: a Mermaid `erDiagram` for video and recipe with typed fields and keys, the status and feed-entry-time rules, required fields, the "Built now" and EXT-5 notes, two link updates and one pending-decision line. Risks that move it: a new architecture decision found while writing (for example how the database sets the feed-entry time) would need an ADR through `write-adr` and could make it a 3; GitHub's Mermaid rendering of `erDiagram` with typed lists inside the recipe may need a workaround (assumed: it renders).

## REC-021 · API specification document (no implementation)
- **Status:** done
- **Labels:** module:feed, type:docs, size:S, layer:backend
- **PRD:** 5.5, 6.4, 6.5, API-1, API-2, API-3, PERF-4, PERF-6
- **Flags:** blocked-by:REC-020
- **AI estimate:** 2
- **Estimate:** 2

As a maintainer, I want the feed API specified before it is built, so that the web app and its tests rely on one agreed request and response shape.

### Acceptance criteria
- Given the API specification in `docs/api/openapi.yaml`, when I read the feed endpoint's response, then it has `items` and `nextCursor`
  And each item has `youtubeId`, `title`, `channelName` (may be `null`) and `recipe`, where `recipe` is `null` for a `needs_recipe` video
  And no internal field is listed (internal id, status, feed-entry time, timestamps, raw easy facts, channel ID).
- Given the API specification, when I read the feed endpoint's paging, then the cursor is an opaque string the client passes back unchanged
  And a page holds up to 10 items, newest first by feed-entry time, with the shuffle left to the client (API-2)
  And `nextCursor` is `null` on the last page, and an empty feed is `{ "items": [], "nextCursor": null }`.
- Given the API specification, when I read the feed endpoint's errors, then a cursor that cannot be decoded returns 400 with the body `{ "error": { "code", "message" } }`.
- Given the API specification, when I read the server error response, then any 5xx response the app produces, from either endpoint, has the same error body.
- Given the API specification, when I read its caching rules, then responses with at least one video have `Cache-Control` with `s-maxage=3600` (PERF-6)
  And empty, 404 and error responses have `Cache-Control: no-store`.
- Given the API specification, when I read `GET /api/videos/{youtubeId}` for a `ready` or `needs_recipe` video, then it returns 200 with the same item shape as the feed.
- Given the API specification, when I read `GET /api/videos/{youtubeId}` for any other ID, then an unknown, malformed or out-of-feed (`not_easy`, `unavailable`, `rejected`) ID returns 404 with the error body.
- Given the API specification, when I read its field names, then the JSON names are camelCase
  And a table maps each public field to its column in the data model document.
- Given the API specification is written, when I read the README "API specification" section, then it has a table of the two endpoints and links to `docs/api/openapi.yaml`
  And its API-1 row says the feed returns `ready` videos with their recipe and `needs_recipe` videos with their title only.
- Given the API specification is written, when I check the Entrega 1 checklist, then row 8 links to the README "API specification" section.

### Technical context
Documentation only: no route, no code. Decided while validating this story (2026-11-18):
- **Owner:** this document owns the API contract. REC-002 (feed) and REC-014 (deep link) implement it and are blocked by this story (note 2026-11-19: REC-001 also builds the feed client and a stub feed route with fixture data, decided in REC-001 re-check #44; REC-002 replaces the route's data); when code and document differ, the document is updated in the same change. Names follow REC-001's feed client design (`items`, `youtubeId`, `title`); REC-002 uses `items` (aligned 2026-11-18).
- **Format:** an OpenAPI 3.1 file at `docs/api/openapi.yaml` (no new library). GitHub does not render OpenAPI files, so README §4 has a table of the endpoints and links to the file. Two endpoints: `GET /api/feed?cursor=` and `GET /api/videos/{youtubeId}`.
- **Public fields:** each item has `youtubeId`, `title`, `channelName` (`string | null`, optional in the data model; credits the creator of a third-party video) and `recipe`. There is no `id`: `youtubeId` is unique within a visit (REC-014 skips repeats) and serves as the client's list key; the recipe has `servings`, `ingredients[{name, quantity, unit}]`, `steps[]` and `source`. The internal id, `status`, feed-entry time, timestamps, raw easy facts (EXT-4) and channel ID stay internal. `recipe: null` marks a title-only (`needs_recipe`) item; the recipe panel uses it (REC-006). Schemas come from the data model document (REC-020) through this public list; JSON names are camelCase, mapped from its snake_case columns.
- **Order and paging:** server pages are newest first by feed-entry time and the client shuffles each page (API-2, `backlog/README.md` Decided 2). The cursor is opaque; "invalid" means it cannot be decoded. Page size is "up to 10" and clients rely only on `nextCursor`, so REC-001's stub may use another size.
- **Single video:** `{youtubeId}` is the YouTube ID (stable, used in deep links `/r/{videoId}`), not the internal id. ADR 0002's `GET /api/videos/{id}` names the same route; `{id}` there was a placeholder for this YouTube ID, so its decision is unchanged and no new ADR is needed. It returns 200 for `ready` and `needs_recipe`, and 404 for unknown, malformed or out-of-feed IDs; this settles open decision 5 on the API side (`backlog/README.md` Decided 5), and REC-014 lands on the regular feed on a 404.
- **Caching:** responses with content `s-maxage=3600` (PERF-6, ADR 0002); empty, 404 and error responses `no-store`, so a video that enters the feed later is not hidden by a cached 404.
- **Errors:** one body for 400, 404 and 5xx, `{ "error": { "code", "message" } }`. Platform errors the app does not produce (for example a Vercel function timeout, 504) may have another body and headers, so clients rely only on the status code and treat any non-2xx response as a failed request (REC-018).
- **Consumers:** the feed client (REC-001, REC-002), the deep link (REC-014), and possibly the Favorites view (REC-012): if open decision 2 keeps favorites as references only, it calls the single-video endpoint once per saved video, and a 404 means the video is gone. No batch endpoint for now. Favorites themselves live in the browser (PRD 5.4); the server never stores them.
- **Keeping it current:** a change to the recipe structure (E02: REC-006, REC-008) updates `docs/architecture/data-model.md` and this specification in the same change.
- **Conformance:** the response types live in one TypeScript module, `src/lib/feed/types.ts` (built by REC-001's `add-vertical-swipe-feed` change, archived 2026-11-21, whose feed item has no `id`; REC-001 also adds `channelName` and `recipe`, decided in its re-check #44 on 2026-11-19), used by REC-001's stub feed route, the REC-002 and REC-014 routes and the E2E stub data; the specification and those types are kept in sync in review. No validator library.
Also linked from the Entrega 1 checklist (item 8). The C4 level 3 Feed route description was aligned with Decided 4 outside this story (2026-11-18).

### Estimation notes
S (reasoning updated 2026-11-18 after validation): one OpenAPI file for two endpoints, a README table and two link updates; no code. Every decision the specification records (owner, item shape, public fields, statuses, paging, caching, errors) was settled while validating this story, so writing it is mostly transcription. AI estimate after the criteria are approved.
AI estimate (2026-11-18): 2. Calibration: REC-020 (team estimate 2) is the closest match, a documentation-only story that turned decisions already made during validation into one document plus link updates; REC-021 has the same shape (one OpenAPI file for two endpoints, an error schema, cache headers, a field-to-column table, a README table and one checklist link) and is clearly smaller than REC-001 (team 3), which has code and E2E tests. Risks that move it: the OpenAPI 3.1 file is written by hand with no validator (no new library), so mistakes such as nullable fields (`type: [string, "null"]` in 3.1) or broken `$ref`s are only caught in review (assumed: careful review is enough); and REC-002 is still in review, so if its remaining findings change the response, this document changes with it. It would be a 3 if the team wants request and response examples for every case.
