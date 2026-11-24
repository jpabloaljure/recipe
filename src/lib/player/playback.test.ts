import { describe, expect, it } from "vitest";
import { BLOCKED_AUTOPLAY_WINDOW_MS, SOUND_POLL_MS, SlidePlayback, syncActive } from "./playback";
import type { PlayerHandle, TimerHandle, Timers } from "./types";

type Call = "play" | "pause" | "mute" | "unMute" | "seekTo(0)";

type FakePlayer = PlayerHandle & { calls: Call[]; muted: boolean };

function fakePlayer(): FakePlayer {
  const calls: Call[] = [];
  const player: FakePlayer = {
    calls,
    muted: false,
    play: () => calls.push("play"),
    pause: () => calls.push("pause"),
    mute: () => {
      calls.push("mute");
      player.muted = true;
    },
    unMute: () => {
      calls.push("unMute");
      player.muted = false;
    },
    isMuted: () => player.muted,
    seekTo: (seconds) => calls.push(`seekTo(${seconds})` as Call),
  };
  return player;
}

/** Timers that only run when the test says so, told apart by their delay. */
function fakeTimers(): Timers & { pending: (ms?: number) => number; fire: (ms?: number) => void } {
  const scheduled = new Map<number, { callback: () => void; ms: number }>();
  let next = 1;
  const matching = (ms?: number) => [...scheduled].filter(([, t]) => ms === undefined || t.ms === ms);
  return {
    set(callback, ms) {
      const id = next++;
      scheduled.set(id, { callback, ms });
      return id as TimerHandle;
    },
    clear(handle) {
      scheduled.delete(handle as number);
    },
    pending: (ms) => matching(ms).length,
    fire(ms) {
      for (const [id, timer] of matching(ms)) {
        scheduled.delete(id);
        timer.callback();
      }
    },
  };
}

function setup(youtubeId = "vid") {
  const player = fakePlayer();
  const timers = fakeTimers();
  const ended: string[] = [];
  const soundChanges: boolean[] = [];
  let blocked = 0;
  const playback = new SlidePlayback({
    youtubeId,
    player,
    timers,
    onEnded: (id) => ended.push(id),
    onSoundBlocked: () => blocked++,
    onSoundChanged: (soundOn) => soundChanges.push(soundOn),
  });
  return { player, timers, ended, soundChanges, playback, blockedCount: () => blocked };
}

/** Calls since the last `clear`, so a test reads only what its action caused. */
function since(player: { calls: Call[] }, action: () => void): Call[] {
  player.calls.length = 0;
  action();
  return [...player.calls];
}

