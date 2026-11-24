# Tasks

Scenario names below are the exact ones in `specs/playback/spec.md` and
`specs/feed/spec.md`; E2E tests are named `<capability> › <Requirement> ›
<Scenario>` and live in `e2e/playback/` (E2E rules 2 and 4).

## 1. Real-player check (first; picks the loop mode)

- [x] 1.1 In a throwaway page (not committed), load the real IFrame API on desktop Chrome and attach `new YT.Player` to an iframe that already has `enablejsapi=1`, both right after the iframe is inserted and after its `load` event; verify the player becomes ready in both cases and record which was needed in `design.md` Decision 2
- [ ] 1.2 On desktop Chrome and on Android Chrome (human check), play a Short in loop mode (`loop=1&playlist=<id>`) and in seek mode; verify whether loop mode reports an end every time, how long the gap is in seek mode and whether YouTube's end screen flashes, then write the chosen mode in `design.md` Decision 5
- [ ] 1.3 On the same two browsers, ask for sound before any tap and verify how a refused unmute shows (the player pauses, or stays muted) and whether the 0.8 s window is long enough on a slow connection; write the value in `design.md` Decision 4

## 2. ADR 0008 and architecture records

- [x] 2.1 Write ADR 0008, "YouTube IFrame Player API for playback control", with the `write-adr` skill (alternatives: raw `postMessage`, a wrapper library, URL parameters only), add it to the ADR index in `docs/adr/README.md` and verify the index links resolve
- [x] 2.2 Update `docs/architecture/c4/03-components-web-app.md`: the Player controller is built for autoplay, unmute, loop and pause (preload stays REC-004), and the relation to the YouTube IFrame Player says it is controlled through the API; verify the Mermaid diagram renders and the Notes name this change
- [ ] 2.3 Add the ADR to the "Stack" note in `AGENTS.md` only if the loaded script counts as a service there; verify with the human, and make no change otherwise (`AGENTS.md` lists ADRs 0002-0004, 0006 and 0007 for the stack)

## 3. Playback logic (Vitest, no browser)

- [x] 3.1 Add `src/lib/player/types.ts` with the player interface and states, and `src/lib/player/playback.ts` with the controller (player, timer and `onEnded` injected); verify `pnpm typecheck` passes
- [x] 3.2 Add tests for sound and activation in `playback.test.ts`: an active video plays muted when sound is off, plays with sound when it is on, a swiped-away video is paused, and coming back seeks to 0 and plays; verify `pnpm test` passes
- [x] 3.3 Add tests for the blocked-autoplay fallback with a fake timer: after the unmute, a drop to `paused`, or a player still muted or not playing at the end of the window, mutes, plays and clears the sound state; `buffering` is not a block; verify `pnpm test` passes
- [x] 3.4 Add tests for pause reasons: a pause the controller did not cause is the user's and survives hide and show, a `"hidden"` pause resumes on visible, and a `"swipe"` pause does not; verify `pnpm test` passes
- [x] 3.5 Add tests for the `ended` contract in both modes (report on every end, including each loop; seek mode also seeks to 0 and plays), that commands sent before ready are applied once on ready, and that at most one player is asked to play; verify `pnpm test` passes
- [x] 3.6 Add `src/lib/player/youtube-player.ts`: the script loader (one `<script>`, one ready promise) and the `YT.Player` wrapper that maps API states to the player interface; verify `pnpm typecheck` passes and a Vitest test covers the state mapping with a fake `YT`

## 4. E2E fake player

- [x] 4.1 Add the fake `iframe_api` script and its helper `e2e/support/player.ts` (`emitEnded`, `emitUserPause`, `blockUnmutedAutoplay`, `hideTab`, `showTab`, reading player state and calls); serve the script from the guard in `e2e/support/test.ts` for `https://www.youtube.com/iframe_api`; verify with a test in `e2e/support/support.spec.ts` that the guard serves it and that no other outside request is allowed
- [x] 4.2 Update `e2e/support/feed.ts` only if `openFeed` needs to wait for the fake player to be ready; verify the existing `e2e/feed/` tests still pass with `pnpm test:e2e`

## 5. Feed wiring and playback E2E tests

- [x] 5.1 In `src/app/feed/Feed.tsx`, add `enablejsapi=1`, `origin` and `autoplay` in `allow`, create one player per mounted iframe keyed by slide key, and play only the active one; verify the E2E tests for "Autoplay muted › A video becomes active with sound off" and "Only the active video plays › Neighbour videos are idle" pass on the three projects
- [x] 5.2 Add the unmute button (accessible name, shown only while sound is off) and the in-memory sound state; verify the E2E tests for "Unmute button › Tap the unmute button", "Sound carries over in this tab › Another video becomes active after turning sound on" and "… › Reload after turning sound on" pass
- [x] 5.3 Wire the blocked-autoplay fallback; verify the E2E test for "Blocked unmuted autoplay falls back to muted › Browser blocks unmuted autoplay" passes using `blockUnmutedAutoplay()`
- [x] 5.4 Wire loop, seek mode (design Decision 5) and the bubbling `videoended` event on the feed element; verify the E2E test for "Loop and end event › Video reaches the end" passes
- [x] 5.5 Wire pause and resume on swipe, user pause and tab visibility; verify the E2E tests for "Pause when swiped out of view" (both scenarios), "A pause made with the player's own control is kept" (both scenarios) and "Pause when the tab is hidden" (both scenarios) pass
- [x] 5.6 Verify the existing `e2e/feed/` tests (including "Taps reach the video player") still pass, and note any that the new per-slide players change

## 6. Unmute button placement and the feed exception

- [x] 6.1 In `Feed.module.css`, place the button by the viewport's aspect ratio: outside the video at its bottom right when there is room, otherwise a transparent icon over the corner above YouTube's control bar; set the threshold on `phone-portrait`, `phone-landscape`, `desktop` and a tablet-shaped window, and write it in `design.md` Decision 6; verify the E2E tests for "Unmute button placement › Wide screen" (`onlyOn` desktop and phone-landscape) and "… › Tall phone screen" (`onlyOn` phone-portrait) pass
- [x] 6.2 Add the E2E test for "Taps reach the video player › Swipe that starts on the unmute icon" (`onlyOn` phone-portrait, synthesized swipe); verify it passes
- [x] 6.3 Verify the modified `feed` spec reads correctly with `openspec validate add-autoplay-playback --strict`

## 7. Integration and manual checks

- [x] 7.1 Run `pnpm typecheck`, `pnpm test`, `pnpm build` and `pnpm test:e2e`; verify all pass, then run `openspec validate add-autoplay-playback --strict`
- [ ] 7.2 Manual checks on the real player, in Chrome on desktop and on Android, listed in the PR and done before merge: real autoplay and sound carry-over, the real loop and end screen, YouTube's own pause control (the user's pause is kept and survives hiding the tab), blocked unmuted autoplay, the unmute icon on a real phone covers no YouTube control or logo, and a real swipe that starts on the icon moves one video; these stay manual because the E2E fake cannot show them (E2E rule 13)
- [x] 7.3 Update REC-003's Technical context in `backlog/E01-browse-feed.md` if the loop mode, the window or the placement threshold differs from the story; verify it matches `design.md`, and check the README and PRD §5.2 still agree with the built behavior

## Workflow follow-up

- Open the PR with the template, run the AI review (`/code-review --comment <PR#>`), and merge when CI is green.
- After the production smoke check is green, archive the change (`openspec-archive-change`), sync `playback` and the modified `feed` requirement to `openspec/specs/`, and set REC-003 to `Status: done` once it meets the Definition of Done.
