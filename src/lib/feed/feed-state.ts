import type { FeedItem, FeedPage } from "./types";

/**
 * What the feed client knows about this visit (add-vertical-swipe-feed
 * design Decisions 2–4). Pure functions only, so every rule has a unit test.
 */
/**
 * What the feed shows when it has no slide to show (REC-018): `loading` until
 * the first page arrives, `empty` for a catalog with no video, `error` for a
 * failed first page or too many skipped videos, and `ready` otherwise.
 */
export type FeedStatus = "loading" | "empty" | "error" | "ready";

/** Videos in a row the active slide may skip before the feed gives up (REC-018). */
export const MAX_SKIPS_IN_A_ROW = 3;

export type FeedState = {
  /** Every item received, in the order received: this visit's feed order. */
  visit: readonly FeedItem[];
  /** Cursor for the next page; `null` before the first page and after the last. */
  nextCursor: string | null;
  /** True once a page reported `nextCursor: null`. */
  catalogEnded: boolean;
  /** How many copies of the visit order are rendered (1 until the catalog ends). */
  cycles: number;
  status: FeedStatus;
  /** YouTube IDs dropped in this visit because they cannot play; a later page never brings them back. */
  skipped: readonly string[];
  /** Active videos dropped in a row; a video that plays ends the count. */
  skipsInARow: number;
  /** The request for the next page failed (or timed out) and has not been retried yet. */
  nextPageFailed: boolean;
};

export type Slide = {
  /** React key, unique across cycles: `<cycle>-<youtubeId>`. */
  key: string;
  item: FeedItem;
};

/** Slides to keep ahead of the active one before more are needed. */
const LOOKAHEAD = 2;

export const initialFeedState: FeedState = {
  visit: [],
  nextCursor: null,
  catalogEnded: false,
  cycles: 1,
  status: "loading",
  skipped: [],
  skipsInARow: 0,
  nextPageFailed: false,
};

/**
 * Adds a received page to the visit order. A video already in the visit is
 * skipped, so each `youtubeId` appears once per cycle and slide keys stay unique.
 * The page's videos are added in the order given: the caller shuffles the page
 * once on arrival (`shuffleFeedPage`), so this stays a pure function of its inputs.
 */
export function appendPage(state: FeedState, page: FeedPage): FeedState {
  // The error view stays until Retry starts over, so a late page cannot bring slides back.
  if (state.status === "error") return state;
  const seen = new Set([...state.visit.map((item) => item.youtubeId), ...state.skipped]);
  const added = page.items.filter((item) => {
    if (seen.has(item.youtubeId)) return false;
    seen.add(item.youtubeId);
    return true;
  });
  const visit = [...state.visit, ...added];
  return {
    ...state,
    visit,
    nextCursor: page.nextCursor,
    catalogEnded: page.nextCursor === null,
    nextPageFailed: false,
    status: statusAfterPage(visit.length, page, state.skipped.length),
  };
}

function statusAfterPage(videos: number, page: FeedPage, skipped: number): FeedStatus {
  if (videos > 0 || page.nextCursor !== null) return "ready"; // more pages may bring videos
  return page.items.length === 0 && skipped === 0 ? "empty" : "error";
}

/**
 * A page request failed or timed out. With no slide yet, that is the full
 * error view; otherwise the video stays and the end slide offers a retry.
 */
export function pageFailed(state: FeedState): FeedState {
  if (state.visit.length === 0) return { ...state, status: "error" };
  return { ...state, nextPageFailed: true };
}

/** The retry row was tapped: the next page is requested again. */
export function retryNextPage(state: FeedState): FeedState {
  return state.nextPageFailed ? { ...state, nextPageFailed: false } : state;
}

/**
 * The silent retry: when I come back to a video near the end of the list after
 * the next page failed, the page is asked for again without a tap. On the end
 * slide itself (a position past the last video) the retry row stays.
 */
export function silentRetry(state: FeedState, activeIndex: number): FeedState {
  if (!state.nextPageFailed || activeIndex > state.visit.length - 1) return state;
  return state.visit.length - 1 - activeIndex <= LOOKAHEAD ? { ...state, nextPageFailed: false } : state;
}

/** Retry on the error view: forget this visit's list and skipped videos and start over (design Decision 7). */
export function restart(): FeedState {
  return initialFeedState;
}