describe("sound and activation", () => {
  it("plays a newly active video muted when sound is off", () => {
    const { player, playback } = setup();
    playback.markReady();
    expect(since(player, () => playback.setActive(true, false))).toEqual(["mute", "play"]);
  });

  it("never unmutes a video when sound is off", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, false);
    expect(since(player, () => playback.handleState("playing"))).toEqual([]);
  });

  it("starts muted at once when sound is on, and unmutes once the video is playing", () => {
    const { player, playback } = setup();
    playback.markReady();
    expect(since(player, () => playback.setActive(true, true))).toEqual(["mute", "play"]);
    expect(since(player, () => playback.handleState("buffering"))).toEqual([]);
    expect(since(player, () => playback.handleState("playing"))).toEqual(["unMute"]);
  });

  it("unmutes when the player reports playing from inside play()", () => {
    const ctx = setup();
    const play = ctx.player.play;
    ctx.player.play = () => {
      play();
      ctx.playback.handleState("playing");
    };
    ctx.playback.markReady();
    expect(since(ctx.player, () => ctx.playback.setActive(true, true))).toEqual(["mute", "play", "unMute"]);
  });

  it("unmutes only once for one start", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.handleState("playing");
    expect(since(player, () => playback.handleState("playing"))).toEqual([]);
  });

  it("starts muted and paused before it is active", () => {
    const { player, playback } = setup();
    expect(since(player, () => playback.markReady())).toEqual(["mute"]);
  });

  it("applies a request made before the player was ready, once it is ready", () => {
    const { player, playback } = setup();
    playback.setActive(true, true);
    expect(player.calls).toEqual([]);
    expect(since(player, () => playback.markReady())).toEqual(["mute", "mute", "play"]);
    expect(since(player, () => playback.handleState("playing"))).toEqual(["unMute"]);
  });

  it("pauses and mutes a video that leaves the screen", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, true);
    expect(since(player, () => playback.setActive(false, true))).toEqual(["pause", "mute"]);
  });

  it("plays from the beginning when the home cook comes back", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, false);
    playback.setActive(false, false);
    expect(since(player, () => playback.setActive(true, false))).toEqual(["seekTo(0)", "mute", "play"]);
  });

  it("does not seek the first time a video plays", () => {
    const { player, playback } = setup();
    playback.markReady();
    expect(since(player, () => playback.setActive(true, false))).not.toContain("seekTo(0)");
  });

  it("turns sound on for the playing video without restarting it", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, false);
    playback.handleState("playing");
    expect(since(player, () => playback.setActive(true, true))).toEqual(["unMute"]);
  });

  it("waits for the video to play when sound is turned on before it does", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, false);
    expect(since(player, () => playback.setActive(true, true))).toEqual([]);
    expect(since(player, () => playback.handleState("playing"))).toEqual(["unMute"]);
  });

  it("does nothing when the feed repeats the same request", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, true);
    expect(since(player, () => playback.setActive(true, true))).toEqual([]);
    playback.handleState("playing");
    expect(since(player, () => playback.setActive(true, true))).toEqual([]);
  });

  it("does not unmute a video that left the screen before it played", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.setActive(false, true);
    expect(since(player, () => playback.handleState("playing"))).toEqual([]);
  });
});

describe("blocked unmuted autoplay", () => {
  function unmuted() {
    const ctx = setup();
    ctx.playback.markReady();
    ctx.playback.setActive(true, true);
    ctx.playback.handleState("playing"); // the unmute is asked for here
    return ctx;
  }

  it("falls back to muted when the browser pauses the video after the unmute", () => {
    const { player, playback, blockedCount } = unmuted();
    expect(since(player, () => playback.handleState("paused"))).toEqual(["mute", "play"]);
    expect(blockedCount()).toBe(1);
  });

  it("falls back to muted when the player is still muted at the end of the window", () => {
    const { player, timers, blockedCount } = unmuted();
    player.muted = true; // the browser refused the unmute
    expect(since(player, () => timers.fire(BLOCKED_AUTOPLAY_WINDOW_MS))).toEqual(["mute", "play"]);
    expect(blockedCount()).toBe(1);
  });

  it("falls back when the video is no longer playing at the end of the window", () => {
    const { player, timers, playback, blockedCount } = unmuted();
    playback.handleState("unstarted");
    expect(since(player, () => timers.fire(BLOCKED_AUTOPLAY_WINDOW_MS))).toEqual(["mute", "play"]);
    expect(blockedCount()).toBe(1);
  });

  it("keeps the sound when the video is still playing and unmuted at the end of the window", () => {
    const { player, timers, blockedCount } = unmuted();
    expect(since(player, () => timers.fire(BLOCKED_AUTOPLAY_WINDOW_MS))).toEqual([]);
    expect(blockedCount()).toBe(0);
  });

  it("counts buffering after the unmute as started", () => {
    const { timers, playback, blockedCount } = unmuted();
    playback.handleState("buffering");
    timers.fire(BLOCKED_AUTOPLAY_WINDOW_MS);
    expect(blockedCount()).toBe(0);
  });

  it("does not arm the window when sound is off", () => {
    const { timers, playback } = setup();
    playback.markReady();
    playback.setActive(true, false);
    playback.handleState("playing");
    expect(timers.pending(BLOCKED_AUTOPLAY_WINDOW_MS)).toBe(0);
  });

  it("arms the window only after the video is playing", () => {
    const { timers, playback } = setup();
    playback.markReady();
    playback.setActive(true, true);
    expect(timers.pending(BLOCKED_AUTOPLAY_WINDOW_MS)).toBe(0);
    playback.handleState("playing");
    expect(timers.pending(BLOCKED_AUTOPLAY_WINDOW_MS)).toBe(1);
  });

  it("drops the window when the video leaves the screen", () => {
    const { player, timers, playback, blockedCount } = unmuted();
    playback.setActive(false, true);
    player.muted = true;
    timers.fire(BLOCKED_AUTOPLAY_WINDOW_MS);
    expect(blockedCount()).toBe(0);
  });

  it("uses a window of 0.8 seconds by default", () => {
    expect(BLOCKED_AUTOPLAY_WINDOW_MS).toBe(800);
  });
});

