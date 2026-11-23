# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-23:

- `src/app/feed/Feed.tsx` renders one `<section>` per slide and, only for the
  active slide and its two neighbours (`inPlayerWindow`), a plain
  `<iframe src="https://www.youtube-nocookie.com/embed/<id>?playsinline=1&rel=0">`
  whose `allow` list has no `autoplay`. Nothing controls the players. Slide keys
  are `<cycle>-<videoId>` (`src/lib/feed/feed-state.ts`).
- The feed spec forbids any layer above the video that catches taps
  (REC-001's Android check: an overlay over the whole video made hard flicks
  skip videos).
- Vitest runs `src/**/*.test.ts` in Node (no DOM). E2E (ADR 0006): the network
  guard in `e2e/support/test.ts` answers any YouTube document with a local stub
  page and any other YouTube request with `204`; `openFeed` waits for that stub
  inside the active iframe.
- C4 level 3 already plans a "Player controller" (React + IFrame API). No ADR
  covers the YouTube IFrame Player API, an external script loaded from
  `youtube.com`.
- `next.config.ts` sets no Content-Security-Policy, so the script is not blocked.
- REC-003's story (validated 2026-11-23) fixes the criteria and these
  decisions: session = the tab, in memory; one-way unmute button; loop mode
  first with a seek fallback; blocked muted autoplay is REC-018's.

## Goals / Non-Goals

**Goals:**
- Drive the players with the official API while React keeps owning the DOM.
- Keep every rule that is not "talk to YouTube" (sound state, pause reasons,
  the blocked-autoplay fallback, the ended contract) in plain TypeScript that
  Vitest can test without a browser.
- Test playback in E2E with no test code in the production build.

**Non-Goals:**
- Preloading and measuring the three-player cap (REC-004).
- Opening the recipe panel on `ended`, and counting a "view" (REC-006, REC-007).
- Autoplay that fails even when muted, and player errors (REC-018).
- Detecting that the user unmuted with YouTube's own controls (the player has
  no volume-change event; the app button stays visible, `(inferred)`).

## Decisions

### 1. The official YouTube IFrame Player API, behind one adapter

The app loads `https://www.youtube.com/iframe_api` once and controls each
player through `YT.Player`. Only `src/lib/player/youtube-player.ts` knows the
script's global and types; everything else uses a small interface (`play`,
`pause`, `mute`, `unMute`, `seekTo(0)`, state and ended callbacks). The decision
is recorded in **ADR 0008** (written with `write-adr`).

Alternatives:
- **Raw `postMessage` to a plain embed with `enablejsapi=1`:** no script in the
  page, but the message format is undocumented, so a YouTube change would
  silently stop autoplay.
- **A wrapper library such as `react-youtube`:** adds an npm dependency (needs
  approval and an ADR) for about 100 lines we would write anyway.
- **URL parameters only:** no `ended` event, no pause when the tab is hidden and
  no way to tell the user's pause from the app's, so it cannot meet the story.

### 2. Attach the player to the iframe React already renders

The iframe URL gets `enablejsapi=1&origin=<window.location.origin>` and the
`allow` list gets `autoplay`. When the iframe mounts, the adapter calls
`new YT.Player(iframeElement, { events })` on it; the API does not replace an
existing iframe. React keeps owning the DOM, and the existing E2E helpers (which
look for the stub page inside the iframe) keep working. The `origin` is read on
the client; the feed renders no iframe on the server because slides exist only
after the first page arrives.

Alternative: let the API create the iframe from an empty `<div>`. That moves
iframe creation out of React and breaks `openFeed`'s wait.

### 3. One player per mounted iframe, created once

A player is created when its iframe mounts and destroyed when the iframe
unmounts (the slide leaves the +-1 window), keyed by the slide key so a re-render
never recreates it. A new player starts paused and muted. When a slide becomes
active its player plays; when it stops being active it is paused. Commands sent
before a player reports ready are kept as the latest intent and applied on
ready. A Vitest test checks that no more than one player is ever asked to play.

Alternative: create a player only for the active slide. That adds a visible
delay on every swipe (attach, then wait for ready) and REC-004 would have to
rework it.

### 4. Rules as plain TypeScript with injected player and clock

`src/lib/player/playback.ts` holds a controller that takes the player interface,
a timer and an event callback, so Vitest runs it with fakes:

```
 Feed (active index, soundOn, tab visible)
        |
        v
 playback controller (pure rules)  --calls-->  player interface
   - sound state per tab                        ^   |  state / ended events
   - pause reasons: "swipe" | "hidden" | user   |   v
   - blocked-autoplay fallback (timer)      youtube-player.ts (YT.Player)
   - ended contract                         or the E2E fake
```

**Sound.** Sound state is `soundOn`, React state in the feed, set only by the
unmute button. It starts `false` on every page load, which gives "a reload
starts muted" with no storage. It applies to every newly active video, next,
previous or returning.

