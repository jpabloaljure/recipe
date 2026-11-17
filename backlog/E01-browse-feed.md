---
id: E01
title: Browse a curated feed with no waiting
prd-goal: G1
---

## REC-001 · Vertical full-screen feed with manual swipe
- **Status:** todo
- **Labels:** module:feed, type:feature, size:M
- **PRD:** 5.1, 5.2
- **Flags:** —
- **AI estimate:** 3
- **Estimate:** 3

As a home cook, I want to swipe through short recipe videos one at a time, so that I can quickly find something to cook today.

### Acceptance criteria
- Given I open the app on a phone in portrait, when the feed loads, then one full-screen vertical video is shown at a time.
- Given a video is active and I do not interact, when it reaches the end, then the feed stays on that video.
- Given a video is active, when I swipe or scroll to another video, then the next or previous video becomes active, exactly one video per gesture.
- Given I am on desktop or on a phone in landscape, when the feed is shown, then the vertical video is centered on the screen.
- Given the last video in the catalog is active, when I swipe to the next video, then the first video of this visit's feed order becomes active.

### Technical context
Built and tested with stub feed data: the real feed comes from REC-002, the real player from REC-003, and the < 2 s load target (PERF-2) is measured only in REC-015. The video's loop playback is owned and tested by REC-003. MVP supports Chrome on Android and desktop; iOS (WebKit, including Chrome on iPhone) is out of scope.
Feed built with CSS scroll-snap (`scroll-snap-type: y mandatory`, `scroll-snap-stop: always`) and native scroll/touch events; no carousel library (AGENTS.md: no new library without approval and an ADR). No overlay above the YouTube iframe (decided after the technical check): swipes over the player reach the feed natively, and taps on the video reach the YouTube player. Tap behavior on the video and the unmute control (an app button outside the iframe) are owned by REC-003. No app-owned "Watch on YouTube" button: the link back to the original (PRD §9) is covered by the YouTube player's own links and the recipe panel's source label (PRD 5.3, REC-006).
Technical check done 2026-11-16 (throwaway prototype, Chrome on Android and desktop): without an overlay, (1) swipes over the video move the feed, (2) the app's own unmute button gets taps and later videos keep sound, and the YouTube player's own links stay tappable, (3) a hard flick moves exactly one video. With a transparent overlay, hard flicks on Android sometimes skipped more than one video, so the overlay was dropped. The prototype had one player at a time; AC3 (one video per gesture) is re-checked with three live players in REC-004 and REC-015.
Swiping back on the first video does nothing (decided; no backward wrap). The end of the catalog is known when the feed API reports no more pages (REC-002). Components: "Feed" and "Player controller" (C4 level 3, web app). ADR 0002.
Recipe panel layout and gestures belong to E02 (REC-006, REC-007). Deep-link start belongs to REC-014. Empty, error and unavailable states belong to REC-018. Future gesture and browser ideas: `draft-backlog-list.md` (D-1 to D-4).

### Estimation notes
M: CSS scroll-snap feed with one video per gesture, wrap-around to the first video across API pages, centered layout on desktop and in landscape, and gesture checks on real devices.
Update after the technical check (2026-11-16): the overlay was dropped; plain scroll-snap passed all checks on Android and desktop Chrome, which removes the main risk.
AI estimate (2026-11-16): 3. Calibration: no stories have a team estimate yet (greenfield), so calibrated against a generic "single scrollable list view with layout rules and stub data" pattern. The technical check already proved the core mechanism (plain scroll-snap, one video per gesture, swipes over the iframe), and the player, real feed data, loop and taps are owned by REC-002/REC-003. Remaining work: the scroll-snap feed component, centered layout on desktop and in landscape, wrap-around from the last video to the first of this visit's order across API pages, and gesture checks on real devices. Risks that would move it to 5: wrap-around jumping from the last to the first video without a visible glitch or a double snap; and (assumed) the Next.js project scaffolding, CI and deploy are set up outside this story; if REC-001 must carry them as the first feature, it is a 5.

## REC-002 · Feed shows only ready videos, newest first with variety
- **Status:** todo
- **Labels:** module:feed, type:feature, size:M
- **PRD:** 6.4, 6.5, API-1, API-2, PERF-6
- **Flags:** blocked-by:REC-019
- **AI estimate:** 5
- **Estimate:** 5

