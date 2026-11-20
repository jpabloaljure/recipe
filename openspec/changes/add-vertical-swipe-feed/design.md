# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-19:

- `src/app/page.tsx` is a server component that shows the working title.
  `globals.css` already sets a full-height black body with
  `overflow: hidden`; `layout.tsx` sets `viewport-fit=cover`.
- Vitest runs in the `node` environment on `src/**/*.test.ts`. Browser
  behavior is tested with Playwright (ADR 0006):
  - `e2e/support/test.ts` stubs YouTube embed hosts with a local page
    (`data-testid="youtube-stub"`) and fails on any other outside request;
  - `e2e/support/gestures.ts` sends CDP touch swipes and resolves on
    `scrollend`;
  - `e2e/support/projects.ts` defines `phone-portrait`, `phone-landscape`
    and `desktop`, with `onlyOn`.

  The `@smoke` test loads `/` with no API stub.
- The feed API contract is `docs/api/openapi.yaml` (REC-021): pages of
  `{ items, nextCursor }`, items `{ youtubeId, title, channelName, recipe }`,
  an opaque cursor, 400 `invalid_cursor`, and `Cache-Control` per response.
  No route exists yet. REC-002 will fill the route from the database
  (REC-019).
- REC-001 was re-validated on 2026-11-19 with a stub route, AC6 (next page)
  and the E2E plan (backlog `E01-browse-feed.md`, REC-001 Technical context).
- REC-001's technical check (2026-11-16, Chrome on Android and desktop)
  showed that plain CSS scroll-snap with `scroll-snap-stop: always` moves one
  video per gesture, and that swipes over a YouTube iframe move the feed
  only when no overlay sits above the iframe.
- Requirements are in `specs/feed/spec.md`.

## Goals / Non-Goals

**Goals:**
- A feed whose data comes over HTTP from `/api/feed` from day one, so
  REC-002 swaps only the route's data and the client and tests stay as
  they are.
