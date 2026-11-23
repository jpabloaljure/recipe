import { describe, expect, it } from "vitest";
import { BLOCKED_AUTOPLAY_WINDOW_MS, SlidePlayback, syncActive } from "./playback";
import type { PlayerHandle, TimerHandle, Timers } from "./types";

type Call = "play" | "pause" | "mute" | "unMute" | "seekTo(0)";

function fakePlayer(): PlayerHandle & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    play: () => calls.push("play"),
    pause: () => calls.push("pause"),
    mute: () => calls.push("mute"),
    unMute: () => calls.push("unMute"),
    seekTo: (seconds) => calls.push(`seekTo(${seconds})` as Call),
  };
}

/** Timers that only run when the test says so. */
function fakeTimers(): Timers & { pending: () => number; fire: () => void } {
  const scheduled = new Map<number, () => void>();
  let next = 1;
  return {
    set(callback) {
      const id = next++;
      scheduled.set(id, callback);
      return id as TimerHandle;
    },
    clear(handle) {
      scheduled.delete(handle as number);
    },
    pending: () => scheduled.size,
    fire() {
      for (const [id, callback] of [...scheduled]) {
        scheduled.delete(id);
        callback();
      }
    },
  };
}

function setup(youtubeId = "vid") {
  const player = fakePlayer();
  const timers = fakeTimers();
  const ended: string[] = [];
  let blocked = 0;
  const playback = new SlidePlayback({
    youtubeId,
    player,
    timers,
    onEnded: (id) => ended.push(id),
    onSoundBlocked: () => blocked++,
  });
  return { player, timers, ended, playback, blockedCount: () => blocked };
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

  it("plays with sound when sound is on", () => {
    const { player, playback } = setup();
    playback.markReady();
    expect(since(player, () => playback.setActive(true, true))).toEqual(["unMute", "play"]);
  });

  it("starts muted and paused before it is active", () => {
    const { player, playback } = setup();
    expect(since(player, () => playback.markReady())).toEqual(["mute"]);
  });

  it("applies a request made before the player was ready, once it is ready", () => {
    const { player, playback } = setup();
    playback.setActive(true, true);
    expect(player.calls).toEqual([]);
    expect(since(player, () => playback.markReady())).toEqual(["mute", "unMute", "play"]);
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
    expect(since(player, () => playback.setActive(true, true))).toEqual(["unMute"]);
  });
});

describe("blocked unmuted autoplay", () => {
  it("falls back to muted when the player does not start within the window", () => {
    const { player, timers, playback, blockedCount } = setup();
    playback.markReady();
    playback.setActive(true, true);
    expect(timers.pending()).toBe(1);
    expect(since(player, () => timers.fire())).toEqual(["mute", "play"]);
    expect(blockedCount()).toBe(1);
  });

  it("falls back when the player drops back to paused inside the window", () => {
    const { player, playback, blockedCount } = setup();
    playback.markReady();
    playback.setActive(true, true);
    expect(since(player, () => playback.handleState("paused"))).toEqual(["mute", "play"]);
    expect(blockedCount()).toBe(1);
  });

  it("does not fall back when the player reaches playing", () => {
    const { timers, playback, blockedCount } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.handleState("playing");
    expect(timers.pending()).toBe(0);
    timers.fire();
    expect(blockedCount()).toBe(0);
  });

  it("counts buffering as started, so a slow network is not a block", () => {
    const { timers, playback, blockedCount } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.handleState("buffering");
    timers.fire();
    expect(blockedCount()).toBe(0);
  });

  it("does not arm the window when sound is off", () => {
    const { timers, playback } = setup();
    playback.markReady();
    playback.setActive(true, false);
    expect(timers.pending()).toBe(0);
  });

  it("drops the window when the video leaves the screen", () => {
    const { timers, playback, blockedCount } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.setActive(false, true);
    timers.fire();
    expect(blockedCount()).toBe(0);
  });

  it("uses a window of 1.5 seconds by default", () => {
    expect(BLOCKED_AUTOPLAY_WINDOW_MS).toBe(1500);
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
    const { timers, ended, playback, blockedCount } = setup();
    playback.markReady();
    playback.setActive(true, true);
    playback.handleState("playing");
    playback.handleState("ended");
    timers.fire();
    expect(ended).toHaveLength(1);
    expect(blockedCount()).toBe(0);
  });
});

describe("one player at a time", () => {
  it("asks at most one controller to play as the active slide changes", () => {
    const players = new Map<string, ReturnType<typeof fakePlayer>>();
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
