"use client";

import { useEffect, useRef } from "react";
import { embedUrl } from "../../lib/player/embed-url";
import { SlidePlayback } from "../../lib/player/playback";
import type { Timers } from "../../lib/player/types";
import { type ApiEnvironment, attachPlayer, loadYouTubeApi } from "../../lib/player/youtube-player";
import styles from "./Feed.module.css";

const browserTimers: Timers = {
  set: (callback, ms) => window.setTimeout(callback, ms),
  clear: (handle) => window.clearTimeout(handle as number),
};

type Props = {
  youtubeId: string;
  title: string;
  /** Called with this slide's controller once its player exists, and with `null` when it is gone. */
  onPlayback: (playback: SlidePlayback | null) => void;
  onEnded: (youtubeId: string) => void;
  onSoundBlocked: () => void;
  /** The active video is playing: the feed warms up the next one. */
  onPlaying: () => void;
};

/**
 * One slide's YouTube iframe and its player (REC-003). React renders the
 * iframe; the player is attached to it when it mounts and lives as long as the
 * iframe does (add-autoplay-playback design Decisions 2 and 3).
 */
export function SlideVideo({ youtubeId, title, onPlayback, onEnded, onSoundBlocked, onPlaying }: Props) {
  const iframe = useRef<HTMLIFrameElement>(null);
  // The latest callbacks, so the player is created once and not on every render.
  const callbacks = useRef({ onPlayback, onEnded, onSoundBlocked, onPlaying });
  callbacks.current = { onPlayback, onEnded, onSoundBlocked, onPlaying };

  useEffect(() => {
    const element = iframe.current;
    if (!element) return;
    let disposed = false;
    let cleanup = () => {};

    loadYouTubeApi(window as unknown as ApiEnvironment)
      .then((api) => {
        if (disposed) return;
        let playback: SlidePlayback | undefined;
        const attached = attachPlayer(api, element, {
          onReady: () => playback?.markReady(),
          onState: (state) => playback?.handleState(state),
        });
        playback = new SlidePlayback({
          youtubeId,
          player: attached.handle,
          timers: browserTimers,
          onEnded: (id) => callbacks.current.onEnded(id),
          onSoundBlocked: () => callbacks.current.onSoundBlocked(),
          onPlaying: () => callbacks.current.onPlaying(),
        });
        callbacks.current.onPlayback(playback);
        cleanup = () => {
          playback?.dispose();
          callbacks.current.onPlayback(null);
          // `destroy()` removes the iframe from the page, so it is only called once
          // React has removed it already (a real unmount), not in a dev double mount.
          if (!element.isConnected) attached.destroy();
        };
      })
      // If the script cannot load, the iframe stays a plain embed (REC-018 reports it).
      .catch(() => {});

    return () => {
      disposed = true;
      cleanup();
    };
  }, [youtubeId]);

  return (
    <iframe
      ref={iframe}
      className={styles.player}
      src={embedUrl(youtubeId, window.location.origin)}
      title={title}
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      // YouTube refuses embeds sent with no referrer (player error 153).
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