**Blocked unmuted autoplay.** With `soundOn`, the controller unmutes and plays.
If the player does not report `playing` or `buffering` within a short window
(1.5 s to start; tuned in the manual check, `(assumed)`), or drops back to
`paused`, it mutes, plays and shows the button again by setting `soundOn` back
to `false`. `buffering` counts as started, so a slow network is not taken for a
block. The timer is injected, so no test sleeps (E2E rule 6).

**Who paused.** Before the controller pauses a video it marks the pause as its
own, `"swipe"` or `"hidden"`. A `paused` event with no mark is the user's. On
`visibilitychange` to visible, only a video the controller paused for `"hidden"`
plays again; a user's pause stays. Becoming active again clears the mark, seeks
to 0 and plays.

### 5. Loop and `ended`: one contract, two modes

The controller reports `onEnded(youtubeId)` on every end, including each loop.
Two modes sit behind it:
- **loop:** the embed URL has `loop=1&playlist=<id>`, and the controller forwards
  the player's `ended` state if it arrives;
- **seek:** no loop parameter; on `ended` the controller reports it, seeks to 0
  and plays.

Task 1 is a manual check in real Chrome on Android and desktop: does loop mode
report each end, and how long is the gap in seek mode? The result picks the
mode and is written here. Nothing outside the controller depends on it.

How the feed tells the app: the feed element dispatches a bubbling
`CustomEvent("videoended", { detail: { youtubeId } })`. REC-007 can listen to it
or replace it with a prop; no consumer exists in this change. A DOM event is
used because an E2E test can observe it and a Vitest test can check the
callback. Alternative: a React prop only, which no E2E test could observe.

### 6. The unmute button and its placement

The button is a `<button>` outside the iframe, inside the frame container, shown
only while `soundOn` is `false`; it has an accessible name ("Turn sound on").
Its place is CSS only, switched by the viewport's aspect ratio, not by device
type:
- **room beside the video** (desktop, phone landscape): outside the video, at its
  bottom right;
- **no room** (tall phone): a transparent icon over the video's bottom-right
  corner, raised above YouTube's control bar, with a small hit area.

The aspect-ratio threshold (about 3/4) is set and checked on the three E2E
projects and on a tablet-shaped window in task 6 (`(assumed)`). The feed spec's
"Taps reach the video player" requirement gets the narrow exception for this
icon (specs/feed). A swipe that starts on the icon is not handled by the icon,
so it scrolls the feed; this is checked in E2E and, on a real phone, manually.

Alternatives: a strip below the video (shrinks the video), a fixed top bar
(costs height on every screen and designs ahead for favorites and share), or a
button over the corner on every screen (covers YouTube's controls where there
is room to avoid it).

### 7. E2E: a fake `iframe_api` served by the network guard

The guard in `e2e/support/test.ts` answers `GET https://www.youtube.com/iframe_api`
with a script that defines a fake `YT` (`Player`, `PlayerState`). The fake
records every call, moves between `unstarted`, `playing`, `paused`, `buffering`
and `ended` as a player would, and registers each instance in
`window.__youTubeFake`. A helper in `e2e/support/player.ts` reads it and drives
it from tests: `emitEnded(youtubeId)`, `emitUserPause(youtubeId)` and
`blockUnmutedAutoplay()` (a flag that stops `playVideo` after `unMute`). Tests
wait with `expect.poll` or auto-waiting assertions; there are no fixed waits.
The production build contains no test code, and the production smoke check still
runs against the real script.

Alternatives: a test hook in the app (test code in production), or a separate
test build (E2E would no longer test the production build, E2E rule 11). The fake
can drift from the real API; the manual checks against the real player in Chrome
(E2E rule 13) are the defense.

## Risks / Trade-offs

- [The IFrame API script is a third-party script on the page, and loads from
  `youtube.com`, not `youtube-nocookie.com`] -> It is the supported way to
  control the player (ADR 0008). If it fails to load, the iframes stay plain
  embeds and the feed still scrolls; reporting that is REC-018.
- [Loop mode may not report each end] -> The seek mode is built behind the same
  contract; task 1 picks the mode before the rest of the playback tasks are
  closed. A short gap before the restart is accepted in seek mode.
- [The blocked-autoplay window wrongly mutes a slow video] -> `buffering`
  counts as started; the window is tuned in the manual check.
- [The fake player drifts from the real one] -> Manual checks on the real
  player: real autoplay, loop and end screen, the player's own pause, blocked
  unmuted autoplay, and the icon on a real phone.
- [The icon overlaps a YouTube control or logo] -> It sits above the control bar;
  a manual check on Android confirms it. YouTube's rules on covering player
  parts are not read here and are `(inferred)` to allow a small icon above the
  bar; re-check them before launch.
- [Creating a player on an iframe that has not finished loading] -> `(assumed)`
  the API handles it; task 1 confirms it.

## Migration Plan

No data or API change. The change ships with the next deploy; roll back by
reverting it. The production smoke check keeps passing on a deploy because it
does not depend on playback.

## Open Questions

- Loop mode or seek mode, and the length of the blocked-autoplay window: answered
  by task 1 and recorded in Decisions 4 and 5. Either answer leaves the specs,
  the approach and the task list unchanged.
