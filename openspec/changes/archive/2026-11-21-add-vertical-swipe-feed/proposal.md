# Proposal

## Why

The app is deployed but shows only a placeholder title. The core of the
product (PRD §5.1, goal G1) is a vertical, full-screen feed of cooking Shorts
that the home cook moves through one video at a time. REC-001 is validated
(re-validated 2026-11-19: `Flags: —`, `Estimate: 5`), and every later feed,
playback and recipe-panel story builds on top of it.

## What Changes

- Replace the placeholder home page with a vertical, full-screen feed that
  shows one video at a time, built with CSS scroll-snap and native
  scroll/touch events (no carousel library).
- One swipe or scroll gesture moves exactly one video, forward or back. No
  autoscroll: when a playing video ends, the feed stays on it.
- On desktop and on a phone in landscape, the 9:16 video is centered on the
  screen.
- After the last video of the catalog, the next swipe shows the first video
  of this visit's order (forward wrap-around). Swiping back on the first
  video does nothing.
- The feed requests the next page when the active video is within two
  slides of the last loaded video and more pages remain.
- Each slide is a plain YouTube `<iframe>` embed with no overlay above it,
  so swipes over the video move the feed and taps reach the YouTube player.
- Feed data comes from a **stub `GET /api/feed` route** in the shape of the
  API specification (`docs/api/openapi.yaml`, REC-021). It pages a fixture
  of about 7 real, embeddable public cooking Shorts with their real channel
  names and `recipe: null` (title-only items, so no invented recipe reaches
  users), 3 per page, with an opaque cursor. A client `FeedSource` calls the
  route. REC-002 later replaces the fixture with the database, leaving the
  client and the tests unchanged.
- Feed-order, wrap-around and next-page rules and the route are tested with
  Vitest in Node. What only a browser can show (layout, scrolling, wrap,
  next-page request) is tested with Playwright on the `phone-portrait`,
  `phone-landscape` and `desktop` projects, with `/api/feed` stubbed per
  test. Real finger flicks, real wheel and trackpad scrolling, and the
  YouTube player's own behavior stay manual checks (AGENTS.md E2E rule 13).

This change implements **REC-001** only. REC-001 is not flagged
`needs-human-validation` (checked 2026-11-19: `Flags: —`, `Estimate: 5`).

Out of scope (owned by other stories): the IFrame Player API, autoplay,
mute/unmute, loop and pause (REC-003); preloading and the three-player cap
(REC-004); the database query, shuffle, empty-feed and 5xx responses of the
feed API (REC-002); loading, empty, error and unavailable states (REC-018);
deep-link start (REC-014); the recipe panel and title display (REC-006,
REC-007); the < 2 s load target (REC-015). Browsers other than Chrome on
Android and desktop are out of scope for the MVP (PRD §4).

## Capabilities

### New Capabilities
- `feed`: the vertical video feed the home cook browses — which video is
  active, how gestures move between videos, layout on each screen shape,
  what happens at the start and end of the catalog, and when the next page
  is requested.

### Modified Capabilities
None (no specs exist yet).

## Impact

- **Code:**
  - `src/app/page.tsx` and `page.module.css` (the feed replaces the
    placeholder);
  - the feed component and CSS module under `src/app/feed/`;
  - the stub route `src/app/api/feed/route.ts`;
  - under `src/lib/feed/`: the contract types, the fixture, the page and
    cursor functions, the HTTP `FeedSource`, and the order, wrap-around and
    next-page logic, each with Vitest tests;
  - E2E tests under `e2e/feed/` and a shared helper in `e2e/support/`.
- **Dependencies:** none added.
- **Systems:** none added. The page embeds YouTube (`youtube-nocookie.com`
  embed URLs), already an external system in the C4 context diagram.
- **Docs:**
  - the C4 level 3 web-app diagram describes the built Feed component and
    the Feed route (fixture data until REC-002);
  - `docs/api/openapi.yaml` lists REC-001 among the implementers (the
    client and the stub route).

  No new ADR: the approach follows ADRs 0002, 0005 and 0006 and adds no
  library, service or structural pattern.
- **Production:** until REC-002, the live feed shows the fixture videos,
  title only, through the real route, cached for an hour.
- **Backlog:** REC-001 moves to `in-progress` at apply start and to `done`
  when every automatable scenario has a passing E2E test and the manual
  checks pass.
