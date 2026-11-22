import type { FeedItem, FeedPage } from "./types";

/**
 * What the feed client knows about this visit (add-vertical-swipe-feed
 * design Decisions 2–4). Pure functions only, so every rule has a unit test.
 */
export type FeedState = {
  /** Every item received, in the order received: this visit's feed order. */
  visit: readonly FeedItem[];
  /** Cursor for the next page; `null` before the first page and after the last. */
  nextCursor: string | null;
  /** True once a page reported `nextCursor: null`. */
  catalogEnded: boolean;
  /** How many copies of the visit order are rendered (1 until the catalog ends). */
  cycles: number;
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
};

/**
 * Adds a received page to the visit order. A video already in the visit is
 * skipped, so each `youtubeId` appears once per cycle and slide keys stay unique.
 * The page's videos are added in the order given: the caller shuffles the page
 * once on arrival (`shuffleFeedPage`), so this stays a pure function of its inputs.
 */
export function appendPage(state: FeedState, page: FeedPage): FeedState {
  const seen = new Set(state.visit.map((item) => item.youtubeId));
  const added = page.items.filter((item) => {
    if (seen.has(item.youtubeId)) return false;
    seen.add(item.youtubeId);
    return true;
  });
  return {
    ...state,
    visit: [...state.visit, ...added],
    nextCursor: page.nextCursor,
    catalogEnded: page.nextCursor === null,
  };
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
  if (state.catalogEnded || state.nextCursor === null || state.visit.length === 0) return false;
  return state.visit.length - 1 - activeIndex <= LOOKAHEAD;
}

/**
 * After the catalog has ended, appends cycles until more than two slides lie
 * ahead of the active one, so a forward swipe on the last video of the
 * catalog is an ordinary snap to the first video of the visit order.
 * Returns the same state when nothing needs appending.
 */
export function ensureCycles(state: FeedState, activeIndex: number): FeedState {
  if (!state.catalogEnded || state.visit.length === 0) return state;
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
