# Design

## Context

Today `Feed.tsx` loads the first page once on mount and renders `slides = []`
as a blank screen whenever there is nothing to show. A failed page is only freed
for the next trigger (`PageRequests.fail`), so the first page is never tried
again. The feed state (`feed-state.ts`) holds `visit`, `nextCursor`,
`catalogEnded` and `cycles`; after the catalog ends the visit list is repeated
per cycle and slide keys are `<cycle>-<youtubeId>`. The player adapter
(`youtube-player.ts`) passes only `onReady` and `onStateChange` to the YouTube
API, so a player error is never seen. A slide mounts a player for the active
video and its two neighbours (REC-003, REC-004). `http-source.ts` has no
timeout. See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Every state the home cook can reach (loading, empty, failed, late next page,
  a video that cannot play) shows something or recovers on its own.
- Each rule is a pure function with a Vitest test; E2E covers only what a real
  browser shows (AGENTS.md E2E rule 1).
- Removing a slide never changes the video on screen.

**Non-Goals:**
- Player errors other than 100, 101 and 150, autoplay that fails when muted, a
  slow neighbour, the script failing to load (draft backlog D-19, D-20).
- A periodic availability check, and any change to what the API returns.
- The deep link and the recipe panel's own skip handling (REC-014, REC-007).

## Decisions

1. **The feed state gains a status, the skipped IDs and a skip counter.**
   `FeedState` adds `status` (`loading`, `empty`, `error`, `ready`), `skipped`
   (a set of YouTube IDs) and `skipsInARow`. `buildSlides` drops skipped IDs and
   `appendPage` ignores them, so no later page or Retry puts a dropped video
   back. A dropped video is removed by ID, so it leaves every repeat of the list.
   Alternative: remove by slide key only; rejected because the repeats would
   still show the video. Every transition is a pure function in `feed-state.ts`
   with its own test: page arrives, page fails, video skipped, video plays
   (counter reset), Retry.

2. **Two components.** A centered status view shows loading, "No recipes yet"
   and "Oops, something went wrong" with Retry; the feed renders no slides while
   it shows. The end slide is an ordinary snap slide after the last loaded
   video, rendered only while `!catalogEnded`, with the loading indicator or the
   retry row. After the catalog ends, `ensureCycles` keeps the wrap as it is.
   Alternative: an overlay on the last video; rejected because the feed spec
   forbids a layer over the video ("Taps reach the video player"). A swipe past
   the end slide does nothing because it is the last element of the scroller
   (`overscroll-behavior-y: contain` already stops the page).

3. **The 10-second timeout lives in `http-source.ts`.** `getPage` takes
   injected timers and aborts the `fetch` with an `AbortController` when the time
   is up; the abort counts as a failure like any other. It applies to the first
   page and to next pages. Alternative: a timer in `Feed.tsx`; rejected because
   the rule would not be testable without rendering. The 10 s value is
   `(assumed)` and tuned in the manual check.

4. **A failed first page and a failed next page take different paths.**
   First-page failure sets `status: error` (status view); a next-page failure
   keeps `status: ready` and marks the end slide as failed, so the video above
   stays. The silent retry two slides before the end stays: it is the same
   `PageRequests.fail` path, and the end slide shows the failure only when I
   reach it. Retry (first page or end slide) is ignored while its request runs,
   because `PageRequests.begin` already refuses a cursor that is in flight.

5. **Player errors reach the feed through the adapter.** `attachPlayer` passes
   `onError(code)` to the API; `youtube-player.ts` maps 100, 101 and 150 to a
   single "unplayable" signal and ignores other codes. `SlideVideo` forwards it
   to the feed with the video's ID. Neighbours already hold players, so a
   neighbour's error arrives the same way (assumed to fire on load, not only on
   play; confirmed in the manual check). Error 153 stays a bug (the referrer),
   not a skip.

6. **Dropping a slide keeps the watched video on screen.** Slides repeat per
   cycle and the scroll position is a pixel offset, so dropping a slide above
   the active one would show a different video. On every skip the feed finds the
   new index of the active video's key and sets `scrollTop` with no animation,
   only when that index changed, and the feed element sets
   `overflow-anchor: none` so the browser does not adjust too. When the active
   video itself is dropped, its slot is taken by the next video at the same
   `scrollTop`, so nothing scrolls. Alternative: rely on the browser's scroll
   anchoring; rejected because it is not reliable when the anchor node is the one
   removed.

7. **Retry after skips starts over.** Retry on the "Oops" message shown after
   skips clears `skipped`, `visit` and the cursor, and requests the first page;
   the new list starts at its first video, as on a first load. A repeated
   "Oops" is accepted: the first page is cached for up to an hour and can return
   the same broken videos. Retry after a first-page failure is the same
   request.

8. **Test support.** `e2e/support/youtube-fake.ts` gains `emitError(code)` per
   player, and `e2e/support/feed.ts` `stubFeed` gains options for an empty
   catalog, a 5xx answer, a request that never answers, and an offline abort. The
   10-second rule and the counter rules are Vitest tests with injected timers;
   E2E checks only the messages and the screen behavior, with a failing request
   (not a 10-second wait). The real error codes and the 10 s value are a manual
   check on real broken videos (E2E rule 13), served from a local feed page.

No ADR and no C4 change: no new library, service or container; the YouTube
IFrame Player API is already ADR 0008.

## Risks / Trade-offs

- **YouTube's error codes or their timing differ on real videos** → manual check
  on a removed video, a private video and one with embedding off, on desktop and
  a phone; D-20 holds the other codes.
- **Neighbour errors may not fire until the player plays** → the neighbour
  criterion is kept as written until the manual check; if false, the skip waits
  until I reach the video (still silent for the next, then visible for one
  frame), and the criterion is revised.
- **A repeated "Oops" after Retry can look like nothing happened** → accepted:
  the first page is cached for up to an hour (PERF-6).
- **Setting `scrollTop` after a removal can fight the scroll-snap** → it is
  applied only when the active index changed, with no animation; the second
  cycle E2E scenario guards it.
- **A slow request that is aborted could still arrive** → the abort cancels the
  fetch; a late page for a cursor that already failed is ignored.
