---
id: E01
title: Browse a curated feed with no waiting
prd-goal: G1
---

## REC-001 · Vertical full-screen feed with manual swipe
- **Status:** todo
- **Labels:** module:feed, type:feature, size:M
- **PRD:** 5.1, 5.2
- **Flags:** —
- **AI estimate:** 3
- **Estimate:** 3

As a home cook, I want to swipe through short recipe videos one at a time, so that I can quickly find something to cook today.

### Acceptance criteria
- Given I open the app on a phone in portrait, when the feed loads, then one full-screen vertical video is shown at a time.
- Given a video is active and I do not interact, when it reaches the end, then the feed stays on that video.
- Given a video is active, when I swipe or scroll to another video, then the next or previous video becomes active, exactly one video per gesture.
- Given I am on desktop or on a phone in landscape, when the feed is shown, then the vertical video is centered on the screen.
- Given the last video in the catalog is active, when I swipe to the next video, then the first video of this visit's feed order becomes active.

### Technical context
Built and tested with stub feed data: the real feed comes from REC-002, the real player from REC-003, and the < 2 s load target (PERF-2) is measured only in REC-015. The video's loop playback is owned and tested by REC-003. MVP supports Chrome on Android and desktop; iOS (WebKit, including Chrome on iPhone) is out of scope.
Feed built with CSS scroll-snap (`scroll-snap-type: y mandatory`, `scroll-snap-stop: always`) and native scroll/touch events; no carousel library (AGENTS.md: no new library without approval and an ADR). No overlay above the YouTube iframe (decided after the technical check): swipes over the player reach the feed natively, and taps on the video reach the YouTube player. Tap behavior on the video and the unmute control (an app button outside the iframe) are owned by REC-003. No app-owned "Watch on YouTube" button: the link back to the original (PRD §9) is covered by the YouTube player's own links and the recipe panel's source label (PRD 5.3, REC-006).
Technical check done 2026-11-16 (throwaway prototype, Chrome on Android and desktop): without an overlay, (1) swipes over the video move the feed, (2) the app's own unmute button gets taps and later videos keep sound, and the YouTube player's own links stay tappable, (3) a hard flick moves exactly one video. With a transparent overlay, hard flicks on Android sometimes skipped more than one video, so the overlay was dropped. The prototype had one player at a time; AC3 (one video per gesture) is re-checked with three live players in REC-004 and REC-015.
Swiping back on the first video does nothing (decided; no backward wrap). The end of the catalog is known when the feed API reports no more pages (REC-002). Components: "Feed" and "Player controller" (C4 level 3, web app). ADR 0002.
Recipe panel layout and gestures belong to E02 (REC-006, REC-007). Deep-link start belongs to REC-014. Empty, error and unavailable states belong to REC-018. Future gesture and browser ideas: `draft-backlog-list.md` (D-1 to D-4).

### Estimation notes
M: CSS scroll-snap feed with one video per gesture, wrap-around to the first video across API pages, centered layout on desktop and in landscape, and gesture checks on real devices.
Update after the technical check (2026-11-16): the overlay was dropped; plain scroll-snap passed all checks on Android and desktop Chrome, which removes the main risk.
AI estimate (2026-11-16): 3. Calibration: no stories have a team estimate yet (greenfield), so calibrated against a generic "single scrollable list view with layout rules and stub data" pattern. The technical check already proved the core mechanism (plain scroll-snap, one video per gesture, swipes over the iframe), and the player, real feed data, loop and taps are owned by REC-002/REC-003. Remaining work: the scroll-snap feed component, centered layout on desktop and in landscape, wrap-around from the last video to the first of this visit's order across API pages, and gesture checks on real devices. Risks that would move it to 5: wrap-around jumping from the last to the first video without a visible glitch or a double snap; and (assumed) the Next.js project scaffolding, CI and deploy are set up outside this story; if REC-001 must carry them as the first feature, it is a 5.

## REC-002 · Feed shows only ready videos, newest first with variety
- **Status:** todo
- **Labels:** module:feed, type:feature, size:M
- **PRD:** 6.4, 6.5, API-1, API-2, PERF-6, 9 (videos removed after ingestion)
- **Flags:** needs-human-validation; (assumed) "light shuffling" means a returning user does not see the exact same order as on the previous visit; (assumed) the availability check runs at least daily
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the feed to contain only working, easy recipe videos in a fresh order, so that every video I land on is worth watching.

