import { describe, expect, it } from "vitest";
import {
  activeIndexFrom,
  appendPage,
  buildSlides,
  endSlideMode,
  ensureCycles,
  type FeedState,
  initialFeedState,
  inPlayerWindow,
  MAX_SKIPS_IN_A_ROW,
  pageFailed,
  restart,
  retryNextPage,
  settledIndexFrom,
  shouldRequestNextPage,
  silentRetry,
  skipVideo,
  slideIndexOfKey,
  videoPlayed,
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

  it("adds a page's videos in the order given and keeps the pages already in the visit order", () => {
    const first = appendPage(initialFeedState, pageOf(["c", "a", "b"], "c1"));
    const second = appendPage(first, pageOf(["f", "d", "e"], "c2"));
    const third = appendPage(second, pageOf(["h", "g"], null));
    expect(third.visit.map((i) => i.youtubeId)).toEqual(["c", "a", "b", "f", "d", "e", "h", "g"]);
    expect(third.visit.slice(0, 3)).toEqual(first.visit);
    expect(third.visit.slice(0, 6)).toEqual(second.visit);
  });

  it("gives the same result when run twice (no randomness inside)", () => {
    const page = pageOf(["a", "b", "c"], "c1");
    expect(appendPage(initialFeedState, page)).toEqual(appendPage(initialFeedState, page));
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

describe("first page states (REC-018)", () => {
  it("starts loading", () => {
    expect(initialFeedState.status).toBe("loading");
  });

  it("is ready when the first page has videos", () => {
    expect(appendPage(initialFeedState, pageOf(["a"], null)).status).toBe("ready");
  });

  it("is empty when the catalog has no video", () => {
    expect(appendPage(initialFeedState, pageOf([], null)).status).toBe("empty");
  });

  it("is an error when the first page fails", () => {
    expect(pageFailed(initialFeedState).status).toBe("error");
  });

  it("keeps the videos and marks the next page failed when a later page fails", () => {
    const state = pageFailed(appendPage(initialFeedState, pageOf(["a", "b"], "c1")));
    expect(state.status).toBe("ready");
    expect(state.nextPageFailed).toBe(true);
    expect(ids(state)).toEqual(["a", "b"]);
  });

  it("starts over from the error view with a clean visit and no skipped videos", () => {
    const state = skipVideo(appendPage(initialFeedState, pageOf(["a", "b"], "c1")), "a", true);
    expect(restart()).toEqual(initialFeedState);
    expect(restart().skipped).toEqual([]);
    expect(state.skipped).toEqual(["a"]);
  });

  it("ignores a page that arrives after the error view was shown", () => {
    const failed = pageFailed(initialFeedState);
    expect(appendPage(failed, pageOf(["a"], null))).toBe(failed);
  });
});

describe("end slide (REC-018)", () => {
  const more = () => appendPage(initialFeedState, pageOf(["a", "b", "c"], "c1"));

  it("shows a loading indicator while more pages remain", () => {
    expect(endSlideMode(more())).toBe("loading");
  });

  it("offers a retry after a failed page, and loading again after the retry", () => {
    const failed = pageFailed(more());
    expect(endSlideMode(failed)).toBe("retry");
    expect(endSlideMode(retryNextPage(failed))).toBe("loading");
  });

  it("does not request the next page while the retry row waits", () => {
    expect(shouldRequestNextPage(pageFailed(more()), 2)).toBe(false);
    expect(shouldRequestNextPage(retryNextPage(pageFailed(more())), 2)).toBe(true);
  });

  it("retries silently when I come back to a video near the end", () => {
    const failed = pageFailed(more());
    expect(silentRetry(failed, 1).nextPageFailed).toBe(false);
  });

  it("keeps the retry row on the end slide and far from the end", () => {
    const failed = pageFailed(appendPage(initialFeedState, pageOf(["a", "b", "c", "d", "e", "f"], "c1")));
    expect(silentRetry(failed, 6)).toBe(failed); // the end slide itself
    expect(silentRetry(failed, 0)).toBe(failed); // far from the end
  });

  it("is absent once the catalog has ended, when the feed wraps instead", () => {
    expect(endSlideMode(appendPage(initialFeedState, pageOf(["a"], null)))).toBeNull();
  });

  it("is absent on the error view and before the first page", () => {
    expect(endSlideMode(initialFeedState)).toBeNull();
    expect(endSlideMode(pageFailed(initialFeedState))).toBeNull();
  });

  it("stays after the last remaining slide when a video next to it is dropped", () => {
    const state = skipVideo(more(), "c", false);
    expect(ids(state)).toEqual(["a", "b"]);
    expect(endSlideMode(state)).toBe("loading");
  });
});

describe("skipped videos (REC-018)", () => {
  const three = () => appendPage(initialFeedState, pageOf(["a", "b", "c"], null));

  it("drops a video from the visit and from every repeat of the list", () => {
    const state = ensureCycles(skipVideo(three(), "b", true), 4);
    expect(ids(state).filter((id) => id === "b")).toEqual([]);
    expect(state.cycles).toBeGreaterThan(1);
  });

  it("never lets a later page bring a skipped video back", () => {
    const state = appendPage(skipVideo(appendPage(initialFeedState, pageOf(["a", "b"], "c1")), "b", true), pageOf(["b", "c"], null));
    expect(ids(state)).toEqual(["a", "c"]);
  });

  it("drops the same video once", () => {
    const state = skipVideo(three(), "a", true);
    expect(skipVideo(state, "a", true)).toBe(state);
  });

  it("counts only an active video towards the videos skipped in a row", () => {
    expect(skipVideo(three(), "a", false).skipsInARow).toBe(0);
    expect(skipVideo(three(), "a", true).skipsInARow).toBe(1);
  });

  it("shows the error view after three active videos in a row", () => {
    let state = appendPage(initialFeedState, pageOf(["a", "b", "c", "d"], null));
    for (const id of ["a", "b"]) state = skipVideo(state, id, true);
    expect(state.status).toBe("ready");
    state = skipVideo(state, "c", true);
    expect(state.skipsInARow).toBe(MAX_SKIPS_IN_A_ROW);
    expect(state.status).toBe("error");
  });

  it("starts the count over when a video plays", () => {
    let state = appendPage(initialFeedState, pageOf(["a", "b", "c", "d", "e"], null));
    state = skipVideo(skipVideo(state, "a", true), "b", true);
    state = videoPlayed(state);
    state = skipVideo(skipVideo(state, "c", true), "d", true);
    expect(state.status).toBe("ready");
  });

  it("shows the error view when no video is left and no page remains", () => {
    const state = skipVideo(appendPage(initialFeedState, pageOf(["a"], null)), "a", false);
    expect(state.status).toBe("error");
  });

  it("asks for the next page at once when every loaded video was skipped but a page remains", () => {
    const state = skipVideo(appendPage(initialFeedState, pageOf(["a"], "c1")), "a", true);
    expect(state.status).toBe("ready");
    expect(shouldRequestNextPage(state, 0)).toBe(true);
  });

  it("is not an empty catalog when a page holds only skipped videos", () => {
    const skipped = skipVideo(appendPage(initialFeedState, pageOf(["a"], "c1")), "a", true);
    expect(appendPage(skipped, pageOf(["a"], null)).status).toBe("error");
  });

  it("finds the new index of the active video after earlier videos are dropped", () => {
    const state = ensureCycles(three(), 4);
    const before = buildSlides(state);
    const key = before[4].key; // second cycle, "b"
    const after = buildSlides(skipVideo(state, "a", false));
    expect(slideIndexOfKey(before, key)).toBe(4);
    expect(slideIndexOfKey(after, key)).toBe(2);
    expect(slideIndexOfKey(after, "9-zz")).toBe(-1);
    expect(slideIndexOfKey(after, null)).toBe(-1);
  });
});