describe("pause reasons", () => {
  function playing() {
    const ctx = setup();
    ctx.playback.markReady();
    ctx.playback.setActive(true, false);
    ctx.playback.handleState("playing");
    return ctx;
  }

  it("keeps a pause the controller did not cause", () => {
    const { player, playback } = playing();
    playback.handleState("paused");
    expect(since(player, () => playback.setTabVisible(false))).toEqual([]);
    expect(since(player, () => playback.setTabVisible(true))).toEqual([]);
  });

  it("pauses a playing video when the tab is hidden and plays it when visible again", () => {
    const { player, playback } = playing();
    expect(since(player, () => playback.setTabVisible(false))).toEqual(["pause"]);
    playback.handleState("paused"); // the player's echo of our pause
    expect(since(player, () => playback.setTabVisible(true))).toEqual(["mute", "play"]);
  });

  it("does not treat its own pause as the home cook's", () => {
    const { player, playback } = playing();
    playback.setTabVisible(false);
    playback.handleState("paused");
    playback.setTabVisible(true);
    playback.handleState("playing");
    expect(player.calls.filter((call) => call === "play")).toHaveLength(2);
  });

  it("asks for sound again after a hidden tab, once the video plays", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.handleState("playing");
    playback.setTabVisible(false);
    playback.handleState("paused");
    expect(since(player, () => playback.setTabVisible(true))).toEqual(["mute", "play"]);
    expect(since(player, () => playback.handleState("playing"))).toEqual(["unMute"]);
  });

  it("does not resume a swipe pause when the tab becomes visible", () => {
    const { player, playback } = playing();
    playback.setActive(false, false);
    expect(since(player, () => playback.setTabVisible(true))).toEqual([]);
  });

  it("plays again after the home cook plays with the player's own control", () => {
    const { player, playback } = playing();
    playback.handleState("paused");
    playback.handleState("playing");
    expect(since(player, () => playback.setTabVisible(false))).toEqual(["pause"]);
  });

  it("waits for the tab to be visible when a video becomes active in a hidden tab", () => {
    const { player, playback } = setup();
    playback.markReady();
    playback.setTabVisible(false);
    expect(since(player, () => playback.setActive(true, false))).toEqual([]);
    expect(since(player, () => playback.setTabVisible(true))).toEqual(["mute", "play"]);
  });

  it("ignores states of a video that is not active", () => {
    const { ended, playback } = setup();
    playback.markReady();
    playback.handleState("ended");
    playback.handleState("paused");
    expect(ended).toEqual([]);
  });
});

