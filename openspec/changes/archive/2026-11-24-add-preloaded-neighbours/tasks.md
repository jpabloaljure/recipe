# Tasks

Scenario names below are the exact ones in `specs/playback/spec.md`; E2E tests
are named `playback › <Requirement> › <Scenario>` and live in `e2e/playback/`
(E2E rules 2 and 4).

## 1. Real-player measurements (done; they decided the design)

- [x] 1.1 In a throwaway page (not committed), on desktop Chrome and on a real Android phone (human check), time a paused, never-started neighbour from `playVideo()` to `playing` (answered 2026-11-24: desktop 427-469 ms, Android 1057-1334 ms; a new design was needed, see design.md)
- [x] 1.2 On the same two browsers, time a neighbour that played muted for one second and was then paused and seeked to 0 (answered 2026-11-24: desktop about 270 ms, Android 315-366 ms; design Decision 6)

## 2. Fake player support

- [x] 2.1 Add a creation `serial` to the fake player in `e2e/support/youtube-fake.ts` and to `FakePlayerInfo` in `e2e/support/player.ts`; verify with a test in `e2e/support/support.spec.ts` that two players get different serials and a player keeps its serial

## 3. E2E tests of the cap and the reuse (done)

- [x] 3.1 Add `e2e/playback/few-players-stay-alive.spec.ts` for "Few players stay alive › Swipe through the feed" and "… › First video"; verify they pass on the three projects with `pnpm test:e2e`
- [x] 3.2 Add `e2e/playback/the-next-video-starts-from-its-ready-player.spec.ts` for "The next video starts from its ready player › Swipe to the next video"; verify it passes on the three projects

## 4. Warm-up logic (Vitest, no browser)

- [x] 4.1 In `src/lib/player/playback.ts` add the warm-up to the controller (design Decisions 6 and 7): a `warmUp()` that plays muted, waits for `playing` plus about one second, then pauses and seeks to 0, gives up after 4 s, runs once per player and never while the tab is hidden, with its own pause reason `"warmup"`; verify `pnpm typecheck` passes
- [x] 4.2 Add tests in `playback.test.ts`: the warm-up plays muted and then pauses at 0; it gives up after 4 s without `playing`; it runs once; it does not run while hidden; a `playing` or `ended` event during it is not reported to the app; a warm-up pause is not a user pause; becoming active during it cancels it and runs the normal start; leaving the window cancels it and pauses; verify `pnpm test` passes
- [x] 4.3 Update the REC-003 test "at most one player is asked to play" so it excludes a warm-up (design Decision 8); verify `pnpm test` passes (the existing test never calls `warmUp()`, so it needed no change; the warm-up groups in `playback.test.ts` cover the separation)

## 5. Feed wiring and E2E tests of the warm-up

- [x] 5.1 In `src/app/feed/Feed.tsx` ask the next slide's controller to warm up once its player is ready and the active slide is playing; verify the E2E test for "Only the active video plays › The next video is warmed up" passes on the three projects
- [x] 5.2 Update the E2E test "Only the active video plays › Neighbour videos are idle" to wait (`expect.poll`) until the neighbours are paused (design Decision 8); verify it passes on the three projects
- [x] 5.3 Add the E2E test for "Only the active video plays › No warm-up in a hidden tab" with `hideTab`; verify it passes
- [x] 5.4 Verify the existing `e2e/playback/` and `e2e/feed/` tests still pass with `pnpm test:e2e`

## 6. Manual checks in the real app (human)

- [x] 6.1 "The next video starts within 500 ms (manual)": on desktop Chrome and a real mid-range Android phone, on the Vercel preview, swipe through at least ten videos, also after leaving a video playing for 30 s or more, and record how long each takes to play; if it is not under 500 ms on the phone, or the desktop stall after a long idle shows up, stop and decide (relax PERF-3, design Decision 1); record the result in the PR and in REC-015's launch check (there is no on-screen timer in the app: judge the start by eye on the phone, and with the desktop DevTools Performance panel if a number is needed; an `?debug` log like D-12's would give numbers and is not part of this change) (checked by the owner on the Vercel preview of PR #76 on 2026-11-24: "looks good", by eye; no timings were taken, no problems reported; recorded in the PR and in REC-015 as "checked by eye, no numbers")
- [x] 6.2 On the phone, flick through at least ten videos and confirm one video per gesture, no more than three players, and no sound from a warm-up; record the result in the PR (checked by the owner on the Vercel preview of PR #76 on 2026-11-24: "looks good", by eye; no timings recorded, no problems reported)

## 7. Close-out

- [x] 7.1 Set REC-004 `Status: done` when the E2E tests pass and the manual results are on record; sync the delta into `openspec/specs/playback/spec.md` and archive the change
