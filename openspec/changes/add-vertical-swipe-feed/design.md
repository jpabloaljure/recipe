# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-16:

- `src/app/page.tsx` is a server component that shows the working title.
  `globals.css` already sets a full-height black body with
  `overflow: hidden`; `layout.tsx` sets `viewport-fit=cover`.
- Vitest runs in the `node` environment on `src/**/*.test.ts`. There is no
  DOM test environment, and the human decided this change adds none: logic
  is tested as pure functions, and scrolling and layout are checked by hand
  on devices.
- No feed API exists yet (REC-002). REC-002's story requires the feed
  response to say when there are no more pages.
- REC-001's technical check (2026-11-16, Chrome on Android and desktop)
  showed that plain CSS scroll-snap with `scroll-snap-stop: always` moves one
  video per gesture, and that swipes over a YouTube iframe move the feed
  only when no overlay sits above the iframe.
- Requirements are in `specs/feed/spec.md`.

## Goals / Non-Goals

**Goals:**
- A feed whose data source can be swapped for REC-002's API without
  touching the scroll, layout or wrap-around code.
- Wrap-around to the first video with no visible jump or double snap (the
  main risk named in REC-001's estimate).
- All order and wrap-around rules covered by Vitest tests in Node.

**Non-Goals:**
- The YouTube IFrame Player API, autoplay, mute, loop, pause (REC-003).
- Preloading and measuring the three-player cap (REC-004, REC-015).
- Loading, empty and error messages (REC-018). A failed stub page load is
  not handled here.
- Recipe data on feed items (REC-002, REC-006).

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
function in `src/lib/feed/`.

- **Why:** with mandatory snap the container always settles on a slide
  boundary, so the rounded position is exact. `scrollend` is supported in
  Chrome, the only MVP browser, and fires once per settled gesture.
- **Alternative: IntersectionObserver on each slide.** Works, but needs a
  threshold choice and fires during the gesture; not needed for Chrome only.

### 3. Wrap-around by appending another cycle, not by jumping

The client keeps the **visit order**: every item received, in the order
received, plus a `catalogEnded` flag set when a page reports no next page.
The rendered slide list is the visit order, and once the catalog has ended,
further copies of it ("cycles") are appended whenever the active slide gets
within two slides of the end. Each slide's React key is
`<cycle>-<videoId>`.

So a forward swipe on the last video of the catalog is an ordinary snap to
the next slide, which is the first video of the visit order. Nothing jumps,
and the second, third… swipes continue through the same order.

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

### 4. A typed, page-based feed source with a stub

`src/lib/feed/types.ts` defines a feed item (`youtubeId`, `title`; no
separate `id`, matching the API specification owned by REC-021, which later
adds `channelName` and `recipe` in REC-002) and a page (`items`, `nextCursor: string | null`, where `null` means end of
catalog), plus a `FeedSource` interface: `getPage(cursor: string | null):
Promise<FeedPage>`. `src/lib/feed/stub-source.ts` implements it in memory
over a fixture of real, embeddable public cooking Shorts, with a small page
size (3) so that a catalog of about 7 videos spans three pages and the
cross-page wrap is exercised.

The client loads the first page on mount and requests the next page when
the active slide is within two slides of the last loaded one and the
catalog has not ended. A pure function decides this.

- **Why:** this is the shape REC-002 must provide ("tell the client when
  there are no more pages"). REC-002 replaces the stub with a source that
  calls `GET /api/feed` and may extend the types (recipe, cursor format);
  the feed component does not change.
- The stub is async on purpose, so loading order and races behave as with
  the real API.
- The fixture uses real YouTube video IDs picked at apply time and checked
  to be embeddable; no IDs are invented.

### 5. Plain YouTube embed, only around the active slide

Each slide centers a frame (Decision 6) holding a plain
`<iframe src="https://www.youtube-nocookie.com/embed/<id>?playsinline=1&rel=0">`
with no overlay above it. Only the active slide and its two neighbors render
an iframe; other slides render an empty frame.

- **Why:** the human chose a plain embed so that swipes over the iframe and
  "the video ends and the feed stays" can be checked now. `playsinline=1`
  keeps playback in the page on mobile. No `autoplay` or `loop` parameters:
  those belong to REC-003, which replaces this embed with the player
  controller. `youtube-nocookie.com` is the privacy-enhanced host of the
  same official player (PRD §9 still holds); REC-003 can revisit it.
- **Why the ±1 window:** without it, every slide (and every lap from
  Decision 3) would load a YouTube player. This is the minimum guard, not
  REC-004's work: REC-004 still owns preloading, the < 500 ms target and
  verifying the cap.
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

### 7. File layout and C4

- `src/app/page.tsx` stays a server component and renders the client
  `Feed` component (`src/app/feed/Feed.tsx` and `Feed.module.css`).
- Pure logic and types live in `src/lib/feed/` with `*.test.ts` next to
  them, matching ADR 0005's `src/lib` for shared code (REC-002's API route
  will import the same types).
- **No new ADR:** no library, service, data store or structural pattern is
  added; the approach follows ADRs 0002 and 0005.
- **C4 level 3 (web app):** the Feed component is now built. Update its
  description (scroll-snap feed, wrap-around, stub source until REC-002) and
  the notes. The diagram stays `Proposed` until the other components exist.
  Levels 1 and 2 do not change (YouTube's embedded player is already an
  external system).

## Risks / Trade-offs

- [`scrollend` fires late or twice on some Android builds] → the active
  index is derived from position, so a repeat is harmless; check on the
  Android test device during manual checks.
- [Appended cycles reuse the same YouTube IDs, so two slides can embed the
  same video] → keys include the cycle, and only the ±1 window has iframes,
  so at most a short catalog shows the same video twice at once. Accepted.
- [Next page not loaded yet when the user reaches the last loaded slide] →
  the feed simply cannot scroll further until the page arrives; with the
  stub this is instant. Real network delays and failures are REC-002 and
  REC-018.
- [Hard flicks over three live iframes skip a video] → the technical check
  used one player; this change checks with the ±1 window on device, and
  REC-004/REC-015 re-check under load.
- [Pull-to-refresh or browser chrome resizing changes `100dvh` mid-swipe] →
  `dvh` and `overscroll-behavior-y: contain`; covered by the manual checks.

## Migration Plan

The placeholder page is replaced; there is no data or API to migrate.
Deploy is Vercel's Git integration on merge to `main`. Rollback: revert the
merge commit.

## Open Questions

- Which public cooking Shorts make up the stub fixture: picked at apply
  time; any embeddable Shorts work and the choice does not affect behavior.
