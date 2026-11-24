# 0008. YouTube IFrame Player API for playback control

- **Status:** Accepted
- **Date:** 2026-11-23
- **Deciders:** Project owner

## Context

The feed shows each video in a plain YouTube embed (`add-vertical-swipe-feed`,
REC-001), and nothing controls it. REC-003 (PRD §5.2) needs the app to start
the active video muted, unmute it, loop it, pause it when it leaves the screen
or the tab is hidden, and tell it apart from a pause made by the home cook.
REC-007 needs to know each time a video ends, and REC-004 needs paused,
preloaded neighbours.

Every video must play inside the official YouTube embedded player and is never
downloaded or re-hosted (PRD §9). `AGENTS.md` allows no new library or service
without human approval and an ADR. C4 level 3 already plans a "Player
controller" component that uses the IFrame API, but no decision recorded it.

On 2026-11-23, against the real player in Chromium (the REC-003 check, task
1.1 and 1.2 of the change):
- the API can be attached to an iframe that React already rendered, right after
  it is inserted or after its `load` event;
- the embed's own loop mode (`loop=1&playlist=<id>`) never reported an `ended`
  state, while a plain embed does, and the app can restart it by seeking to 0.

## Decision

We will control the players with the official YouTube IFrame Player API,
loaded from `https://www.youtube.com/iframe_api` as an external script, behind
one adapter module (`src/lib/player/`) that is the only code that knows the
script's global. Each iframe the feed renders has `enablejsapi=1` and the
`origin` of the page, and a player is attached to it when it mounts.

No npm dependency is added. In end-to-end tests the network guard serves a fake
`iframe_api` script, so the production build contains no test code.

## Alternatives

- **Raw `postMessage` to a plain embed with `enablejsapi=1`:** no script in
  the page, but the message format is the API's internal one and is not
  documented. A change by YouTube would silently stop autoplay, and its terms
  assume the API client.
- **A wrapper library such as `react-youtube`:** needs an npm dependency, human
  approval and an ADR, and still loads the same script. The adapter is about
  100 lines.
- **URL parameters only (`autoplay`, `mute`, `loop`):** gives no `ended` event,
  no pause when the tab is hidden, and no way to tell the user's pause from the
  app's, so REC-003 and REC-007 cannot be met.

## Consequences

- **Positive:** the supported, documented way to control the player; one
  adapter hides the script from the rest of the app and from tests; REC-004
  (preload) and REC-007 (`ended`) build on the same object; the app never
  touches the video stream (PRD §9).
- **Negative:** a third-party script runs on the page and loads from
  `youtube.com`, not `youtube-nocookie.com`, which is one more request before a
  video can be controlled (PERF-2). The E2E fake can drift from the real API, so
  real-player checks stay manual (AGENTS.md E2E rule 13).
- **Risk:** if the script fails to load, the iframes stay plain embeds and the
  feed still scrolls; reporting that failure belongs to REC-018.

## Links

- Change: [`add-autoplay-playback`](../../openspec/changes/archive/2026-11-24-add-autoplay-playback/design.md)
- Story: REC-003 in [`backlog/E01-browse-feed.md`](../../backlog/E01-browse-feed.md)
- C4: [Level 3: web app components](../architecture/c4/03-components-web-app.md)
  (the Player controller and its relation to the YouTube player); levels 1 and 2
  already show the YouTube IFrame Player and need no change
- PRD: §5.2, §9
- Related ADRs: [0002](0002-nextjs-on-vercel.md), [0006](0006-playwright-end-to-end-tests.md)
