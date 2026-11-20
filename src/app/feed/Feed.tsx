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
  shouldRequestNextPage,
} from "../../lib/feed/feed-state";
import { createHttpFeedSource } from "../../lib/feed/http-source";
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
  const [loading, setLoading] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  // Each page is requested once, even when React runs an effect twice.
  const requested = useRef(new Set<string>());

  const load = useCallback(
    (cursor: string | null) => {
      const key = cursor ?? "";
      if (requested.current.has(key)) return;
      requested.current.add(key);
      setLoading(true);
      source
        .getPage(cursor)
        .then((page) => setState((current) => appendPage(current, page)))
        // A failed page load is shown by REC-018; here the feed just stops growing.
        .catch(() => undefined)
        .finally(() => setLoading(false));
    },
    [source],
  );

  // First page on mount.
  useEffect(() => load(null), [load]);

  // Next page, one request at a time, when the active slide nears the last loaded one.
  useEffect(() => {
    if (!loading && shouldRequestNextPage(state, activeIndex)) load(state.nextCursor);
  }, [state, activeIndex, loading, load]);

  // After the catalog ends, keep more slides ahead so the feed wraps to the first video.
  useEffect(() => {
    setState((current) => ensureCycles(current, activeIndex));
  }, [activeIndex, state.catalogEnded]);

  // Active slide from the settled scroll position.
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => setActiveIndex(activeIndexFrom(element.scrollTop, element.clientHeight));
    update();
    element.addEventListener("scrollend", update);
    return () => element.removeEventListener("scrollend", update);
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
