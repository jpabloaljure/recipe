"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  activeIndexFrom,
  appendPage,
  buildSlides,
  ensureCycles,
  type FeedState,
  initialFeedState,
  inPlayerWindow,
  settledIndexFrom,
  shouldRequestNextPage,
} from "../../lib/feed/feed-state";
import { createHttpFeedSource } from "../../lib/feed/http-source";
import { PageRequests } from "../../lib/feed/page-requests";
import { shuffleFeedPage } from "../../lib/feed/shuffle";
import { debugLog } from "../../lib/player/debug-log";
import { type SlidePlayback, syncActive } from "../../lib/player/playback";
import { DebugLog } from "./DebugLog";
import styles from "./Feed.module.css";
import { SlideVideo } from "./SlideVideo";

/**
 * The vertical swipe feed (REC-001). Native CSS scroll-snap moves one video
 * per gesture; the active slide is read on `scrollend`. Pages come from
 * `GET /api/feed`; after the last page the visit order is appended again, so
 * the feed wraps to the first video with an ordinary snap.
 *
 * Each mounted slide has a player (REC-003): the active one plays, sound is
 * on or off for the whole tab, and every end of a video is announced with a
 * bubbling `videoended` event on the feed element (`detail.youtubeId`).
 *
 * Out of scope here: preloading (REC-004), and loading, empty and error
 * states (REC-018).
 */
export function Feed() {
  const source = useMemo(() => createHttpFeedSource(), []);
  const [state, setState] = useState<FeedState>(initialFeedState);
  const [activeIndex, setActiveIndex] = useState(0);
  // Sound is on or off for this tab only, in memory: a reload starts muted (REC-003).
  const [soundOn, setSoundOn] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const controllers = useRef(new Map<string, SlidePlayback>());
  // Each page is requested once at a time; the next cursor is only known after
  // the current page arrives, so requests never overlap.
  const requests = useRef(new PageRequests());

  const load = useCallback(
    (cursor: string | null) => {
      if (!requests.current.begin(cursor)) return;
      source
        .getPage(cursor)
        .then((page) => {
          // Shuffle here, once per arrival, not inside the updater (REC-002, API-2).
          const shuffled = shuffleFeedPage(page);
          setState((current) => appendPage(current, shuffled));
        })
        // A failed load can be tried again by the next trigger (the next
        // settled scroll); showing the failure is REC-018's.
        .catch(() => requests.current.fail(cursor));
    },
    [source],
  );

  // First page on mount.
  useEffect(() => load(null), [load]);

  // Next page when the active slide nears the last loaded one.
  useEffect(() => {
    if (shouldRequestNextPage(state, activeIndex)) load(state.nextCursor);
  }, [state, activeIndex, load]);

  // After the catalog ends, keep more slides ahead so the feed wraps to the first video.
  useEffect(() => {
    setState((current) => ensureCycles(current, activeIndex));
  }, [activeIndex, state.catalogEnded]);

  // Active slide from the settled scroll position: on `scrollend`, on any
  // `scroll` event that lands on a slide boundary (`scrollend` can fire before
  // a fling's snap finishes), and when the slide height changes (rotation,
  // window resize), since a re-snap may not fire `scrollend`.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => setActiveIndex(activeIndexFrom(element.scrollTop, element.clientHeight));
    const onScroll = () => {
      const settled = settledIndexFrom(element.scrollTop, element.clientHeight);
      if (settled !== null) setActiveIndex(settled);
    };
    update();
    element.addEventListener("scrollend", update);
    element.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(element);
    return () => {
      element.removeEventListener("scrollend", update);
      element.removeEventListener("scroll", onScroll);
      resize.disconnect();
    };
  }, []);

  const slides = buildSlides(state);
  const activeKey = slides[activeIndex]?.key ?? null;
  const latest = useRef({ activeKey, soundOn });
  latest.current = { activeKey, soundOn };

  // The active slide and the sound state reach every player; the others stop first.
  useEffect(() => {
    debugLog(`feed: active=${activeKey} soundOn=${soundOn}`);
    syncActive(controllers.current, activeKey, soundOn);
  }, [activeKey, soundOn]);

  // A hidden tab pauses the playing video; a visible one resumes it if the app paused it.
  useEffect(() => {
    const apply = () => {
      const visible = document.visibilityState === "visible";
      for (const playback of controllers.current.values()) playback.setTabVisible(visible);
    };
    document.addEventListener("visibilitychange", apply);
    return () => document.removeEventListener("visibilitychange", apply);
  }, []);

  const registerPlayback = useCallback((key: string, playback: SlidePlayback | null) => {
    if (playback === null) {
      controllers.current.delete(key);
      return;
    }
    controllers.current.set(key, playback);
    playback.setTabVisible(document.visibilityState === "visible");
    syncActive(controllers.current, latest.current.activeKey, latest.current.soundOn);
  }, []);

  // REC-007 listens to this: every end of a video, including each loop.
  const announceEnded = useCallback((youtubeId: string) => {
    scroller.current?.dispatchEvent(new CustomEvent("videoended", { bubbles: true, detail: { youtubeId } }));
  }, []);

  // Unmuted autoplay was refused, so the video plays muted and the button comes back.
  const soundBlocked = useCallback(() => {
    debugLog("feed: sound refused -> button back");
    setSoundOn(false);
  }, []);

  return (
    <div ref={scroller} className={styles.feed} data-testid="feed">
      <DebugLog />
      {slides.map((slide, index) => (
        <section
          key={slide.key}
          className={styles.slide}
          data-testid="feed-slide"
          data-youtube-id={slide.item.youtubeId}
          data-active={index === activeIndex ? "true" : undefined}
          aria-label={slide.item.title}
        >
          <div className={styles.frame} data-testid="feed-frame">
            {inPlayerWindow(index, activeIndex) && (
              <SlideVideo
                youtubeId={slide.item.youtubeId}
                title={slide.item.title}
                onPlayback={(playback) => registerPlayback(slide.key, playback)}
                onEnded={announceEnded}
                onSoundBlocked={soundBlocked}
                onSoundChanged={setSoundOn}
              />
            )}
            {index === activeIndex && !soundOn && (
              <button
                type="button"
                className={styles.unmute}
                data-testid="unmute-button"
                aria-label="Turn sound on"
                onClick={() => setSoundOn(true)}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7-1.4-1.4L15.2 10.6l-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4L16.6 12z"
                  />
                </svg>
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
