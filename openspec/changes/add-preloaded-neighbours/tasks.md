# Tasks

Scenario names below are the exact ones in `specs/playback/spec.md`; E2E tests
are named `playback › <Requirement> › <Scenario>` and live in `e2e/playback/`
(E2E rules 2 and 4).

## 1. Real-player measurement (first; decides whether code is needed)

- [ ] 1.1 In a throwaway page (not committed), on desktop Chrome and on a real Android phone (human check), create two real players on paused, never-started iframes, activate one (`playVideo()` muted) and record the time to `playing`, several times; write the numbers and the decision in `design.md` Open questions (under 500 ms: continue; over: stop and ask for a new design)

## 2. Fake player support

- [ ] 2.1 Add a creation `serial` to the fake player in `e2e/support/youtube-fake.ts` and to `FakePlayerInfo` in `e2e/support/player.ts`; verify with a test in `e2e/support/support.spec.ts` that two players get different serials and a player keeps its serial

## 3. E2E tests

- [ ] 3.1 Add `e2e/playback/few-players-stay-alive.spec.ts` for "Few players stay alive › Swipe through the feed" (swipe forward and back a few times, then count live players once settled) and "… › First video" (two live players at the start); verify they pass on the three projects with `pnpm test:e2e`
- [ ] 3.2 Add `e2e/playback/the-next-video-starts-from-its-ready-player.spec.ts` for "The next video starts from its ready player › Swipe to the next video" (same serial before and after, and the player is playing); verify it passes on the three projects
- [ ] 3.3 Mark "The next video starts within 500 ms (manual)" as a manual check: record the result on a real mid-range phone in the PR and in REC-015's launch check (reason: performance targets are manual, E2E rule 13)

## 4. Manual check and close-out

- [ ] 4.1 On a real Android phone, flick through at least ten videos and confirm one video per gesture and no more than three players (the check the story reserved for the manual run); record the result in the PR
- [ ] 4.2 At close-out: set REC-004 `Status: done` when AC2 and AC3 have passing E2E tests and the manual results are on record; sync the delta into `openspec/specs/playback/spec.md` and archive the change