describe("following the player's own sound control", () => {
  function playingMuted() {
    const ctx = setup();
    ctx.playback.markReady();
    ctx.playback.setActive(true, false);
    ctx.playback.handleState("playing");
    return ctx;
  }

  function playingWithSound() {
    const ctx = setup();
    ctx.playback.markReady();
    ctx.playback.setActive(true, true);
    ctx.playback.handleState("playing"); // the unmute is asked for here
    ctx.timers.fire(BLOCKED_AUTOPLAY_WINDOW_MS); // the browser allowed it
    return ctx;
  }

  it("reports an unmute made with the player's own control", () => {
    const { player, timers, soundChanges } = playingMuted();
    player.muted = false;
    timers.fire(SOUND_POLL_MS);
    expect(soundChanges).toEqual([true]);
  });

  it("reports a mute made with the player's own control", () => {
    const { player, timers, soundChanges } = playingWithSound();
    player.muted = true;
    timers.fire(SOUND_POLL_MS);
    expect(soundChanges).toEqual([false]);
  });

  it("reports nothing while the sound matches", () => {
    const { timers, soundChanges } = playingMuted();
    timers.fire(SOUND_POLL_MS);
    timers.fire(SOUND_POLL_MS);
    expect(soundChanges).toEqual([]);
  });

  it("reports a change once, and the feed's repeated request then does nothing", () => {
    const { player, timers, playback, soundChanges } = playingMuted();
    player.muted = false;
    timers.fire(SOUND_POLL_MS);
    timers.fire(SOUND_POLL_MS);
    expect(soundChanges).toEqual([true]);
    expect(since(player, () => playback.setActive(true, true))).toEqual([]);
  });

  it("keeps reading while the home cook has paused the video", () => {
    const { player, timers, playback, soundChanges } = playingMuted();
    playback.handleState("paused");
    player.muted = false;
    timers.fire(SOUND_POLL_MS);
    expect(soundChanges).toEqual([true]);
  });

  it("does not read the sound while its own unmute is being checked", () => {
    const { player, timers, playback, soundChanges } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.handleState("playing"); // unmute asked, check pending
    player.muted = true; // looks like a mute, but it is the check's to decide
    timers.fire(SOUND_POLL_MS);
    expect(soundChanges).toEqual([]);
  });

  it("does not read the sound before the video plays", () => {
    const { player, timers, playback, soundChanges } = setup();
    playback.markReady();
    playback.setActive(true, true);
    player.muted = false;
    timers.fire(SOUND_POLL_MS);
    playback.handleState("buffering");
    timers.fire(SOUND_POLL_MS);
    expect(soundChanges).toEqual([]);
  });

  it("keeps polling while the slide is active", () => {
    const { timers } = playingMuted();
    expect(timers.pending(SOUND_POLL_MS)).toBe(1);
    timers.fire(SOUND_POLL_MS);
    expect(timers.pending(SOUND_POLL_MS)).toBe(1);
  });

  it("stops polling when the slide leaves the screen or is disposed", () => {
    const left = playingMuted();
    left.playback.setActive(false, false);
    expect(left.timers.pending(SOUND_POLL_MS)).toBe(0);
    const gone = playingMuted();
    gone.playback.dispose();
    expect(gone.timers.pending(SOUND_POLL_MS)).toBe(0);
  });

  it("never polls a video that is not active", () => {
    const { timers, playback } = setup();
    playback.markReady();
    expect(timers.pending(SOUND_POLL_MS)).toBe(0);
  });
});

describe("ended contract", () => {
  it("reports every end with the video id, and restarts the video", () => {
    const { player, ended, playback } = setup("abc");
    playback.markReady();
    playback.setActive(true, false);
    expect(since(player, () => playback.handleState("ended"))).toEqual(["seekTo(0)", "play"]);
    playback.handleState("playing");
    playback.handleState("ended");
    expect(ended).toEqual(["abc", "abc"]);
  });

  it("reports the end of an unmuted video without falling back", () => {
    const { player, timers, ended, playback, blockedCount } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.handleState("playing");
    playback.handleState("ended");
    player.muted = false;
    timers.fire(BLOCKED_AUTOPLAY_WINDOW_MS);
    expect(ended).toHaveLength(1);
    expect(blockedCount()).toBe(0);
  });
});

describe("one player at a time", () => {
  it("asks at most one controller to play as the active slide changes", () => {
    const players = new Map<string, FakePlayer>();
    const controllers = new Map<string, SlidePlayback>();
    for (const key of ["a", "b", "c"]) {
      const player = fakePlayer();
      players.set(key, player);
      const playback = new SlidePlayback({
        youtubeId: key,
        player,
        timers: fakeTimers(),
        onEnded: () => {},
        onSoundBlocked: () => {},
        onSoundChanged: () => {},
      });
      playback.markReady();
      controllers.set(key, playback);
    }
    const playing = () =>
      [...players].filter(([, p]) => p.calls.lastIndexOf("play") > p.calls.lastIndexOf("pause")).map(([key]) => key);

    syncActive(controllers, "a", false);
    expect(playing()).toEqual(["a"]);
    syncActive(controllers, "b", false);
    expect(playing()).toEqual(["b"]);
    syncActive(controllers, "c", true);
    expect(playing()).toEqual(["c"]);
    syncActive(controllers, null, true);
    expect(playing()).toEqual([]);
  });
});
