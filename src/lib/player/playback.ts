import type { PlayerHandle, PlayerState, Timers, TimerHandle } from "./types";

/**
 * Playback rules for one slide's player (REC-003, specs/playback). Plain
 * TypeScript with the player and the timers injected, so Vitest checks every
 * rule without a browser. Design: add-autoplay-playback, Decision 4.
 *
 * - Only the active slide plays; the others stay paused and muted.
 * - Every video starts muted, at once. When the feed's per-tab state has sound
 *   on, the video is unmuted as soon as it is playing; a browser that does not
 *   allow that (it pauses the video, or it stays muted) is caught quickly, and
 *   the video plays muted while `onSoundBlocked` tells the feed. Asking for sound
 *   in the first `play()` stalled for the whole window on real Chrome.
 * - The controller remembers why it paused. A pause it did not cause is the
 *   home cook's, and it survives hiding and showing the tab.
 * - Every end is reported, then the video restarts (seek mode, Decision 5).
 */

/** Time the browser gets to refuse an unmute, once the video is playing, before it counts as allowed. */
export const BLOCKED_AUTOPLAY_WINDOW_MS = 800;

type PauseReason = "swipe" | "hidden" | "user";

export type SlidePlaybackDeps = {
  youtubeId: string;
  player: PlayerHandle;
  timers: Timers;
  /** Called on every end, including each loop. */
  onEnded: (youtubeId: string) => void;
  /** Called when unmuted autoplay did not start and the video was muted instead. */
  onSoundBlocked: () => void;
  blockedWindowMs?: number;
};

export class SlidePlayback {
  private readonly deps: SlidePlaybackDeps;
  private ready = false;
  private active = false;
  private soundOn = false;
  private tabVisible = true;
  private hasPlayed = false;
  private state: PlayerState = "unstarted";
  private pauseReason: PauseReason | null = null;
  private blockedTimer: TimerHandle | null = null;
  /** Sound is on but the video has not played yet: unmute once it does. */
  private unmuteWhenPlaying = false;

  constructor(deps: SlidePlaybackDeps) {
    this.deps = deps;
  }

  /** The player reported ready: start muted and apply whatever was asked meanwhile. */
  markReady(): void {
    this.ready = true;
    this.deps.player.mute();
    if (this.active) this.start();
  }

  /**
   * The feed's wish: is this slide active, and is sound on in this tab? The feed
   * repeats it, so only a change of slide or of sound does anything.
   */
  setActive(active: boolean, soundOn: boolean): void {
    const wasActive = this.active;
    const soundWas = this.soundOn;
    this.active = active;
    this.soundOn = soundOn;
    if (!this.ready) return;
    if (active && !wasActive) this.start();
    else if (!active && wasActive) this.stop();
    else if (active && soundOn !== soundWas) this.applySound();
  }

  setTabVisible(visible: boolean): void {
    this.tabVisible = visible;
    if (!this.ready || !this.active) return;
    if (!visible) {
      // Nothing to pause when the video is already paused (its reason stays).
      if (this.pauseReason === null) {
        this.clearBlockedTimer();
        this.unmuteWhenPlaying = false;
        this.pauseReason = "hidden";
        this.deps.player.pause();
      }
    } else if (this.pauseReason === "hidden") {
      this.pauseReason = null;
      this.begin();
    }
  }

  /** A state the player reported. Neighbours are ignored: they never play or end. */
  handleState(next: PlayerState): void {
    this.state = next;
    if (!this.active) return;
    if (next === "playing" || next === "buffering") {
      if (next === "playing" && this.pauseReason === "user") this.pauseReason = null;
      if (next === "playing" && this.unmuteWhenPlaying) {
        this.unmuteWhenPlaying = false;
        this.deps.player.unMute();
        this.armBlockedTimer(); // the browser may pause or keep it muted
      }
    } else if (next === "paused") {
      if (this.pauseReason !== null) return; // a pause we caused
      if (this.blockedTimer !== null) this.fallBackToMuted();
      else this.pauseReason = "user";
    } else if (next === "ended") {
      this.clearBlockedTimer();
      this.deps.onEnded(this.deps.youtubeId);
      this.deps.player.seekTo(0);
      this.deps.player.play();
    }
  }

  dispose(): void {
    this.clearBlockedTimer();
  }

  private start(): void {
    this.clearBlockedTimer();
    this.unmuteWhenPlaying = false;
    this.pauseReason = null;
    // Coming back to a video plays it from the beginning.
    if (this.hasPlayed) this.deps.player.seekTo(0);
    if (!this.tabVisible) {
      this.pauseReason = "hidden"; // plays when the tab is visible again
      return;
    }
    this.begin();
  }

  private begin(): void {
    const { player } = this.deps;
    // Set before `play()`: a player may report `playing` from inside the call.
    this.unmuteWhenPlaying = this.soundOn;
    player.mute();
    player.play();
    this.hasPlayed = true;
  }

  private stop(): void {
    this.clearBlockedTimer();
    this.unmuteWhenPlaying = false;
    this.pauseReason = "swipe";
    this.deps.player.pause();
    this.deps.player.mute();
  }

  /** Sound changed for the active video (the unmute button, which is a tap, or the fallback). */
  private applySound(): void {
    if (!this.soundOn) {
      this.unmuteWhenPlaying = false;
      this.deps.player.mute();
    } else if (this.state === "playing") {
      this.deps.player.unMute();
    } else {
      this.unmuteWhenPlaying = true; // unmute as soon as it plays
    }
  }

  private armBlockedTimer(): void {
    this.clearBlockedTimer();
    const ms = this.deps.blockedWindowMs ?? BLOCKED_AUTOPLAY_WINDOW_MS;
    this.blockedTimer = this.deps.timers.set(() => {
      this.blockedTimer = null;
      const playing = this.state === "playing" || this.state === "buffering";
      if (!playing || this.deps.player.isMuted()) this.fallBackToMuted();
    }, ms);
  }

  private fallBackToMuted(): void {
    this.clearBlockedTimer();
    this.unmuteWhenPlaying = false;
    this.soundOn = false;
    this.deps.player.mute();
    this.deps.player.play();
    this.deps.onSoundBlocked();
  }

  private clearBlockedTimer(): void {
    if (this.blockedTimer === null) return;
    this.deps.timers.clear(this.blockedTimer);
    this.blockedTimer = null;
  }
}

/**
 * Applies the feed's active slide to every controller: first stops the others,
 * then starts the active one, so at most one player is ever asked to play.
 */
export function syncActive(
  controllers: ReadonlyMap<string, SlidePlayback>,
  activeKey: string | null,
  soundOn: boolean,
): void {
  for (const [key, controller] of controllers) if (key !== activeKey) controller.setActive(false, soundOn);
  if (activeKey !== null) controllers.get(activeKey)?.setActive(true, soundOn);
}
