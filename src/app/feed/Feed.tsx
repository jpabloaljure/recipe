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
import styles from "./Feed.module.css";

/**
 * The vertical swipe feed (REC-001). Native CSS scroll-snap moves one video
 * per gesture; the active slide is read on `scrollend`. Pages come from
 * `GET /api/feed`; after the last page the visit order is appended again, so
 * the feed wraps to the first video with an ordinary snap.
 *
 * Out of scope here: the player API, autoplay and loop (REC-003), preloading
 * (REC-004), and loading, empty and error states (REC-018).
 */
export function Feed() {
  const source = useMemo(() => createHttpFeedSource(), []);
  const [state, setState] = useState<FeedState>(initialFeedState);
  const [activeIndex, setActiveIndex] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={scroller} className={styles.feed} data-testid="feed">
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
              <iframe
                className={styles.player}
                src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(slide.item.youtubeId)}?playsinline=1&rel=0`}
                title={slide.item.title}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                // YouTube refuses embeds sent with no referrer (player error 153).
                referrerPolicy="strict-origin-when-cross-origin"
              />
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
