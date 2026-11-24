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
  decisions: session = the tab, in memory; unmute button (one-way; it follows
  the player's own mute control since 2026-11-23); loop mode
  first with a seek fallback (the real-player check chose seek, Decision 5);
  blocked muted autoplay is REC-018's.

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

`player.destroy()` removes the iframe from the page (checked against the real
API on 2026-11-23), so the player is destroyed only when its iframe is already
out of the document: on a real unmount, not in React's development double mount.

Checked on 2026-11-23 against the real player (task 1.1, built-in browser,
Chromium 156): attaching right after the iframe is inserted and attaching after
its `load` event both reach ready (579 ms and 256 ms). So the adapter attaches
on mount, with no wait for `load`.

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

**Sound and blocked unmuted autoplay.** Every video starts muted and plays at
once. With `soundOn`, the controller unmutes it as soon as the player reports
`playing`, then gives the browser a short window (0.8 s) to refuse: a `paused`
event, or a player that is still muted or no longer playing at the end of the
window, means the sound was refused. The video then plays muted, `soundOn` goes
back to `false` and the button returns (`onSoundBlocked`). The first version asked for
sound in the first `play()`; measured on real Chrome on 2026-11-23, that start
stalled with no player event, so the video appeared only after the whole 1.5 s
window and then without sound. Starting muted shows the video after about
0.5 to 0.75 s (the stream start). The feed repeats its request, so the controller
acts only when the slide or the sound changes. The timer is injected, so no
test sleeps (E2E rule 6). The check page agrees on real Chrome (desktop 154, Android 10 Chrome 138):
an unmuted `play()` with no tap produced no player event at all, not even
`buffering`, so a refused unmuted start can only be told by waiting.

**Following the player's own mute control.** The IFrame API has no event for a
mute or unmute made with YouTube's own control, so the controller reads
`isMuted()` of the active player every 300 ms and, when it differs from the sound
state the feed believes, calls `onSoundChanged`. The feed sets `soundOn` to match,
which shows or hides the button and carries the choice to later videos. The read
is skipped while the controller is changing the sound itself (the pending unmute
and its check) and while the video is neither playing nor paused by the home
cook. Added after real use showed the button staying visible after unmuting with
the player's control. Alternative: keep the button one-way and leave the player's
control out of sync, which the home cook saw as a bug.

**Who paused.** Before the controller pauses a video it marks the pause as its
own, `"swipe"` or `"hidden"`. A `paused` event with no mark is the user's. On
`visibilitychange` to visible, only a video the controller paused for `"hidden"`
plays again; a user's pause stays. Becoming active again clears the mark, seeks
to 0 and plays.

### 5. Loop and `ended`: seek mode

The controller reports `onEnded(youtubeId)` on every end, including each loop.
Two modes were possible behind that contract:
- **loop:** the embed URL has `loop=1&playlist=<id>`, and the controller forwards
  the player's `ended` state if it arrives;
- **seek:** no loop parameter; on `ended` the controller reports it, seeks to 0
  and plays.

**Chosen: seek.** Checked on 2026-11-23 against the real player (desktop part
of task 1.2, built-in browser, Chromium 156): with the video seeked 2 s before its end, loop
mode never reported `ended` (the state stayed `playing`), so it cannot meet the
contract; seek mode reported `ended`, and the player was `playing` again 28 ms
later (the visible gap on a real device is still a manual check). Only seek mode
is built, and the embed URL has no loop parameter. Confirmed on real Chrome the
same day: desktop Chrome 154 and Android 10 Chrome 138 both showed loop mode never
reporting `ended` and seek mode reporting it, with 5 ms (desktop) and 57 ms
(Android) between the `ended` and `playing` events. On both, the restart looked
smooth: no freeze, black frame or YouTube end screen was seen.

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

Both sit 5 px above the top of YouTube's own control area, measured on the real
embed on 2026-11-23: that area is about 120 px tall on a 450x800 player (outside
layout, `bottom: 125px`) and about 115 px tall on an emulated 375x812 phone. On
the owner's real Android phone the overlay needed 10 px more than the emulation
gave, so it is `bottom: 130px`; its top edge is the fullscreen button. If YouTube
changes its controls, the two numbers in `Feed.module.css` are the ones to
re-measure, on a real phone.

The threshold is `max-aspect-ratio: 3/4`: at 3/4 or narrower the icon goes over
the corner, which always fits; wider leaves at least about 75 px beside the
video at 800 px of height. Checked on 412x915, 768x1024, 800x1000, 600x800,
820x1180, 1024x768, 1280x800 and 915x412 (task 6.1): the button was always on
screen, outside the video above 3/4 and over the corner at or below it. A window
shorter than about 630 px with an aspect ratio just above 3/4 leaves less room
than the button needs, an accepted edge case. The feed spec's
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
- [The unmute is refused after the video appears] -> The window is short and
  the fallback leaves the video playing muted with the button back; the length is
  tuned in the manual check.
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
