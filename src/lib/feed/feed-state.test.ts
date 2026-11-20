import { describe, expect, it } from "vitest";
import {
  activeIndexFrom,
  appendPage,
  buildSlides,
  ensureCycles,
  type FeedState,
  initialFeedState,
  inPlayerWindow,
  shouldRequestNextPage,
} from "./feed-state";
import type { FeedItem, FeedPage } from "./types";

const item = (id: string): FeedItem => ({ youtubeId: id, title: id, channelName: null, recipe: null });
const pageOf = (ids: string[], nextCursor: string | null): FeedPage => ({ items: ids.map(item), nextCursor });
const ids = (state: FeedState) => buildSlides(state).map((slide) => slide.item.youtubeId);

/** A catalog loaded over three pages: a b c | d e f | g. */
function threePages(): FeedState {
  let state = appendPage(initialFeedState, pageOf(["a", "b", "c"], "c1"));
  state = appendPage(state, pageOf(["d", "e", "f"], "c2"));
  return appendPage(state, pageOf(["g"], null));
}

describe("wrap-around", () => {
  it("puts the first video of the visit order after the last catalog video", () => {
    const state = ensureCycles(appendPage(initialFeedState, pageOf(["a", "b", "c"], null)), 2);
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
    const state = ensureCycles(appendPage(initialFeedState, pageOf(["a"], null)), 0);
    expect(ids(state).slice(0, 2)).toEqual(["a", "a"]);
  });

  it("keeps more than two slides ahead of the active one", () => {
    const state = ensureCycles(threePages(), 12);
    expect(buildSlides(state).length - 1 - 12).toBeGreaterThan(2);
  });

  it("appends nothing before the catalog ends", () => {
    const state = appendPage(initialFeedState, pageOf(["a", "b", "c"], "c1"));
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
    let state = appendPage(initialFeedState, pageOf(["a", "b"], "c1"));
    state = appendPage(state, pageOf(["b", "c", "c"], null));
    expect(state.visit.map((i) => i.youtubeId)).toEqual(["a", "b", "c"]);
    expect(state.catalogEnded).toBe(true);
  });
});

describe("shouldRequestNextPage", () => {
  const firstPage = appendPage(initialFeedState, pageOf(["a", "b", "c", "d", "e"], "c1"));

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

describe("inPlayerWindow", () => {
  it("is the active slide and its two neighbours", () => {
    expect([0, 1, 2, 3, 4, 5].filter((index) => inPlayerWindow(index, 3))).toEqual([2, 3, 4]);
  });

  it("is clamped at the first slide", () => {
    expect([0, 1, 2, 3].filter((index) => inPlayerWindow(index, 0))).toEqual([0, 1]);
  });
});
