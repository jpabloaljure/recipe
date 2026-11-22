import { describe, expect, it } from "vitest";
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
} from "./feed-state";
import type { FeedItem, FeedPage } from "./types";

/** A random source that keeps the order, so these tests can list videos in arrival order. */
const keepOrder = () => 0.999999;
const append = (state: FeedState, page: FeedPage) => appendPage(state, page, keepOrder);

const item = (id: string): FeedItem => ({ youtubeId: id, title: id, channelName: null, recipe: null });
const pageOf = (ids: string[], nextCursor: string | null): FeedPage => ({ items: ids.map(item), nextCursor });
const ids = (state: FeedState) => buildSlides(state).map((slide) => slide.item.youtubeId);

/** A catalog loaded over three pages: a b c | d e f | g. */
function threePages(): FeedState {
  let state = append(initialFeedState, pageOf(["a", "b", "c"], "c1"));
  state = append(state, pageOf(["d", "e", "f"], "c2"));
  return append(state, pageOf(["g"], null));
}

describe("wrap-around", () => {
  it("puts the first video of the visit order after the last catalog video", () => {
    const state = ensureCycles(append(initialFeedState, pageOf(["a", "b", "c"], null)), 2);
    expect(ids(state).slice(2, 4)).toEqual(["c", "a"]);
  });

  it("wraps to the first page's first video when the catalog spans three pages", () => {
    const state = ensureCycles(threePages(), 6);
    expect(ids(state)[6]).toBe("g");
    expect(ids(state)[7]).toBe("a");
  });

  it("continues with the second video after the wrap", () => {
    const state = ensureCycles(threePages(), 7);
    expect(ids(state)[8]).toBe("b");
  });

  it("wraps a one-video catalog to the same video", () => {
    const state = ensureCycles(append(initialFeedState, pageOf(["a"], null)), 0);
    expect(ids(state).slice(0, 2)).toEqual(["a", "a"]);
  });

  it("keeps more than two slides ahead of the active one", () => {
    const state = ensureCycles(threePages(), 12);
    expect(buildSlides(state).length - 1 - 12).toBeGreaterThan(2);
  });

  it("appends nothing before the catalog ends", () => {
    const state = append(initialFeedState, pageOf(["a", "b", "c"], "c1"));
    expect(ensureCycles(state, 2)).toBe(state);
  });

  it("has nothing before the first slide (no backward wrap)", () => {
    const state = ensureCycles(threePages(), 6);
    expect(ids(state)[0]).toBe("a");
  });

  it("keeps keys unique across cycles", () => {
    const keys = buildSlides(ensureCycles(threePages(), 20)).map((slide) => slide.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("appendPage", () => {
  it("skips a video already in the visit order", () => {
    let state = append(initialFeedState, pageOf(["a", "b"], "c1"));
    state = append(state, pageOf(["b", "c", "c"], null));
    expect(state.visit.map((i) => i.youtubeId)).toEqual(["a", "b", "c"]);
    expect(state.catalogEnded).toBe(true);
  });

  it("shuffles the videos of a received page, holding exactly the same videos", () => {
    const state = appendPage(initialFeedState, pageOf(["a", "b", "c", "d", "e"], null), () => 0);
    expect(state.visit.map((i) => i.youtubeId)).toEqual(["b", "c", "d", "e", "a"]);
  });

  it("keeps the pages already in the visit order when a later page loads", () => {
    const first = appendPage(initialFeedState, pageOf(["a", "b", "c"], "c1"), () => 0);
    const second = appendPage(first, pageOf(["d", "e", "f"], "c2"), () => 0);
    const third = appendPage(second, pageOf(["g", "h"], null), () => 0);
    expect(third.visit.slice(0, 3)).toEqual(first.visit);
    expect(third.visit.slice(0, 6)).toEqual(second.visit);
    expect(third.visit.map((i) => i.youtubeId).sort()).toEqual(["a", "b", "c", "d", "e", "f", "g", "h"]);
  });
});

describe("shouldRequestNextPage", () => {
  const firstPage = append(initialFeedState, pageOf(["a", "b", "c", "d", "e"], "c1"));

  it("requests when the active slide is within two slides of the last loaded one", () => {
    expect(shouldRequestNextPage(firstPage, 2)).toBe(true);
    expect(shouldRequestNextPage(firstPage, 4)).toBe(true);
  });

  it("does not request while more than two slides remain", () => {
    expect(shouldRequestNextPage(firstPage, 1)).toBe(false);
  });

  it("does not request after the catalog ended", () => {
    expect(shouldRequestNextPage(threePages(), 6)).toBe(false);
  });

  it("does not request before the first page arrived", () => {
    expect(shouldRequestNextPage(initialFeedState, 0)).toBe(false);
  });
});

describe("activeIndexFrom", () => {
  it("rounds to the nearest slide", () => {
    expect(activeIndexFrom(0, 800)).toBe(0);
    expect(activeIndexFrom(1590, 800)).toBe(2);
    expect(activeIndexFrom(1210, 800)).toBe(2);
    expect(activeIndexFrom(1190, 800)).toBe(1);
  });

  it("is 0 for a negative position or no slide height", () => {
    expect(activeIndexFrom(-20, 800)).toBe(0);
    expect(activeIndexFrom(500, 0)).toBe(0);
  });
});

describe("settledIndexFrom", () => {
  it("returns the slide on a boundary", () => {
    expect(settledIndexFrom(0, 800)).toBe(0);
    expect(settledIndexFrom(1600, 800)).toBe(2);
    expect(settledIndexFrom(1600.4, 800)).toBe(2);
  });

  it("returns null between slides or with no slide height", () => {
    expect(settledIndexFrom(1210, 800)).toBeNull();
    expect(settledIndexFrom(799, 800)).toBeNull();
    expect(settledIndexFrom(0, 0)).toBeNull();
  });
});

describe("inPlayerWindow", () => {
  it("is the active slide and its two neighbours", () => {
    expect([0, 1, 2, 3, 4, 5].filter((index) => inPlayerWindow(index, 3))).toEqual([2, 3, 4]);
  });

  it("is clamped at the first slide", () => {
    expect([0, 1, 2, 3].filter((index) => inPlayerWindow(index, 0))).toEqual([0, 1]);
  });
});
