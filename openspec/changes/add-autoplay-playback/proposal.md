# Proposal

## Why

The feed shows plain YouTube embeds that nothing controls: a video does not
start by itself, cannot be unmuted from the app, does not loop and does not
pause when it leaves the screen (PRD §5.2, goal G1). REC-003 is validated
(`Flags: —`, `Estimate: 5`, checked 2026-11-23) and is the first story that has
to drive the players. REC-004 (instant transition) and REC-007 (recipe panel
opens after the first play-through) build on the control and the `ended` event
it adds.

## What Changes

- The active video starts playing by itself, muted, unless sound was turned on
  in this browser tab.
- An unmute button, shown whenever the video is muted, turns sound on. Sound
  then applies to every video that becomes active in the same tab (next,
  previous or returning). A reload starts muted again, because the state is kept
  in memory only.
- The button follows the YouTube player's own mute control: muting or unmuting
  there shows or hides the button and sets the tab's sound for later videos.
- If the browser blocks autoplay with sound, the video plays muted and the
  unmute button is shown again.
- A video loops, and the app is told, with the video ID, every time it ends
  (REC-007 counts it).
- A video is paused when it is swiped out of view and plays from the beginning
  when it comes back. A pause the user makes with the player's own control is
  kept, also across hiding and showing the tab. A video the app paused because
  the tab was hidden plays again when the tab is visible.
- The unmute button sits outside the video, at its bottom right, when there is
  room beside the video. On a tall phone screen it is a small transparent icon
  over the video's bottom-right corner, above YouTube's control bar, shown only
  while sound is off.
- Each mounted slide gets its own player, created once. Only the active one
  plays; the neighbours stay paused and muted.
- The app controls the players through the official YouTube IFrame Player API,
  behind one adapter module. ADR 0008 records this decision, and the C4
  level 3 diagram is updated.
- The E2E network guard serves a fake `iframe_api` script, so tests drive the
  player without the production build containing test code.

This change implements **REC-003** only. REC-003 is not flagged
`needs-human-validation` (checked 2026-11-23: `Flags: —`, `Estimate: 5`).

Out of scope (owned by other stories): preloading and the three-player cap
(REC-004); opening the recipe panel on the first `ended` event, and what counts
as a view (REC-007, REC-006); autoplay that fails even when muted, and player
errors (REC-018); the recipe panel's side on wide screens (REC-006); the
< 2 s load target (REC-015). Browsers other than Chrome on Android and desktop
are out of scope for the MVP (PRD §4).

## Capabilities

### New Capabilities
- `playback`: how the active video plays: autoplay, sound state for the tab,
  the unmute control, loop and the `ended` event, and when a video is paused or
  resumed.

### Modified Capabilities
- `feed`: the requirement "Taps reach the video player" gets one exception, the
  small unmute icon on tall screens, so that the rule and the new control agree.

## Impact

- **Code:**
  - a player adapter under `src/lib/player/` (the only code that knows the
    YouTube script's types) and pure logic for sound state, pause reasons and
    the blocked-autoplay fallback, each with Vitest tests;
  - `src/app/feed/Feed.tsx` and `Feed.module.css`: a player per mounted slide,
    the unmute button and its placement, and the `autoplay` entry in the
    iframe's `allow` list;
  - E2E tests under `e2e/playback/` and the fake player script in
    `e2e/support/test.ts`.
- **Dependencies:** none added to `package.json`. The YouTube IFrame Player API
  script is an external script loaded from `youtube.com` at run time (ADR 0008).
- **Systems:** none added. YouTube is already an external system in the C4
  context diagram; level 3 gets a Player controller component that is now
  built.
- **Docs:** ADR 0008 and its index entry; C4 level 3 (`Status` stays
  `Proposed` until the scaffolding matches); the REC-003 Technical context if
  the loop check changes it.