- Wrap-around to the first video with no visible jump or double snap (the
  main risk named in REC-001's estimate).
- Order, wrap-around and next-page rules covered by Vitest; every
  automatable spec scenario covered by a Playwright test (E2E rule 12).

**Non-Goals:**
- The YouTube IFrame Player API, autoplay, mute, loop, pause (REC-003).
- Preloading and measuring the three-player cap (REC-004, REC-015).
- Loading, empty and error messages (REC-018). A failed page load is not
  handled here.
- The database query, shuffle, empty-feed and 5xx responses of the route
  (REC-002).
- Showing a video's title or recipe (REC-006, REC-007).

## Decisions

### 1. Native CSS scroll-snap on one scroll container

The feed is a client component that renders a vertical scroll container
(`height: 100dvh`, `overflow-y: scroll`, `scroll-snap-type: y mandatory`,
`overscroll-behavior-y: contain`). Each slide is `100dvh` tall with
`scroll-snap-align: start` and `scroll-snap-stop: always`.

- **Why:** this is the mechanism the technical check proved on Android and
  desktop, and it needs no library. `scroll-snap-stop: always` gives one
  video per gesture, including hard flicks. `overscroll-behavior-y:
  contain` stops Chrome's pull-to-refresh, so a backward swipe on the first
  video does nothing (spec: no backward wrap).
- **Alternative: JS-driven paging** (touch handlers that translate a track).
  More control, but it re-implements momentum and would fight the iframe
  for touch events; the check showed native scroll already works.
- **Alternative: a carousel library.** Ruled out by `AGENTS.md` (no new
  library without approval and an ADR) and not needed.

### 2. Active slide from `scrollend`

The active index is `Math.round(scrollTop / slideHeight)`, computed on the
container's `scrollend` event (and once on mount). The calculation is a pure
function in `src/lib/feed/`. The active slide carries `data-active="true"`
so tests can find it (Decision 8).

- **Why:** with mandatory snap the container always settles on a slide
  boundary, so the rounded position is exact. `scrollend` is supported in
  Chrome, the only MVP browser, and fires once per settled gesture.
- **Alternative: IntersectionObserver on each slide.** Works, but needs a
  threshold choice and fires during the gesture; not needed for Chrome only.

### 3. Wrap-around by appending another cycle, not by jumping

The client keeps the **visit order**: every item received, in the order
received, plus a `catalogEnded` flag set when a page's `nextCursor` is
`null`. The rendered slide list is the visit order. Once the catalog has
ended, more copies of it ("cycles") are appended whenever the active slide
gets within two slides of the end. Each slide's React key is
`<cycle>-<youtubeId>`.

So a forward swipe on the last video of the catalog is an ordinary snap to
the next slide, which is the first video of the visit order. Nothing jumps,
and the second, third… swipes continue through the same order. A catalog
of one video wraps to the same video, with no special case.

- **Why:** a `scrollTo(0)` jump back to the top is the glitch the estimate
  warned about (visible jump, or a second snap while the browser settles).
  Appending keeps scrolling native and continuous.
- **Trade-off:** the slide list grows with each lap. Slides outside the
  active ±1 window render no iframe (Decision 5), so an extra lap costs only
  empty `div`s. Acceptable for a visit-length session.
- **Alternative: trimming earlier cycles.** Removing slides above the
  viewport shifts `scrollTop` and needs scroll-anchoring work; not worth it
  for the MVP.
- Backward never wraps: the list has nothing above the first slide.

### 4. A stub feed route and an HTTP feed source

- **Types:** `src/lib/feed/types.ts` holds the contract's response types:
  - `FeedItem`: `youtubeId`, `title`, `channelName: string | null`,
    `recipe: Recipe | null`;
  - `Recipe`: `servings`, `ingredients: Ingredient[]`, `steps`, `source`;
  - `Ingredient`: `name`, `quantity`, `unit`;
  - `FeedPage`: `items`, `nextCursor: string | null`, where `null` means
    end of catalog;
  - `ApiError`: the error body;
  - the `FeedSource` interface: `getPage(cursor: string | null):
    Promise<FeedPage>`.

  There is no `id`. The route, REC-014's route and the E2E stub data all
  import these types.
- **Fixture:** `src/lib/feed/fixture.ts` holds about 7 real, embeddable
  public cooking Shorts, each with its real `title` and `channelName`, and
  `recipe: null`. Production therefore shows title-only items, and no
  invented recipe is ever served.
- **Paging:** `src/lib/feed/fixture-pages.ts` is a pure function that turns
  a cursor into a page, 3 items per page, so the catalog spans three pages
  and the cross-page wrap runs on the live site. The cursor is the next
  offset, encoded as base64url JSON. A value that cannot be decoded,
  including the empty string, is an error.
- **Route:** `src/app/api/feed/route.ts` (`GET`) reads `cursor` and calls
  the paging function. It returns:
  - a page with `Cache-Control: public, s-maxage=3600`;
  - for an undecodable cursor, 400 with
    `{ "error": { "code": "invalid_cursor", "message" } }` and
    `Cache-Control: no-store`.

  It produces no empty-feed or 5xx response (REC-002 adds them with the
  database).
- **Client:** `src/lib/feed/http-source.ts` is a `FeedSource` that fetches
  `/api/feed` (with `?cursor=` after the first page) and returns the parsed
  page. It throws on a non-2xx response; showing that error is REC-018's.
- **Next page:** the client loads the first page on mount and requests the
  next one when the active slide is within two slides of the last loaded
  slide and the catalog has not ended. A pure function decides this.
- **Tests:** the paging function, the route handler (called with a
  `Request` in Vitest) and the HTTP source (with a stubbed `fetch`) have
  unit tests. Their expected values (fields, status codes, error code,
  `Cache-Control` values) are written into the tests by hand and checked
  against `openapi.yaml` in review; there is no YAML parser or validator
  library (REC-021 Conformance).

- **Why:**
  - E2E tests stub `/api/feed` with `page.route`, so they stay valid when
    REC-002 replaces the fixture with the database.
  - The live site exercises real paging.
  - The response shape is the contract from the start.
- **Alternative: an in-memory stub source** (the earlier plan). Rejected in
  REC-001's re-check (#42): tests would rely on built-in data and need
  rewriting when REC-002 lands, and the next-page request could not be
  seen.
- **Alternative: a separate backend story for the route.** Rejected in the
  same re-check: a full-stack slice is the default, and splitting would
  block REC-001 on a new story.

### 5. Plain YouTube embed, only around the active slide

Each slide centers a frame (Decision 6) holding a plain
`<iframe src="https://www.youtube-nocookie.com/embed/<id>?playsinline=1&rel=0">`
with no overlay above it. Only the active slide and its two neighbors render
an iframe; other slides render an empty frame.

- **Why:** the human chose a plain embed so that swipes over the iframe and
  "a playing video ends and the feed stays" can be checked now.
  `playsinline=1` keeps playback in the page on mobile. No `autoplay` or
  `loop` parameters: those belong to REC-003, which replaces this embed with
  the player controller. `youtube-nocookie.com` is the privacy-enhanced host
  of the same official player (PRD §9 still holds); REC-003 can revisit it.
- **Why the ±1 window:** without it, every slide (and every lap from
  Decision 3) would load a YouTube player. It also means the gesture checks
  run with three live players, which is the case that failed with an
  overlay. REC-004 still owns preloading, the < 500 ms target and the PERF-5
  cap.
- **Alternative: placeholder cards.** Rejected by the human: they would not
  let the swipe-over-iframe and end-of-video behavior be checked.

### 6. Centering with `aspect-ratio`

Each slide is a flex container that centers a frame sized
`height: 100%; aspect-ratio: 9 / 16; max-width: 100%`. The iframe fills the
frame. Slides keep the black body background around the frame.

- **Why:** on desktop and on a phone in landscape the frame is full height
  and centered; on a phone in portrait (taller than 9:16) the frame takes
  the full width and the YouTube player letterboxes inside it. One rule
  covers every screen shape, with no media queries.
- Safe-area insets: the slide pads with `env(safe-area-inset-*)` like the
  placeholder page did, so the player is not under a notch in landscape.

### 7. File layout, C4 and the contract

- `src/app/page.tsx` stays a server component and renders the client
  `Feed` component (`src/app/feed/Feed.tsx` and `Feed.module.css`).
- Pure logic, types and the fixture live in `src/lib/feed/` with
  `*.test.ts` next to them, matching ADR 0005's `src/lib` for shared code.
- **No new ADR:** no library, service, data store or structural pattern is
  added; the approach follows ADRs 0002, 0005 and 0006.
- **C4 level 3 (web app):**
  - Feed is built: scroll-snap feed, one video per gesture, wrap-around,
    next page via `/api/feed`.
  - Feed route: "fixture data until REC-002"; its read of the database
    starts with REC-002.

  The diagram stays `Proposed` until the other components exist. Levels 1
  and 2 do not change.
- **`docs/api/openapi.yaml`:** the description lists REC-001 (the client
  and the stub route), REC-002 (the data) and REC-014 (the deep link) as
  implementers.

### 8. End-to-end tests

- **Location:** one file per requirement in `e2e/feed/`, named
  `<requirement-kebab>.spec.ts`. Each test is named
  `feed › <Requirement> › <Scenario>` (rules 2 and 4).
- **Shared helper:** `e2e/support/feed.ts` provides:
  - `stubFeed(page, pages)`, which answers `/api/feed` with `page.route`
    from a list of pages built from the shared types, so each test chooses
    its own catalog (rule 5);
  - `activeSlide(page)`, which finds the slide with `data-active="true"`;
  - `scrollToSlide(page, index)`, which sets up a starting slide by code and
    waits for `scrollend` (rule 3).
- **Selectors:** slides carry `data-testid="feed-slide"`,
  `data-youtube-id` and `data-active` (rule 7).
- **What each test checks:**
  - **Layout:** read the frame's box against the viewport.
  - **Gestures:** use `swipeNext` and `swipePrevious` from
    `e2e/support/gestures.ts`.
  - **Wrap-around:** a one-page or multi-page stub catalog, scrolled by code
    to the last slide, then one swipe.
  - **Next page:** wait for a request to `/api/feed?cursor=` after
    scrolling near the last loaded slide.
- **Manual, with the reason (rule 13):**
  - taps reach the YouTube player and a playing video ends with no
    autoscroll: both need the real YouTube player, which E2E stubs;
  - real finger flicks on Android and real wheel or trackpad scrolling on
    desktop;
  - "Supported browsers": real devices.

- **Why:** this is the plan agreed in REC-001's re-check (#42), and it
  follows E2E rules 1–13 with the existing support code.

## Risks / Trade-offs

- [`scrollend` fires late or twice on some Android builds] → the active
  index is derived from position, so a repeat is harmless; check on the
  Android test device during manual checks.
- [Synthetic swipes over scroll-snap with three iframes are flaky in
  Chromium] → retries are off and a flaky test is a bug (rule 10): fix the
  wait, or mark it `test.fixme` with a backlog link; never add a fixed wait.
- [Appended cycles reuse the same YouTube IDs, so two slides can embed the
  same video] → keys include the cycle, and only the ±1 window has iframes,
  so at most a short catalog shows the same video twice at once. Accepted.
- [Next page not loaded yet when the user reaches the last loaded slide] →
  the feed cannot scroll further until the page arrives. Real network
  delays and failures are REC-002 and REC-018.
- [Hard flicks over three live iframes skip a video] → this change checks
  with the ±1 window on device, and REC-004/REC-015 re-check under load.
- [Production serves the fixture, cached for an hour, until REC-002] →
  title-only items of real videos, so nothing invented is shown; REC-002
  replaces the data.
- [Pull-to-refresh or browser chrome resizing changes `100dvh` mid-swipe] →
  `dvh` and `overscroll-behavior-y: contain`; covered by the manual checks.

## Migration Plan

The placeholder page is replaced; there is no data to migrate. Deploy is
Vercel's Git integration on merge to `main`. Rollback: revert the merge
commit.

## Open Questions

- Which public cooking Shorts make up the fixture: picked at apply time;
  any embeddable Shorts work and the choice does not affect behavior.