As a home cook, I want the feed to contain only ready, easy recipe videos in a fresh order, so that every video I land on is worth watching.

### Acceptance criteria
- Given videos with statuses ready, needs_recipe, not_easy and unavailable, when the feed is requested, then only `ready` videos are returned, each with its recipe included (API-1).
- Given page 1 of the feed has been returned, when page 2 is requested, then every video on it became ready at the same time as or earlier than those on page 1, and none of them appears on page 1 (API-2).
- Given a page of the feed is loaded, when the client shows it, then its videos appear in the order produced by this visit's shuffle (API-2).
- Given a visit has loaded pages 1 and 2, when page 3 loads, then pages 1 and 2 keep their order.
- Given the last page of ready videos is requested, when it is returned, then the response reports that there are no more pages.
- Given the last ready videos exactly fill a page, when that page is requested, then it already reports that there are no more pages.
- Given there are no ready videos, when the first page is requested, then it returns an empty list that reports no more pages.
- Given a feed page with at least one video, when it is served, then it has a `Cache-Control` header with `s-maxage=3600` (PERF-6).
- Given there are no ready videos, when the first page is served, then it has a `Cache-Control: no-store` header.
- Given a feed request fails with any 4xx or 5xx status, when the response is served, then it has a `Cache-Control: no-store` header.

