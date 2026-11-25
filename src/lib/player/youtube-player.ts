import type { PlayerHandle, PlayerState } from "./types";

/**
 * The only module that knows the YouTube IFrame Player API (ADR 0008). It loads
 * the script once and attaches a player to an iframe React already rendered;
 * everything else uses `PlayerHandle`.
 */

export const IFRAME_API_URL = "https://www.youtube.com/iframe_api";

/** The few parts of the API the app uses. */
type YouTubePlayer = {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
};

type YouTubeNamespace = {
  Player: new (
    iframe: HTMLIFrameElement,
    options: {
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: (event: { data: number }) => void;
      };
    },
  ) => YouTubePlayer;
};

/** What the loader needs from `window`; a fake stands in for it in tests. */
export type ApiEnvironment = {
  YT?: YouTubeNamespace;
  onYouTubeIframeAPIReady?: () => void;
  document: {
    createElement(tag: "script"): { src: string; async: boolean; onerror: (() => void) | null };
    head: { appendChild(node: unknown): unknown };
  };
};

/** Maps the API's numeric states; `null` for one the app does not use. */
export function mapYouTubeState(code: number): PlayerState | null {
  switch (code) {
    case -1:
      return "unstarted";
    case 0:
      return "ended";
    case 1:
      return "playing";
    case 2:
      return "paused";
    case 3:
      return "buffering";
    case 5:
      return "cued";
    default:
      return null;
  }
}

/**
 * True for the player errors that mean the video cannot be watched here:
 * 100 (removed or private) and 101 and 150 (embedding not allowed). Every other
 * code, 153 (a missing referrer, a bug of ours) among them, is not a skip.
 */
export function isUnplayableError(code: number): boolean {
  return code === 100 || code === 101 || code === 150;
}

let loading: Promise<YouTubeNamespace> | null = null;

/** Loads the script once per page; every caller shares one promise. */
export function loadYouTubeApi(env: ApiEnvironment): Promise<YouTubeNamespace> {
  if (env.YT?.Player) return Promise.resolve(env.YT);
  if (loading) return loading;
  loading = new Promise<YouTubeNamespace>((resolve, reject) => {
    const previous = env.onYouTubeIframeAPIReady;
    env.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (env.YT?.Player) resolve(env.YT);
      else reject(new Error("The YouTube IFrame API loaded without a Player"));
    };
    const script = env.document.createElement("script");
    script.src = IFRAME_API_URL;
    script.async = true;
    script.onerror = () => {
      loading = null; // a later attempt may try again
      reject(new Error("The YouTube IFrame API script failed to load"));
    };
    env.document.head.appendChild(script);
  });
  return loading;
}

/** Test hook: forget the shared promise. */
export function resetYouTubeApiLoader(): void {
  loading = null;
}

export type AttachedPlayer = {
  handle: PlayerHandle;
  destroy(): void;
};

/**
 * Attaches a player to an iframe whose URL has `enablejsapi=1`. `onReady` and
 * `onState` are called as the player reports; `onUnplayable` when the video
 * cannot be watched (`isUnplayableError`); commands sent before ready are the
 * caller's to hold (`SlidePlayback` does).
 */
export function attachPlayer(
  api: YouTubeNamespace,
  iframe: HTMLIFrameElement,
  events: { onReady: () => void; onState: (state: PlayerState) => void; onUnplayable: () => void },
): AttachedPlayer {
  const player = new api.Player(iframe, {
    events: {
      onReady: () => events.onReady(),
      onStateChange: (event) => {
        const state = mapYouTubeState(event.data);
        if (state !== null) events.onState(state);
      },
      onError: (event) => {
        if (isUnplayableError(event.data)) events.onUnplayable();
      },
    },
  });
  return {
    handle: {
      play: () => player.playVideo(),
      pause: () => player.pauseVideo(),
      mute: () => player.mute(),
      unMute: () => player.unMute(),
      isMuted: () => player.isMuted(),
      seekTo: (seconds) => player.seekTo(seconds, true),
    },
    destroy: () => player.destroy(),
  };
}
