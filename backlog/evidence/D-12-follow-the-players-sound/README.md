# D-12 evidence: the unmute button following YouTube's own sound control, and sound across videos

Everything learned while building and testing this during REC-003 (2026-11-23 and
2026-11-24), kept so the work can be picked up later. The code was **rolled back**
from the REC-003 pull request on 2026-11-24 and is kept under the git tag
`archive/rec-003-follow-player-sound` (commit `d79f526`).

## The request

From the owner, while testing REC-003 on the Vercel preview, in Chrome:

> when I hit the unmute on the YouTube player our own unmute still [shows]: can we
> hide it when the video is unmuted and show it when it is muted, always?

Our unmute button (REC-003) was one-way: it showed while sound was off, and
tapping it turned sound on. Unmuting or muting with YouTube's own control left it
out of sync. The story's Technical context said so on purpose ("muting again is
left to YouTube's own controls"; the player has no volume-change event).

## What was built (all in the tag `archive/rec-003-follow-player-sound`)

| Commit | What it did |
|---|---|
| `72af07b` | v1. Read `isMuted()` of the active player every 300 ms and compare it with the sound state the app believed; the button shows whenever the video is muted and hides while it has sound; the tab's sound state follows, so later videos match. New spec requirement "The unmute button follows the player's own sound control" (2 scenarios), E2E helpers `emitUserMute` and `emitUserUnmute`, story context revised. |
| `bebfbab` | v2. After the owner reported "starting unmuted but not sounding": react only to a **change** in what the player reports (a baseline read, then a new state on two reads in a row); skip the first 4 reads after the app's own mute or unmute; mute a video again if the player unmuted itself right after it started; the refusal check looks twice (window 1.2 s) and no longer calls `play()` on a video that kept playing; `mute=1` added to the embed URL. The E2E fake got a late `isMuted()` (600 ms), `reportedMuted` and `mutedReads`. |
| `c189246` | v3. After "unmuted but with the volume all down": a player whose volume is 0 counts as muted, and unmuting raises a volume below 10 to 100 (`getVolume`/`setVolume`); `mute=1` removed (unproven); a `?debug=1` on-screen log of commands, player states, errors and "autoplay blocked" (`debug-log.ts`, `DebugLog.tsx`). |
| `357be24` | v4. After the log showed a stall: a **stall watchdog**. For 12 s after the app unmutes a video, 5 polls (1.5 s) in a row of `buffering` or `unstarted` count as a refused sound: mute, `play()`, the button returns, and the following videos start muted until the next tap. E2E fake option `stallAfterUnmute`. |
| `d79f526` | v5. After the second log showed a 21 s freeze after a tap on the button: the watchdog also covers the unmute button, and 4 polls (1.2 s) count as a stall. |

At `d79f526`: 171 unit tests and 84 playback and support E2E tests passed, and
`openspec validate --strict` passed. Spec changes: the requirement "The unmute
button follows the player's own sound control" (3 scenarios: unmute, mute and a
wrong report of the player's state), the scenario "Tap the unmute button when the
player's volume is 0", and two stall scenarios under "Blocked unmuted autoplay
falls back to muted".

## What the owner saw (real Chrome, Vercel preview)