### Technical context
"Light shuffling" (API-2), decided 2026-11-16 during validation: pages are returned in newest-first order, and the client shuffles the videos *within* each page once per visit. The server response is the same for everyone (no seed in the URL), so it stays fully cacheable at the CDN (PERF-6). The shuffle's random source is injectable, so tests can make the order deterministic. A returning user gets a different order by chance; the app does not remember the previous visit's order. That a shuffled page holds exactly the server page's videos is a unit test, not a scenario.
Pagination uses a cursor on (time the video became `ready`, id), not an offset. The database sets that time automatically whenever a video's status changes to `ready`, including manual edits (REC-019), so it only grows for newly ready videos; a `ready` video without it is excluded from the feed and logged. So videos that become ready or unavailable mid-visit do not cause duplicates or skipped items. The client keeps the visit's shuffled list in memory and never reshuffles pages it has already loaded. When the last page reports no more pages, REC-001 wraps by replaying that in-memory list from the start.
Page size is 10 videos. The response has `videos` (each with its recipe) and `nextCursor`, which is `null` when there are no more pages; the server reads one row beyond the page, so an exactly full last page already returns `null`. Newest-first order within a server page is covered by unit tests. A unit test also checks that walking all pages returns every `ready` video exactly once, including ties on ready time at a page boundary (fixture data from this story's seed script). The full response contract is defined in the OpenSpec change. When to request the next page is already owned by REC-001's feed client (within two slides of the last loaded video; `add-vertical-swipe-feed` design §4). This story replaces REC-001's stub `FeedSource` with one that calls `GET /api/feed`, keeping at most one request per cursor in flight. Reaching the end of the loaded list while the next page is still loading is owned by REC-018.
An invalid or stale cursor returns HTTP 400; the client treats it as a failed page (REC-018). Covered by unit tests, not a scenario.
Built and tested on fixture data from a seed script in the repo, owned by this story; real `ready` videos come later from REC-005 and E02. The database schema and migration are owned by REC-019.
The periodic availability check (PRD §9) is out of the MVP (decided 2026-11-16; `draft-backlog-list.md` D-5). This story filters by status only: a removed video that is still `ready` is skipped by the player error handling in REC-018, or a maintainer marks it `unavailable` (PRD §9); videos with status `unavailable` are excluded by the status filter above.
CDN cache (PERF-6), decided 2026-11-16: feed pages with at least one video, cursor pages included, are cached for 1 hour (`s-maxage=3600`), with no other cache control; empty and error responses are `no-store`. New `ready` videos and status changes can take up to an hour to reach users. Refreshing the cache when ingestion finishes is a future improvement (`draft-backlog-list.md` D-6). The cache headers are checked on the route's response (Vitest) and in the local production build; after the first deploy, a one-time manual check confirms the Vercel CDN caches (a second request shows a cache `HIT`), since the CDN may remove `s-maxage` from what the browser receives. This story's change updates the C4 container diagram (`docs/architecture/c4/02-containers.md`, which says "`s-maxage` with revalidation") to match.
A next-page request that fails mid-visit is owned by REC-018 (decided 2026-11-16); its behavior is decided there. A visit opened from a deep link is owned by REC-014: the linked video plays first, then the feed starts at page 1, and the client skips that video if it comes up again.

### Estimation notes
M (reasoning updated after validation, 2026-11-16): a `GET /api/feed` route with status filtering, newest-first cursor pagination (one extra row read, 400 on an invalid cursor), and cache headers by response type; a `FeedSource` that replaces REC-001's stub; a client shuffle per page with an injectable random source; and a fixture seed script. The schema and migration (REC-019), the next-page trigger (REC-001), and error and loading states (REC-018) are owned elsewhere, which keeps it at M.
AI estimate (2026-11-16): 5. Calibration: REC-001 (team estimate 3) is the only estimated story; REC-002 is larger, since it adds a server side (route, Drizzle cursor query, cache headers by response type, 400 handling), a client shuffle, a `FeedSource` swap and a fixture seed script, each with unit tests, on top of a client of similar size. Risks that move it: the E2E data source and deterministic shuffle are still open (#28, waiting on the `add-e2e-testing` PR) and could add test setup; the recipe shape returned by the API depends on E02 (REC-006, REC-008) and may change the response (assumed: a placeholder recipe is enough here); and the Vercel CDN may handle `s-maxage` differently than the local build. It would drop to 3 if REC-019 lands first with the seed data path ready (assumed).

## REC-003 · Autoplay muted, tap to unmute, loop
- **Status:** todo
- **Labels:** module:playback, type:feature, size:M
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
- **Labels:** module:playback, type:feature, size:L
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
—

### Estimation notes
L: tight latency target combined with a hard cap on live players.
Highest technical risk in E01; validated on device by REC-015.

## REC-005 · Daily discovery of new candidate videos
- **Status:** todo
- **Labels:** module:ingestion, type:feature, size:L
- **PRD:** 6.1, ING-1, ING-2, ING-3, ING-4, 9 (API quota), 12 (seed channels)
- **Flags:** needs-human-validation; (assumed) seed channels and search queries will be provided before build (open decision)
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want new easy recipes to show up in the feed regularly, so that there is always something new to cook.

### Acceptance criteria
- Given the daily schedule, when the discovery job runs, then it finds new candidate videos from the configured search queries and/or seed channels (ING-1).
- Given a discovered video longer than 3 minutes, not embeddable, or not in English, when it is evaluated, then it is not kept as a candidate (ING-2).
- Given a video ID that is already in the database, when it is discovered again, then it is skipped (ING-3).
- Given launch day, when the catalog is checked, then about 50 videos are in `ready` status (ING-4).

### Technical context
—

### Estimation notes
L: YouTube API quota (search calls are expensive) shapes the whole job.
Depends on the open decision about seed channels and queries.

## REC-018 · Feed handles empty, error and unavailable states
- **Status:** todo
- **Labels:** module:feed, type:feature, size:M
- **PRD:** 5.1, 6.4, 9 (videos removed after ingestion)
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the feed to tell me when there is nothing to show or something failed, and to skip broken videos, so that I am never stuck on a blank or broken screen.

### Acceptance criteria
- Given there are no ready videos, when the feed loads, then an empty-feed message is shown.
- Given the feed request fails, when the feed loads, then an "Oops, something went wrong" message is shown.
- Given I am offline, when the feed loads, then an "Oops, something went wrong" message is shown.
- Given the active video was removed or is no longer embeddable, when it fails to load in the player, then the next video loads automatically.

### Technical context
Split from REC-001 during its validation (findings #4 and #6). Also owns a next-page request that fails mid-visit (from REC-002 validation, #18, 2026-11-16); the user-facing behavior is still to be decided when this story is validated. Also owns reaching the end of the loaded list while the next page is still loading (from REC-002 validation, #31). Relies on the YouTube IFrame Player error event to detect removed videos; a periodic availability check that removes them from the catalog is out of the MVP (`draft-backlog-list.md` D-5).

### Estimation notes
M: three simple messages, plus skipping a video on a player error.
The player error event's timing and reliability is the main unknown.

## REC-019 · Database schema and migration for the video catalog
- **Status:** todo
- **Labels:** module:ingestion, type:feature, size:S
- **PRD:** 6.4, 6.5
- **Flags:** needs-human-validation; (assumed) the recipe is stored as one JSON value until E02 (REC-006, REC-008) defines its structure
- **AI estimate:** —
- **Estimate:** —

As a maintainer, I want one versioned database schema for videos, their status and their recipe, so that the feed and the ingestion job read and write the same data.

### Acceptance criteria
- Given an empty database, when the migrations run, then a videos table exists with the YouTube video ID, a status limited to ready, needs_recipe, not_easy and unavailable, the recipe, and the time the video became ready.
- Given a video with any other status, when its status changes to `ready`, then its ready time is set to the current time.
- Given the migrations have already run, when they run again, then the schema is unchanged.

### Technical context
Split from REC-002 during its validation (#27, 2026-11-16); REC-002 is blocked by this story. Drizzle ORM schema and migrations (ADR 0003), shared by the web app and the ingestion job (C4 container diagram). The ready time is set by the database itself (from REC-002 validation, #26), so a maintainer's manual edit to `ready` (PRD 6.4) also sets it; how (for example a trigger) may need an ADR (`write-adr`). REC-002 owns the fixture seed script; REC-005, REC-008 and REC-010 write to this schema.

### Estimation notes
S: one table, a status enum, one database rule for the ready time, and Drizzle migration setup.

## REC-020 · Data model document (no implementation)
- **Status:** todo
- **Labels:** module:ingestion, type:docs, size:S
- **PRD:** 5.3, 6.2, 6.4, 6.5
- **Flags:** needs-human-validation; (assumed) the document lives in `docs/architecture/data-model.md` with a Mermaid `erDiagram`
- **AI estimate:** —
- **Estimate:** —

As a maintainer, I want the data model written down before the schema is built, so that the feed, the recipe panel and the ingestion job agree on the same entities and fields.

### Acceptance criteria
- Given the PRD and the validated stories, when I open the data model document, then it shows every entity (at least video and recipe) in an entity-relationship diagram with its fields, types, keys and relationships.
- Given the data model document, when I read the video entity, then its status allows only ready, needs_recipe, not_easy and unavailable, and it has the time the video became ready.
- Given the data model document, when I read the recipe entity, then it has servings, the ingredients, the numbered steps and where the recipe came from (description or top comment).

### Technical context
Documentation only: no migration, no code. REC-019 implements the schema and must match this document; when they differ, the document is updated in the same change. Covers the parts REC-019 leaves open (REC-019 stores the recipe as one JSON value until E02 decides its structure), so the recipe's shape follows PRD §5.3 and §6.2 and may be refined by REC-006 and REC-008. Whether an ingestion run is stored is an open decision to record, not to invent. Linked from the README "Data model" section and the Entrega 1 checklist (item 7). An architecture decision found while writing it goes through `write-adr`.

### Estimation notes
S: one document with a diagram, drawn from the PRD and stories already validated; no code.

## REC-021 · API specification document (no implementation)
- **Status:** todo
- **Labels:** module:feed, type:docs, size:S
- **PRD:** 6.5, API-1, API-2, API-3
- **Flags:** needs-human-validation; blocked-by:REC-020; (assumed) the specification is an OpenAPI 3.1 file in `docs/api/openapi.yaml`, rendered from the README (no new library)
- **AI estimate:** —
- **Estimate:** —

As a maintainer, I want the feed API specified before it is built, so that the web app and its tests rely on one agreed request and response shape.

### Acceptance criteria
- Given the API specification, when I read the feed endpoint, then it shows the request (optional cursor), the response (`videos`, each with its recipe, and `nextCursor`, which is `null` on the last page) and the page size of 10.
- Given the API specification, when I read the feed endpoint's errors, then an invalid cursor returns 400 and the caching headers for normal, empty and error responses are listed.
- Given the API specification, when I read the single-video endpoint, then it shows the request by video ID, the response with the video and its recipe, and the response for an unknown or non-ready ID.

### Technical context
Documentation only: no route, no code. REC-002 implements the feed endpoint (its Technical context already fixes the cursor, page size, `nextCursor`, 400 and caching) and REC-014 the deep link; both must match this document, and it is updated in the same change when they differ. Response schemas reuse the entities in the data model document (REC-020). The answer for an unknown or non-ready ID is still an open decision in REC-014: the document records the decision when it is made, or marks it open. Linked from the README "API specification" section and the Entrega 1 checklist (item 8).

### Estimation notes
S: two endpoints whose behavior is mostly decided in REC-002; no code.