/**
 * A video cannot play: drop it from the visit, so it leaves every repeat of the
 * list, and remember it so no page brings it back. Only an active video counts
 * towards `MAX_SKIPS_IN_A_ROW`; a neighbour is dropped quietly (REC-018 N-D).
 * The error view shows after too many skips in a row, or when nothing is left
 * and no more pages remain.
 */
export function skipVideo(state: FeedState, youtubeId: string, wasActive: boolean): FeedState {
  if (state.skipped.includes(youtubeId)) return state;
  const visit = state.visit.filter((item) => item.youtubeId !== youtubeId);
  const skipsInARow = wasActive ? state.skipsInARow + 1 : state.skipsInARow;
  const none = visit.length === 0 && state.catalogEnded;
  return {
    ...state,
    visit,
    skipped: [...state.skipped, youtubeId],
    skipsInARow,
    status: skipsInARow >= MAX_SKIPS_IN_A_ROW || none ? "error" : state.status,
  };
}

/** A video became active and plays: the count of videos skipped in a row starts over. */
export function videoPlayed(state: FeedState): FeedState {
  return state.skipsInARow === 0 ? state : { ...state, skipsInARow: 0 };
}

/**
 * The active slide changed because the home cook moved the feed (a scroll that
 * settled on another slide): the count of videos skipped in a row starts over,
 * so a video that never played and was swiped away does not count towards the
 * next skips. A resize or a skip that shifts the list is not a gesture.
 */
export function gestureMoved(state: FeedState, from: number, to: number): FeedState {
  return from === to ? state : videoPlayed(state);
}

/**
 * The end slide after the last loaded video, shown only while more pages
 * remain: a loading indicator, or a retry row after a failed request.
 */
export function endSlideMode(state: FeedState): "loading" | "retry" | null {
  if (state.status !== "ready" || state.catalogEnded || state.nextCursor === null) return null;
  return state.nextPageFailed ? "retry" : "loading";
}

/** The index of the slide with this key, or -1. */
export function slideIndexOfKey(slides: readonly Slide[], key: string | null): number {
  return key === null ? -1 : slides.findIndex((slide) => slide.key === key);
}

/** The rendered slides: the visit order, repeated once per cycle. */
export function buildSlides(state: FeedState): Slide[] {
  const slides: Slide[] = [];
  for (let cycle = 0; cycle < state.cycles; cycle++) {
    for (const item of state.visit) slides.push({ key: `${cycle}-${item.youtubeId}`, item });
  }
  return slides;
}

/** True when the next page should be requested: near the last loaded slide, and more pages remain. */
export function shouldRequestNextPage(state: FeedState, activeIndex: number): boolean {
  if (state.status !== "ready" || state.catalogEnded || state.nextCursor === null || state.nextPageFailed) return false;
  // Every loaded video was skipped: ask for the next page at once.
  if (state.visit.length === 0) return true;
  return state.visit.length - 1 - activeIndex <= LOOKAHEAD;
}

/**
 * After the catalog has ended, appends cycles until more than two slides lie
 * ahead of the active one, so a forward swipe on the last video of the
 * catalog is an ordinary snap to the first video of the visit order.
 * Returns the same state when nothing needs appending.
 */
export function ensureCycles(state: FeedState, activeIndex: number): FeedState {
  if (!state.catalogEnded || state.visit.length === 0 || state.status !== "ready") return state;
  const needed = Math.ceil((activeIndex + LOOKAHEAD + 2) / state.visit.length);
  return needed > state.cycles ? { ...state, cycles: needed } : state;
}

/** The active slide's index from the scroll position (mandatory snap settles on a boundary). */
export function activeIndexFrom(scrollTop: number, slideHeight: number): number {
  if (slideHeight <= 0) return 0;
  return Math.max(0, Math.round(scrollTop / slideHeight));
}

/**
 * The slide index when the scroll position sits on a slide boundary (within
 * 1 px), else `null`. Mandatory snap always settles on a boundary, so this
 * catches the settled slide even when `scrollend` fires early or not at all.
 */
export function settledIndexFrom(scrollTop: number, slideHeight: number): number | null {
  if (slideHeight <= 0) return null;
  const index = activeIndexFrom(scrollTop, slideHeight);
  return Math.abs(scrollTop - index * slideHeight) < 1 ? index : null;
}

/** True for the active slide and its two neighbours, the only slides that render an iframe. */
export function inPlayerWindow(index: number, activeIndex: number): boolean {
  return Math.abs(index - activeIndex) <= 1;
}
