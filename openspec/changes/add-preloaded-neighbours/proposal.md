# Proposal

## Why

PERF-3 asks for the next video to start in under 500 ms after a swipe, and
PERF-5 caps the live players at three (previous, current, next). REC-003
already gives every mounted slide its own paused, muted player, and the feed
already mounts only the active slide and its two neighbours, so most of this
behavior exists but nothing proves it, and the 500 ms start has never been
measured on a real player. REC-004 is validated (`Flags: —`, `Estimate: 3`,
checked 2026-11-24) and REC-003, which it depended on, is done.

## What Changes

- Add two requirements to the `playback` capability that state the behavior
  as testable rules: at most three players are alive once a swipe settles, and
  the video I swipe to is played by the player its slide already had as a
  neighbour.
- Add a manual scenario for the 500 ms start (E2E rule 13: performance
  targets stay manual).
- Measure, before anything else, how fast a paused, never-started neighbour
  starts on the real YouTube player (desktop Chrome and a real Android phone).
  The result decides whether code changes are needed at all.
- Add E2E tests for the two automatable scenarios, with a small addition to
  the fake player so a test can tell whether a player is the same instance
  before and after a swipe.
- No production code change is planned unless the measurement fails (see
  design.md, Open questions).

This change implements **REC-004** only. REC-004 is not flagged
`needs-human-validation` (checked 2026-11-24: `Flags: —`, `Estimate: 3`).

Out of scope (owned by other stories): player errors, slow or offline loads
(REC-018); the real-device performance run across the whole feed (REC-015);
whether sound carries across videos on Chrome and any move to one reused
player (draft backlog D-12, option 3). Recipes are not preloaded here: they
arrive with the feed (PERF-4).

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `playback`: adds "Few players stay alive" and "The next video starts from
  its ready player".
