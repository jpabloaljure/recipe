import { beforeEach, describe, expect, it } from "vitest";
import {
  type ApiEnvironment,
  attachPlayer,
  IFRAME_API_URL,
  isUnplayableError,
  loadYouTubeApi,
  mapYouTubeState,
  resetYouTubeApiLoader,
} from "./youtube-player";

describe("mapYouTubeState", () => {
  it("maps the API's state codes", () => {
    expect([-1, 0, 1, 2, 3, 5].map(mapYouTubeState)).toEqual([
      "unstarted",
      "ended",
      "playing",
      "paused",
      "buffering",
      "cued",
    ]);
  });

  it("returns null for a code the app does not use", () => {
    expect(mapYouTubeState(4)).toBeNull();
  });
});

type FakeScript = { src: string; async: boolean; onerror: (() => void) | null };

function fakeEnv() {
  const scripts: FakeScript[] = [];
  const env: ApiEnvironment = {
    document: {
      createElement: () => ({ src: "", async: false, onerror: null }),
      head: { appendChild: (node) => scripts.push(node as FakeScript) },
    },
  };
  return { env, scripts };
}

class FakePlayer {
  static last: FakePlayer;
  readonly calls: string[] = [];
  constructor(
    readonly iframe: unknown,
    readonly options: {
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: (event: { data: number }) => void;
      };
    },
  ) {
    FakePlayer.last = this;
  }
  playVideo() {
    this.calls.push("play");
  }
  pauseVideo() {
    this.calls.push("pause");
  }
  mute() {
    this.calls.push("mute");
  }
  unMute() {
    this.calls.push("unMute");
  }
  isMuted() {
    return true;
  }
  seekTo(seconds: number, allowSeekAhead: boolean) {
    this.calls.push(`seekTo(${seconds},${allowSeekAhead})`);
  }
  destroy() {
    this.calls.push("destroy");
  }
}

describe("loadYouTubeApi", () => {
  beforeEach(() => resetYouTubeApiLoader());

  it("adds the script once and resolves when the API calls back", async () => {
    const { env, scripts } = fakeEnv();
    const first = loadYouTubeApi(env);
    const second = loadYouTubeApi(env);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe(IFRAME_API_URL);

    env.YT = { Player: FakePlayer as never };
    env.onYouTubeIframeAPIReady?.();
    await expect(first).resolves.toBe(env.YT);
    await expect(second).resolves.toBe(env.YT);
  });

  it("resolves at once when the API is already on the page", async () => {
    const { env, scripts } = fakeEnv();
    env.YT = { Player: FakePlayer as never };
    await expect(loadYouTubeApi(env)).resolves.toBe(env.YT);
    expect(scripts).toHaveLength(0);
  });

  it("keeps a callback that was already set", async () => {
    const { env } = fakeEnv();
    let earlier = 0;
    env.onYouTubeIframeAPIReady = () => earlier++;
    const loaded = loadYouTubeApi(env);
    env.YT = { Player: FakePlayer as never };
    env.onYouTubeIframeAPIReady?.();
    await loaded;
    expect(earlier).toBe(1);
  });

  it("rejects when the script fails, and a later attempt adds it again", async () => {
    const { env, scripts } = fakeEnv();
    const failed = loadYouTubeApi(env);
    scripts[0].onerror?.();
    await expect(failed).rejects.toThrow("failed to load");
    void loadYouTubeApi(env).catch(() => {});
    expect(scripts).toHaveLength(2);
  });
});

describe("isUnplayableError", () => {
  it("is true for removed or private (100) and for embedding not allowed (101, 150)", () => {
    expect([100, 101, 150].map(isUnplayableError)).toEqual([true, true, true]);
  });

  it("is false for every other code, 153 and 5 among them", () => {
    expect([2, 5, 153, 0].map(isUnplayableError)).toEqual([false, false, false, false]);
  });
});

describe("attachPlayer", () => {
  it("maps the commands and the state events", () => {
    const states: string[] = [];
    let ready = 0;
    const iframe = {} as HTMLIFrameElement;
    const attached = attachPlayer({ Player: FakePlayer as never }, iframe, {
      onReady: () => ready++,
      onState: (state) => states.push(state),
      onUnplayable: () => {},
    });
    const fake = FakePlayer.last;
    expect(fake.iframe).toBe(iframe);

    fake.options.events.onReady();
    fake.options.events.onStateChange({ data: 1 });
    fake.options.events.onStateChange({ data: 4 }); // not used: dropped
    fake.options.events.onStateChange({ data: 0 });
    expect(ready).toBe(1);
    expect(states).toEqual(["playing", "ended"]);

    attached.handle.play();
    attached.handle.pause();
    attached.handle.mute();
    attached.handle.unMute();
    expect(attached.handle.isMuted()).toBe(true);
    attached.handle.seekTo(0);
    attached.destroy();
    expect(fake.calls).toEqual(["play", "pause", "mute", "unMute", "seekTo(0,true)", "destroy"]);
  });
});

describe("attachPlayer errors", () => {
  function attach() {
    let unplayable = 0;
    attachPlayer({ Player: FakePlayer as never }, {} as HTMLIFrameElement, {
      onReady: () => {},
      onState: () => {},
      onUnplayable: () => unplayable++,
    });
    return { fake: FakePlayer.last, count: () => unplayable };
  }

  it("reports a removed video (error 100)", () => {
    const { fake, count } = attach();
    fake.options.events.onError({ data: 100 });
    expect(count()).toBe(1);
  });

  it("reports embedding not allowed (errors 101 and 150)", () => {
    const { fake, count } = attach();
    fake.options.events.onError({ data: 101 });
    fake.options.events.onError({ data: 150 });
    expect(count()).toBe(2);
  });

  it("does not report another error code", () => {
    const { fake, count } = attach();
    fake.options.events.onError({ data: 153 });
    fake.options.events.onError({ data: 5 });
    expect(count()).toBe(0);
  });
});
