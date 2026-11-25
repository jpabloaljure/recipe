# Design

## Context

After REC-003 (see `openspec/specs/playback/spec.md`) the feed renders an
iframe only for the active slide and its two neighbours (`inPlayerWindow` in
`src/lib/feed/feed-state.ts`), and `SlideVideo` creates one `YT.Player` per
mounted iframe, whose effect depends only on the video ID. A neighbour's player
is therefore ready, paused and muted before its slide becomes active, and it is
not recreated when it does. The fake `iframe_api` and the `livePlayers` helper
(`e2e/support/`) already exist. What is not known is how fast a paused,
never-started neighbour reaches `playing` on the real player.

## Goals / Non-Goals

**Goals:**
- Prove with tests that the cap of three players and the reuse of the
  neighbour's player hold.
- Measure the real start time of a paused neighbour and record it.

**Non-Goals:**
- Preloading further than one video on each side (PERF-3 is read as next plus
  previous; PRD updated 2026-11-23).
- Warming up the previous neighbour (it has already played, so its data is
  loaded) or a neighbour further away (PERF-5).
- Moving to one reused player (draft D-12, option 3).

## Decisions

### Decision 1: Measure first, then warm up the next video

Task 1 measured, on the real player, the time from `playVideo()` to `playing`
for a paused neighbour (see the answers below): too slow on a phone. A muted
warm-up fixes it (Decision 6). Alternatives considered: relax PERF-3 to about
1.1 s on a mid-range phone (a PRD change that loses the speed goal; kept as the
fallback if the warm-up does not hold in the real app); a bigger window (breaks
PERF-5); one reused player (draft D-12 option 3; does not remove the start-up
cost).

### Decision 2: The reuse rule is tested, not coded

AC2 holds because the player belongs to the iframe, and the iframe is kept
while the slide stays inside the window. The test proves it so a later change
to `SlideVideo` or the window cannot break it silently. Alternative: a
Vitest test of the window rule. It already exists (`inPlayerWindow`); the
risk is in the wiring, which only a browser shows (E2E rule 1).

### Decision 3: A creation serial in the fake player

The fake player records an increasing `serial` when it is created and
`livePlayers` returns it. The reuse test reads the neighbour's serial before
the swipe and the active player's serial after it; they must be equal. The cap
test counts `livePlayers` after the swipe has settled (a fourth player during
the swipe is left to the manual flick check, as the story decided).

### Decision 4: What counts as settled

The tests use the existing swipe helper (`e2e/support/gestures.ts`) and
`expect.poll` on the player count and states; no fixed waits (E2E rule 6).

### Decision 5: No ADR and no C4 change

No external system, container or major component is added, and no accepted ADR
is contradicted, so no ADR and no C4 diagram change is needed.

### Decision 6: Warm up the next video, once, muted and off-screen

When the next slide's player is ready, the controller plays it muted (it never
asks for sound: an unmuted `play()` gives no event on Chrome, see REC-003), waits
for `playing` plus about one second (measured: 32% of the video loaded), then
pauses it and seeks to 0. If `playing` does not come within 4 s it gives up and
pauses, with no error. Only the next video is warmed up: the previous one has
already played. A player is warmed up once in its life. The slide is out of
sight (scroll-snap neighbour), so nothing shows.

### Decision 7: The warm-up is its own pause reason

REC-003's controller treats a pause it did not cause as the home cook's own.
The warm-up pause is the controller's own, as a fourth reason `"warmup"`, so it
is never taken for a user pause and never resumes by itself. While warming up,
`playing` is ignored (it must not count as the video becoming active, as a
second playing video or as a view); the end event cannot come in one second and
is ignored if it does. If the slide becomes the active one, the warm-up is
cancelled and the normal start runs (seek to 0 and play); if it leaves the
window, it is cancelled and the player is paused. The warm-up does not start
while the tab is hidden and is not retried when it becomes visible (the
neighbour then starts cold, as today).

### Decision 8: Existing tests that assume neighbours never play

"Only the active video plays › Neighbour videos are idle" checks the
neighbours' state straight after the player exists, which now can be inside a
warm-up. Its test waits (`expect.poll`) until the neighbours are paused before
checking. REC-003's controller test "at most one player is asked to play"
becomes "at most one player plays for the home cook; a warm-up is separate".

## Risks / Trade-offs

- The warm-up may behave differently in the real app than on the check page
  (the feed destroys and creates iframes as it moves; desktop players stopped
  starting in the check page from a 15 s idle on). Mitigation: task 6 measures
  the real app on both devices, including a neighbour idle for a long time; if
  it fails, the fallback is to relax PERF-3 (Decision 1).
- The warm-up loads about a third of a Short early, once per swipe: some data
  and CPU on a phone. Accepted; REC-015 measures the whole.
- A warm-up on a slow connection can still be running when the home cook swipes
  fast; it is cancelled and the video starts cold (Decision 7).
- The 500 ms target stays a manual check (E2E rule 13, REC-015's launch run),
  so a regression there is not caught by CI.
- The production smoke check never loads the real YouTube script (draft D-14),
  so the real player's behavior is only checked by hand.
- If draft D-12 option 3 is chosen later, the cap and the neighbour reuse
  would change; this change would then be revisited first.

## Open questions

- Resolved 2026-11-24: a paused neighbour is too slow on a phone (answer to
  task 1.1) and a warm-up meets the target there (answer to the warm-up check).
  Still open until task 6: does the warm-up hold in the real app, and does the
  desktop stall after a long idle happen there?

### Answer to task 1.1 (2026-11-24): no

Throwaway page, real YouTube player, neighbour created and muted, left paused
and never started for 3 s, then `playVideo()`; time to the `playing` state:

| Device | Times | Result |
|---|---|---|
| macOS, desktop Chrome 154 | 449, 436, 469, 427, 453 ms | under 500 ms, little margin |
| Android 10, Chrome 138 (mid-range phone, Wi-Fi) | 1334, 1128, 1098, 1127, 1057 ms (1199 ms after 15 s idle) | median 1128 ms, about twice the target |

On desktop the round after a 15 s idle never reached `playing` within 8 s (the
player showed its play button); not understood, to be rerun. The near-constant
time suggests a never-started player does not load video data, so every start
pays the full start-up cost. A paused neighbour on its own does not meet
PERF-3 on a phone. The tests of the cap and the reuse stay valid whatever is
decided.

### Answer to the warm-up check (2026-11-24)

Same page, plus a "warm" neighbour: muted `playVideo()` until `playing`, one
second more, then `pauseVideo()` and `seekTo(0)`, then left paused (3 s or 15 s)
before it becomes active. After the one-second warm-up the player had loaded
32% of the video.

| Device | Cold (never started) | Warmed up |
|---|---|---|
| Android 10, Chrome 138 | 1248, 1078, 1046 ms | 366, 358, 315, 343, 365 ms (also after 15 s idle), none failed |
| macOS, desktop Chrome 154 | 392, 404 ms | 271, 270, 275 ms |

On desktop, from the round with a 15 s idle on, no player reached `playing`
(also the first, cold run's 15 s round), including warmed-up ones that had
started a moment earlier. Not understood: it may be a limit of the test page
(the same video repeated in many iframes), and REC-003's real-app use on the
same Chrome did not show it, but it is not proven. It must be rechecked in the
real app after any change (task 4.1).

A warm-up brings the start under 500 ms on the phone. It needs a spec change:
"Only the active video plays" says neighbours stay paused and muted until they
become active.
