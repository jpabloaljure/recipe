import { useEffect, useRef } from "react";

/**
 * Whether there is room for the recipe panel: at least 260 px on each side of the
 * video, that is, width >= 56.25vh + 520px (REC-006, design Decision 2). The same
 * query is written in the CSS of the panel, the sheet and the "Recipe" button
 * (a unit test checks they agree): CSS decides what is shown, with no flash of the
 * wrong layout, and this query only tells JavaScript when the answer changes.
 */
export const PANEL_MEDIA_QUERY = "(min-width: calc(56.25vh + 520px))";

/** Calls `onChange` whenever the answer to `PANEL_MEDIA_QUERY` changes, in either direction. */
export function usePanelRoomChange(onChange: () => void): void {
  const latest = useRef(onChange);
  latest.current = onChange;
  useEffect(() => {
    const query = window.matchMedia(PANEL_MEDIA_QUERY);
    const changed = () => latest.current();
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }, []);
}
