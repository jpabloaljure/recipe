# Proposal

## Why

Today the feed shows a blank screen whenever it has nothing to show: while the
first page loads, when the catalog is empty, when a request fails, and when the
next page is late. The first page is requested once and never retried. A video
that was removed or can no longer be embedded leaves a dead slide that the home
cook has to swipe past. PRD §5.1 and §9 promise a feed that never leaves the
home cook stuck on a blank or broken screen and that skips a video that fails.
REC-018 is validated (`Flags: split-from:REC-001`, `Estimate: 5`, re-validated
2026-11-24) and REC-004, the story it depended on, is done.

## What Changes

- Add a status view for the first load: a loading indicator, a "No recipes yet"
  message for an empty catalog, and an "Oops, something went wrong" message
  with a Retry button for a failed or slow (10 seconds) first page and for
  being offline.
- Add an end slide that shows a loading indicator or a retry row while the next
  page is loading or has failed. A swipe past it does nothing.
- Apply the same 10-second timeout to next-page requests; a timed-out request
  counts as failed.
- Skip a video that was removed or is no longer embeddable (YouTube player
  errors 100, 101 and 150): the feed drops it from the list, in every repeat of
  the list, and the next video takes its place. This is the one exception to
  "No autoscroll" and "One video per gesture". A neighbour that reports the
  error is dropped before it is reached.
- After 3 skips in a row, or when no video is left and no next page exists,
  show the "Oops" message and Retry. Retry after such a message clears this
  visit's skipped videos and requests the first page again.
- Keep the video I am watching on screen when a video in an earlier position is
  removed.
- Report player errors from the player adapter, and add the matching test
  support: error events on the fake player and loading, empty, failed and slow
  answers on the stubbed feed.
- Add E2E tests for the automatable scenarios, and a manual check on real
  broken videos (error codes, neighbour errors, the 10-second value).
- PRD §5.1 already carries the skip exception (PR 77); no PRD change here.

This change implements **REC-018** only. REC-018 is not flagged
`needs-human-validation` (checked 2026-11-24: `Flags: split-from:REC-001`,
`Estimate: 5`).

Out of scope (owned by other stories or the draft backlog): autoplay that fails
even when muted (D-19) and player errors other than 100, 101 and 150, the
YouTube script failing to load, a slow neighbour (D-20); the deep link and the
recipe panel's own handling of a video that fails (REC-014, REC-007, which
reference this skip in their criteria); a periodic availability check that
marks removed videos `unavailable` (D-5).

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `feed`: adds the first-load states, the end slide while pages remain, the
  skipped videos and the Retry rules; modifies "No autoscroll", "One video per
  gesture", "Wrap to the start after the last video" and "Next page loads ahead".
- `playback`: adds "The player reports videos that cannot play".

## Impact

- Code: `src/app/feed/Feed.tsx` (status view, end slide, skip, scroll fix),
  `src/app/feed/SlideVideo.tsx`, `src/app/feed/Feed.module.css`,
  `src/lib/feed/feed-state.ts`, `src/lib/feed/http-source.ts` (timeout),
  `src/lib/player/youtube-player.ts` and `types.ts` (error event).
- Tests: Vitest for the state rules and the timeout (injected timers), E2E for
  the screen scenarios, `e2e/support/youtube-fake.ts` and `e2e/support/feed.ts`.
- Specs: the `feed` and `playback` deltas in this change.
- No new library, service, API contract or database change; no ADR or C4 update
  (the YouTube IFrame Player API is already ADR 0008).