### Acceptance criteria
- Given videos with statuses ready, needs_recipe, not_easy and unavailable, when the feed is requested, then only `ready` videos are returned, each with its recipe included (API-1).
- Given I reach the end of the loaded videos, when I swipe again, then the next page of ready videos loads and plays.
- Given I return to the app, when the feed loads, then videos are ordered newest first with light shuffling, so the order is not identical to my last visit (API-2).
- Given a video in the catalog was deleted, made private, or is no longer embeddable, when the periodic availability check runs, then its status becomes `unavailable` and it no longer appears in the feed.
- Given a feed response, when it is served, then it is cacheable at the CDN/edge (PERF-6).

### Technical context
The feed response must tell the client when there are no more pages (end of catalog), so REC-001 can wrap to the first video of the visit's order.

### Estimation notes
M: pagination, ordering and status filtering are well-defined.
The availability check adds a recurring job and YouTube API calls.

## REC-003 · Autoplay muted, tap to unmute, loop
- **Status:** todo
- **Labels:** module:playback, type:feature, size:M
- **PRD:** 5.2, 9 (YouTube ToS, autoplay rules)
- **Flags:** needs-human-validation; (assumed) "session" means the current browser tab/visit
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want videos to start playing on their own and keep looping, so that I can follow along without touching the screen.

### Acceptance criteria
- Given a video becomes the active one, when it is shown, then it starts playing automatically and muted.
- Given a video is playing muted, when I tap unmute once, then it plays with sound and every later video in the session also plays with sound.
- Given a video is playing, when it reaches the end, then it restarts automatically.
- Given a video is playing, when I swipe it out of view, then it is paused.
- Given any video in the feed, when it plays, then it plays inside the official YouTube embedded player and is never downloaded or re-hosted.

### Technical context
—

### Estimation notes
M: behavior is clear, but the official embedded player limits customization (§9).
Browser autoplay rules need testing across mobile browsers.

## REC-004 · Instant transition to the next video
- **Status:** todo
- **Labels:** module:playback, type:feature, size:L
- **PRD:** PERF-3, PERF-5
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the next video to start almost instantly when I swipe, so that browsing never feels slow.

### Acceptance criteria
- Given a video is active, when I swipe to the next one, then it starts playing in < 500 ms (PERF-3).
- Given a video is active, when the feed is idle, then the next 1–2 videos and their recipes are already preloaded.
- Given I keep swiping through many videos, when I check the page, then at most three video players (previous, current, next) are alive at once (PERF-5).

### Technical context
—

### Estimation notes
L: tight latency target combined with a hard cap on live players.
Highest technical risk in E01; validated on device by REC-015.

## REC-005 · Daily discovery of new candidate videos
- **Status:** todo
- **Labels:** module:ingestion, type:feature, size:L
- **PRD:** 6.1, ING-1, ING-2, ING-3, ING-4, 9 (API quota), 12 (seed channels)
- **Flags:** needs-human-validation; (assumed) seed channels and search queries will be provided before build (open decision)
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want new easy recipes to show up in the feed regularly, so that there is always something new to cook.

### Acceptance criteria
- Given the daily schedule, when the discovery job runs, then it finds new candidate videos from the configured search queries and/or seed channels (ING-1).
- Given a discovered video longer than 3 minutes, not embeddable, or not in English, when it is evaluated, then it is not kept as a candidate (ING-2).
- Given a video ID that is already in the database, when it is discovered again, then it is skipped (ING-3).
- Given launch day, when the catalog is checked, then about 50 videos are in `ready` status (ING-4).

### Technical context
—

### Estimation notes
L: YouTube API quota (search calls are expensive) shapes the whole job.
Depends on the open decision about seed channels and queries.

## REC-018 · Feed handles empty, error and unavailable states
- **Status:** todo
- **Labels:** module:feed, type:feature, size:M
- **PRD:** 5.1, 6.4, 9 (videos removed after ingestion)
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the feed to tell me when there is nothing to show or something failed, and to skip broken videos, so that I am never stuck on a blank or broken screen.

### Acceptance criteria
- Given there are no ready videos, when the feed loads, then an empty-feed message is shown.
- Given the feed request fails, when the feed loads, then an "Oops, something went wrong" message is shown.
- Given I am offline, when the feed loads, then an "Oops, something went wrong" message is shown.
- Given the active video was removed or is no longer embeddable, when it fails to load in the player, then the next video loads automatically.

### Technical context
Split from REC-001 during its validation (findings #4 and #6). Relies on the YouTube IFrame Player error event to detect removed videos; the periodic availability check (REC-002) removes them from the feed later.

### Estimation notes
M: three simple messages, plus skipping a video on a player error.
The player error event's timing and reliability is the main unknown.
