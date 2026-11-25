import { useEffect, useRef } from "react";

/**
 * Whether there is room for the recipe panel: at least 260 px on each side of the
 * video, that is, width >= 56.25vh + 520px (REC-006, design Decision 2). The same
 * query is written in the CSS of the panel, the sheet and the "Recipe" button
 * (a unit test checks they agree): CSS decides what is shown, with no flash of the
 * wrong layout, and this query only tells JavaScript when the answer changes.
 */
export const PANEL_MEDIA_QUERY = "(min-width: calc(56.25vh + 520px))";

/** Where the unmute and Recipe buttons are over the video (a tall screen). Also written in `Feed.module.css`. */
export const TALL_SCREEN_MEDIA_QUERY = "(max-aspect-ratio: 3/4)";

/** Calls `onChange` whenever the answer to `PANEL_MEDIA_QUERY` or `TALL_SCREEN_MEDIA_QUERY` changes, in either direction. */
export function usePanelRoomChange(onChange: () => void): void {
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(() => {
    const queries = [PANEL_MEDIA_QUERY, TALL_SCREEN_MEDIA_QUERY].map((q) => window.matchMedia(q));
    const changed = () => latest.current();
    for (const query of queries) query.addEventListener("change", changed);
    return () => {
      for (const query of queries) query.removeEventListener("change", changed);
    };
  }, []);
}
