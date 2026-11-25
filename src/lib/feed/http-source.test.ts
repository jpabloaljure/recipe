import { describe, expect, it, vi } from "vitest";
import type { Timers } from "../player/types";
import { createHttpFeedSource, FEED_REQUEST_TIMEOUT_MS, FeedRequestError, FeedTimeoutError } from "./http-source";
import type { FeedPage } from "./types";

const page: FeedPage = {
  items: [{ youtubeId: "video1", title: "Video 1", channelName: null, recipe: null }],
  nextCursor: "eyJvIjozfQ",
};

function fetchReturning(status: number, body: unknown) {
  return vi.fn(async (_url: string | URL | Request, _init?: RequestInit) => Response.json(body, { status }));
}

describe("createHttpFeedSource", () => {
  it("asks for the first page with no cursor", async () => {
    const fetchImpl = fetchReturning(200, page);
    const result = await createHttpFeedSource(fetchImpl).getPage(null);

    expect(fetchImpl.mock.calls[0][0]).toBe("/api/feed");
    expect(result).toEqual(page);
  });

  it("passes the cursor back unchanged", async () => {
    const fetchImpl = fetchReturning(200, page);
    await createHttpFeedSource(fetchImpl).getPage("eyJvIjozfQ");

    const url = new URL(fetchImpl.mock.calls[0][0] as string, "http://localhost");
    expect(url.pathname).toBe("/api/feed");
    expect(url.searchParams.get("cursor")).toBe("eyJvIjozfQ");
  });

  it("throws on a non-2xx response", async () => {
    const fetchImpl = fetchReturning(400, { error: { code: "invalid_cursor", message: "x" } });

    await expect(createHttpFeedSource(fetchImpl).getPage("bad")).rejects.toEqual(new FeedRequestError(400));
  });
});

/** Timers a test fires by hand, so nothing waits for real (AGENTS.md E2E rule 6). */
function manualTimers() {
  const pending = new Map<number, { callback: () => void; ms: number }>();
  let next = 1;
  const timers: Timers = {
    set: (callback, ms) => {
      pending.set(next, { callback, ms });
      return next++;
    },
    clear: (handle) => void pending.delete(handle as number),
  };
  return { timers, pending, fire: () => [...pending.values()].forEach((timer) => timer.callback()) };
}

/** A fetch that never answers until its request is aborted, as a hung connection does. */
function hungFetch() {
  return vi.fn(
    (_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      }),
  );
}

describe("the 10-second timeout (REC-018)", () => {
  it("waits 10 seconds by default", async () => {
    const { timers, pending } = manualTimers();
    await createHttpFeedSource(fetchReturning(200, page), timers).getPage(null);
    expect(FEED_REQUEST_TIMEOUT_MS).toBe(10_000);
    expect([...pending.values()]).toEqual([]); // cleared once the page arrived
  });

  it("fails the first page when it does not answer in time", async () => {
    const { timers, pending, fire } = manualTimers();
    const request = createHttpFeedSource(hungFetch(), timers).getPage(null);
    expect([...pending.values()].map((timer) => timer.ms)).toEqual([10_000]);

    fire();

    await expect(request).rejects.toEqual(new FeedTimeoutError());
  });

  it("fails a next page the same way", async () => {
    const { timers, fire } = manualTimers();
    const request = createHttpFeedSource(hungFetch(), timers).getPage("eyJvIjozfQ");

    fire();

    await expect(request).rejects.toBeInstanceOf(FeedTimeoutError);
  });

  it("reports a failure that happens before the time is up as that failure", async () => {
    const { timers } = manualTimers();
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(createHttpFeedSource(fetchImpl, timers).getPage(null)).rejects.toBeInstanceOf(TypeError);
  });
});
