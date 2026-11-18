# Proposal

## Why

The app is deployed but shows only a placeholder title. The core of the
product (PRD §5.1, goal G1) is a vertical, full-screen feed of cooking Shorts
that the home cook moves through one video at a time. REC-001 is the first
validated story (`Flags: —`, `Estimate: 3`), and every later feed, playback
and recipe-panel story builds on top of it.

## What Changes

- Replace the placeholder home page with a vertical, full-screen feed that
  shows one video at a time, built with CSS scroll-snap and native
  scroll/touch events (no carousel library).
- One swipe or scroll gesture moves exactly one video, forward or back. No
  autoscroll: when a video ends and the user does nothing, the feed stays.
- On desktop and on a phone in landscape, the 9:16 video is centered on the
  screen.
- After the last video of the catalog, the next swipe shows the first video
  of this visit's order (forward wrap-around). Swiping back on the first
  video does nothing.
- Each slide is a plain YouTube `<iframe>` embed with no overlay above it,
  so swipes over the video move the feed and taps reach the YouTube player.
- Feed data comes from a typed stub source that returns pages with an
  end-of-catalog marker, in the shape of the feed API specification
  (`docs/api/openapi.yaml`, REC-021). REC-002 replaces the stub with the
  real API.
- Feed-order and wrap-around logic lives in pure TypeScript functions with
  Vitest tests in Node. Scrolling, snapping and layout are checked by hand in
  Chrome on Android and desktop. No component-testing libraries are added
  (decided with the human for this change).

This change implements **REC-001** only. REC-001 is not flagged
`needs-human-validation` (checked 2026-11-16: `Flags: —`, `Estimate: 3`).

Out of scope (owned by other stories): the IFrame Player API, autoplay,
mute/unmute, loop and pause (REC-003); preloading and the three-player cap
(REC-004); the real feed API, ordering and pagination (REC-002); empty, error
and unavailable states (REC-018); deep-link start (REC-014); the recipe panel
(REC-006, REC-007); the < 2 s load target (REC-015). Browsers other than
Chrome on Android and desktop are out of scope for the MVP.

## Capabilities

### New Capabilities
- `feed`: the vertical video feed the home cook browses — which video is
  active, how gestures move between videos, layout on each screen shape, and
  what happens at the start and end of the catalog.

### Modified Capabilities
None (no specs exist yet).

## Impact

- **Code:** `src/app/page.tsx` and `page.module.css` (feed replaces the
  placeholder); new feed component and CSS module under `src/app/`; new
  feed types, stub source and order/wrap-around logic with tests under
  `src/lib/feed/`.
- **Dependencies:** none added.
- **Systems:** none added. The page embeds YouTube (`youtube-nocookie.com`
  or `youtube.com` embed URLs), already an external system in the C4
  context diagram.
- **Docs:** the C4 level 3 web-app diagram moves the "Feed" component from
  planned to built and states that the feed uses a stub source until REC-002.
  No new ADR: the approach follows ADR 0002 and adds no library, service or
  structural pattern.
- **Backlog:** REC-001 moves to `in-progress` at apply start and to `done`
  when the change is verified on devices.
