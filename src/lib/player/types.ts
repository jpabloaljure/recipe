/**
 * The small surface the app needs from a video player (REC-003). The YouTube
 * IFrame Player API is wrapped behind it in `youtube-player.ts`; the E2E fake
 * and the Vitest fakes implement the same shape.
 */
export type PlayerState = "unstarted" | "playing" | "paused" | "buffering" | "ended" | "cued";

export interface PlayerHandle {
  play(): void;
  pause(): void;
  mute(): void;
  unMute(): void;
  /** Whether the player is muted right now. */
  isMuted(): boolean;
  /** Moves to a time in seconds; the controller only ever asks for 0. */
  seekTo(seconds: number): void;
}

/** Timers are injected so tests never sleep (AGENTS.md E2E rule 6). */
export type TimerHandle = unknown;

export interface Timers {
  set(callback: () => void, ms: number): TimerHandle;
  clear(handle: TimerHandle): void;
}
