"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  activeIndexFrom,
  appendPage,
  buildSlides,
  endSlideMode,
  ensureCycles,
  type FeedState,
  initialFeedState,
  inPlayerWindow,
  pageFailed,
  restart,
  retryNextPage,
  settledIndexFrom,
  shouldRequestNextPage,
  silentRetry,
  skipVideo,
  slideIndexOfKey,
  videoPlayed,
} from "../../lib/feed/feed-state";
import { createHttpFeedSource } from "../../lib/feed/http-source";
import { PageRequests } from "../../lib/feed/page-requests";
import { shuffleFeedPage } from "../../lib/feed/shuffle";
import { type SlidePlayback, syncActive } from "../../lib/player/playback";
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
 * REC-018: a status view stands in for the slides while the first page loads,
 * is empty or failed; an end slide shows a loading indicator or a retry row
 * while more pages remain; a video that cannot play is dropped, in every repeat
 * of the list, with the watched video kept on screen.
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
  // A Retry on the error view starts a new generation: answers to older requests are ignored.
  const generation = useRef(0);
  // What event handlers read: updated at once, so two events in one tick see each other's change.
  const current = useRef({ state, activeIndex });
  current.current = { state, activeIndex };

  // Every state change goes through here, so `current` already holds it when the next event arrives.
  const update = useCallback((change: (previous: FeedState) => FeedState) => {
    const next = change(current.current.state);
    if (next === current.current.state) return;
    current.current = { ...current.current, state: next };
    setState(next);
  }, []);

  // A gesture that lands on another video ends the count of videos skipped in a row (a skip alone does not).
  const moveTo = useCallback(
    (index: number) => {
      if (index !== current.current.activeIndex) update(videoPlayed);
      current.current = { ...current.current, activeIndex: index };
      setActiveIndex(index);
    },
    [update],
  );

  const load = useCallback(
    (cursor: string | null) => {
      if (!requests.current.begin(cursor)) return;
      const mine = generation.current;
      source
        .getPage(cursor)
        .then((page) => {
          if (generation.current !== mine) return;
          // Shuffle here, once per arrival, not inside the updater (REC-002, API-2).
          const shuffled = shuffleFeedPage(page);
          update((previous) => appendPage(previous, shuffled));
        })
        .catch(() => {
          if (generation.current !== mine) return;
          // The cursor is freed so the silent retry or the retry row can ask again.
          requests.current.fail(cursor);
          update(pageFailed);
        });
    },
    [source, update],
  );

  // First page on mount.
  useEffect(() => load(null), [load]);

  // Next page when the active slide nears the last loaded one.
  useEffect(() => {
    if (shouldRequestNextPage(state, activeIndex)) load(state.nextCursor);
  }, [state, activeIndex, load]);

  // Coming back to a video near the end retries a failed page without a tap.
  useEffect(() => {
    update((previous) => silentRetry(previous, activeIndex));
  }, [activeIndex, update]);

  // After the catalog ends, keep more slides ahead so the feed wraps to the first video.
  useEffect(() => {
    update((previous) => ensureCycles(previous, activeIndex));
  }, [activeIndex, state.catalogEnded, state.visit.length, update]);

  // Active slide from the settled scroll position: on `scrollend`, on any
  // `scroll` event that lands on a slide boundary (`scrollend` can fire before
  // a fling's snap finishes), and when the slide height changes (rotation,
  // window resize), since a re-snap may not fire `scrollend`.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const settle = () => moveTo(activeIndexFrom(element.scrollTop, element.clientHeight));
    const onScroll = () => {
      const settled = settledIndexFrom(element.scrollTop, element.clientHeight);
      if (settled !== null) moveTo(settled);
    };
    settle();
    element.addEventListener("scrollend", settle);
    element.addEventListener("scroll", onScroll, { passive: true });
    const resize = new ResizeObserver(settle);
    resize.observe(element);
    return () => {
      element.removeEventListener("scrollend", settle);
      element.removeEventListener("scroll", onScroll);
      resize.disconnect();
    };
  }, [moveTo]);

  const slides = buildSlides(state);
  const showSlides = state.status === "ready";
  const activeKey = showSlides ? (slides[activeIndex]?.key ?? null) : null;
  const nextKey = showSlides ? (slides[activeIndex + 1]?.key ?? null) : null;
  const latest = useRef({ activeKey, nextKey, soundOn });
  latest.current = { activeKey, nextKey, soundOn };

  // REC-004: once the active video plays, the next one is warmed up (muted, out of sight, about a second).
  const warmUpNext = useCallback(() => {
    const { activeKey: active, nextKey: next } = latest.current;
    if (active === null || next === null) return;
    if (controllers.current.get(active)?.isPlaying()) controllers.current.get(next)?.warmUp();
  }, []);

  // The active video plays: the count of videos skipped in a row starts over, and the next video is warmed up.
  const activePlaying = useCallback(() => {
    update(videoPlayed);
    warmUpNext();
  }, [update, warmUpNext]);

  // The active slide and the sound state reach every player; the others stop first.
  useEffect(() => {
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

  const registerPlayback = useCallback(
    (key: string, playback: SlidePlayback | null) => {
      if (playback === null) {
        controllers.current.delete(key);
        return;
      }
      controllers.current.set(key, playback);
      playback.setTabVisible(document.visibilityState === "visible");
      syncActive(controllers.current, latest.current.activeKey, latest.current.soundOn);
      warmUpNext();
    },
    [warmUpNext],
  );

  // REC-007 listens to this: every end of a video, including each loop.
  const announceEnded = useCallback((youtubeId: string) => {
    scroller.current?.dispatchEvent(new CustomEvent("videoended", { bubbles: true, detail: { youtubeId } }));
  }, []);

  // Unmuted autoplay was refused, so the video plays muted and the button comes back.
  const soundBlocked = useCallback(() => setSoundOn(false), []);

  // A video was removed or cannot be embedded: drop it and keep the watched video where it is.
  const unplayable = useCallback((youtubeId: string) => {
    const { state: before, activeIndex: index } = current.current;
    const slidesBefore = buildSlides(before);
    const wasActive = slidesBefore[index]?.item.youtubeId === youtubeId;
    const after = skipVideo(before, youtubeId, wasActive);
    if (after === before) return;
    const slidesAfter = buildSlides(after);
    // The active video's own slot goes to the next video; otherwise follow the watched slide's key.
    // The browser's scroll-snap keeps the snapped slide through the change (checked in Chromium).
    const watched = wasActive ? -1 : slideIndexOfKey(slidesAfter, slidesBefore[index]?.key ?? null);
    const target = watched >= 0 ? watched : Math.min(index, slidesAfter.length);
    current.current = { state: after, activeIndex: target };
    setState(after);
    setActiveIndex(target);
  }, []);

  // Retry on the error view: start over, as on a first load.
  const retryAll = useCallback(() => {
    if (current.current.state.status !== "error") return; // a second tap while the first runs
    generation.current += 1;
    requests.current = new PageRequests();
    const fresh = restart();
    current.current = { state: fresh, activeIndex: 0 };
    setState(fresh);
    setActiveIndex(0);
    if (scroller.current) scroller.current.scrollTop = 0;
    load(null);
  }, [load]);

  const endMode = endSlideMode(state);

  return (
    <div ref={scroller} className={styles.feed} data-testid="feed">
      {state.status === "loading" && (
        <section className={styles.status} data-testid="feed-status" aria-busy="true">
          <p role="status" className={styles.statusText} data-testid="feed-loading">
            Loading recipes…
          </p>
        </section>
      )}
      {state.status === "empty" && (
        <section className={styles.status} data-testid="feed-status">
          <p role="status" className={styles.statusText}>
            No recipes yet
          </p>
        </section>
      )}
      {state.status === "error" && (
        <section className={styles.status} data-testid="feed-status">
          <p role="alert" className={styles.statusText}>
            Oops, something went wrong
          </p>
          <button type="button" className={styles.retry} onClick={retryAll}>
            Retry
          </button>
        </section>
      )}
      {showSlides &&
        slides.map((slide, index) => (
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
                  onUnplayable={unplayable}
                  onPlaying={activePlaying}
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
      {showSlides && endMode !== null && (
        <section className={styles.endSlide} data-testid="feed-end">
          {endMode === "loading" ? (
            <p role="status" className={styles.statusText} data-testid="feed-loading">
              Loading more…
            </p>
          ) : (
            <button type="button" className={styles.retry} onClick={() => update(retryNextPage)}>
              Retry
            </button>
          )}
        </section>
      )}
    </div>
  );
}