1. After v1: "the video looks like it starts unmuted but is not sounding"; after
   v2: "unmuted but with the volume all down; YouTube's volume icon is not the
   unmute button (maybe blocked by the browser's autoplay); I wanted it muted at
   the start so it plays automatically".
2. "After I unmute (player or ours), the next video loads fine, but from the next
   swipe on, playback is silent and the video stops rendering, with the player's
   loading circle in the middle."
3. After v5, with the log: a freeze of about 21 s after tapping our button ("it
   took long").

## The logs

Taken from the owner's screenshots of the preview with `?debug=1`, desktop Chrome
(`debug-log-1-desktop-preview.webp`, `debug-log-2-desktop-preview.webp`). The first
column is seconds since page load; the four-letter tag is the start of the YouTube
ID. Lines older than the top of each screenshot are not available.

**Log 1** (v3). Video `3m9a` is the second one after the home cook unmuted. Chrome
accepted the unmute, then the video buffered and nothing more was reported:

```
48.9 zKdB start sound=true
48.9 zKdB cmd mute
48.9 zKdB cmd play
49.0 zKdB state unstarted
49.0 zKdB state buffering
49.5 zKdB state playing
49.5 zKdB playing -> asking for sound
49.5 zKdB cmd unMute
50.7 zKdB sound check: state=playing muted=false recheck=false
51.9 feed: active=0-3m9arffvbJA soundOn=true
51.9 zKdB stop / cmd pause / cmd mute
51.9 3m9a start sound=true
51.9 3m9a cmd mute
51.9 3m9a cmd play
51.9 3m9a state unstarted
51.9 3m9a state buffering
52.4 3m9a state playing
52.4 3m9a playing -> asking for sound
52.4 3m9a cmd unMute
53.6 3m9a sound check: state=playing muted=false recheck=false
54.4 3m9a state buffering        <- nothing after this: silent, loading circle
```

**Log 2** (v4, before the watchdog covered the button). The first stall was caught
and recovered in about 3 s; the second one, after a tap on our button, lasted 21 s:

```
15.6 feed: active=0-GM8vJ775zIY soundOn=true
15.6 GM8v start sound=true / cmd mute / cmd play
15.9 GM8v state playing
15.9 GM8v playing -> asking for sound
15.9 GM8v cmd unMute
17.1 GM8v sound check: state=playing muted=false recheck=false
17.7 GM8v state buffering
18.9 GM8v stalled after the unmute -> sound refused
18.9 GM8v FALLBACK to muted (state=buffering)
18.9 GM8v cmd mute / cmd play
18.9 feed: sound refused -> button back
19.0 GM8v state playing         <- 0.1 s after muting, the video plays again
28.6 feed: active=0-GM8vJ775zIY soundOn=true      (the home cook taps our button)
28.6 GM8v cmd unMute
30.3 GM8v state buffering
51.1 GM8v state playing         <- 21 s later
```

## Measurements

Real Chrome, with the throwaway check page `yt-check.html` (it loads the real
IFrame API and runs the checks by itself; serve it from a `public/` folder and open it, as in
task 1 of `openspec/changes/archive/2026-11-24-add-autoplay-playback/tasks.md`). Results are in
`check-page-android-chrome-138.jpg` and `check-page-desktop-chrome-154.png`:

| | Android 10, Chrome 138 | macOS, Chrome 154 |
|---|---|---|
| Attach the player right after the iframe is inserted / after its `load` | ready / ready | ready / ready |
| Muted autoplay | plays | plays |
| **Unmuted `playVideo()` with no tap** | **no events at all (`states=[]`)** | **no events at all (`states=[]`)** |
| Embed's own loop mode reports `ended` | no | no |
| Seek mode (`ended`, then `seekTo(0)` and `play()`) | yes, 57 ms | yes, 5 ms |

Built-in browser (Chromium 156 in the Claude desktop app; real YouTube player; a
looser autoplay policy than the owner's Chrome, so it did **not** reproduce the
stalls after a start with sound off):
- sound off: swipe to playing about 0.37 s;
- the first design (unmuted `play()` first): the player gave no event at all, so the
  app waited out its whole window, then played muted;
- start muted, unmute once playing (kept in REC-003): playing in 0.5 to 0.75 s.

## What we know, and what we do not

**Confirmed by logs or measurements**
- The IFrame API we used gives no event for a mute change, so the app has to read
  `isMuted()` (an `onVolumeChange` event was not tested).
- An unmuted `play()` with no tap produces no player event at all in Chrome 154 and
  Android Chrome 138.
- Chrome can **accept an unmute** (`isMuted()` is false, no error) and then leave
  the player buffering with no event: silent, on the loading circle (logs 1 and 2).
  Muting the video makes it play again within about 0.1 s.
- `onAutoplayBlocked` never appeared in the owner's logs.
- A tap on our button did not prevent the stall (log 2, 28.6 s to 51.1 s).

**Hypotheses, not confirmed**
- Chrome honours audible playback only with a click **inside the video's own
  iframe**; every swipe creates a new iframe, so permission does not carry from one
  video to the next. The 51.1 s recovery may have followed a click in the player.
- YouTube remembers the last volume (maybe 0), so `unMute()` alone leaves the
  player "unmuted" at volume 0, silent (v3 handled it; not verified on the owner's
  device).
- `isMuted()` reports late or wrongly, which hid the button in v1. Reproduced only
  in the E2E fake.

## Options for the next attempt

| Option | What | Trade-off |
|---|---|---|
| 1 | Keep v5: every video tries sound once after a tap; a refused sound is caught in about 1.2 s and the video plays muted with the button back. | Works with a short hiccup after a tap; sound carries over only while Chrome allows it. |
| 2 | No automatic sound: every video starts muted, and sound is turned on per video, with our button or YouTube's own control. | No stalls, but sound never carries over, and it contradicts the approved criterion "later videos play with sound" (REC-003, PRD §5.2). Needs the story and PRD updated and human validation. |
| 3 | One reused player (`loadVideoById`) so the iframe keeps its permission and its unmuted state. | The likely way to carry sound reliably, but a large change: it conflicts with one iframe per slide inside the scroll-snap list (REC-001), and belongs with REC-004. Spike first. |

Suggested order: a spike for option 3 with `yt-check.html` extended (one iframe,
switch videos, unmute once with a tap inside the iframe, then wait more than 5 s and
switch again; Android and desktop), then decide between options 1 and 3. Take
option 2 only if option 3 does not hold.

## How to resume

1. `git fetch --tags` and read the code at the tag
   (`git checkout -b spike/sound archive/rec-003-follow-player-sound`), or
   cherry-pick `72af07b` to `d79f526` onto the new work.
2. Decide option 1, 2 or 3 (above), and update the REC-003 Technical context, the
   `playback` spec and PRD §5.2 if the behavior changes.
3. Keep the tests that match the decision: the E2E fake options (`isMutedLagMs`,
   `reportedMuted`, `blockUnmutedAutoplay`, `stallAfterUnmute`) and the unit tests of
   the controller are in the tag.
4. Remove the `?debug` log (`debug-log.ts`, `DebugLog.tsx`, the `log` calls) or keep
   it behind the flag before merging.

## Files

| File | What it is |
|---|---|
| `debug-log-1-desktop-preview.webp` | Owner's screenshot, log 1 (stall after an automatic unmute). |
| `debug-log-2-desktop-preview.webp` | Owner's screenshot, log 2 (watchdog recovery, then the 21 s freeze after a tap). |
| `check-page-android-chrome-138.jpg` | Result of `yt-check.html` on Android 10, Chrome 138. |
| `check-page-desktop-chrome-154.png` | Result of `yt-check.html` on macOS, Chrome 154. |
| `yt-check.html` | The throwaway check page; serve it from a `public/` folder to re-run the checks. |
