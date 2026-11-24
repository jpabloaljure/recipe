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
- Loading video data for the neighbour through the player API or any other
  preload trick, unless the measurement fails (Open questions).
- Moving to one reused player (draft D-12, option 3).

## Decisions

### Decision 1: Measure first, and only then decide on code

Task 1 measures, on the real player, the time from "this slide becomes active"
to the `playing` state for a paused neighbour, on desktop Chrome and on a real
Android phone, the same way REC-003's task 1.1 measured readiness. If it is
under 500 ms on both, this change adds tests and spec text only. Alternative
considered: build a warm-up now (play the neighbour muted for a moment). Not
chosen: it breaks "neighbours are paused", costs data and CPU, and may not be
needed.

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

## Risks / Trade-offs

- A paused, never-started neighbour may take longer than 500 ms to start on a
  slow phone. Mitigation: Decision 1; the measurement is the first task and its
  result is written in Open questions before any code is added.
- The 500 ms target stays a manual check (E2E rule 13, REC-015's launch run),
  so a regression there is not caught by CI.
- The production smoke check never loads the real YouTube script (draft D-14),
  so the real player's behavior is only checked by hand.
- If draft D-12 option 3 is chosen later, the cap and the neighbour reuse
  would change; this change would then be revisited first.

## Open questions

- Is a paused neighbour's start under 500 ms on the real player? Answered by
  task 1.1; if not, a follow-up design (a larger window is ruled out by PERF-5;
  a muted warm-up conflicts with "paused") is needed and tasks 2 and 3 wait.
