import type { Timers } from "../player/types";
import type { FeedPage, FeedSource } from "./types";

/** A page request that does not answer within this time counts as failed (REC-018, assumed value). */
export const FEED_REQUEST_TIMEOUT_MS = 10_000;

const browserTimers: Timers = {
  set: (callback, ms) => setTimeout(callback, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** Thrown when a page request has not answered in time. */
export class FeedTimeoutError extends Error {
  constructor() {
    super("GET /api/feed did not answer in time");
    this.name = "FeedTimeoutError";
  }
}

/** Thrown when the feed API answers with a non-2xx status. */
export class FeedRequestError extends Error {
  constructor(readonly status: number) {
    super(`GET /api/feed failed with status ${status}`);
    this.name = "FeedRequestError";
  }
}

/**
 * The feed client's source: `GET /api/feed`, then `?cursor=<nextCursor>`
 * with the cursor passed back unchanged (docs/api/openapi.yaml). A request that
 * does not answer within `timeoutMs` is aborted and fails like any other
 * (REC-018). Timers are injected so tests never wait (AGENTS.md E2E rule 6).
 */
export function createHttpFeedSource(
  fetchImpl: typeof fetch = (...args) => fetch(...args),
  timers: Timers = browserTimers,
  timeoutMs: number = FEED_REQUEST_TIMEOUT_MS,
): FeedSource {
  return {
    async getPage(cursor) {
      const url = cursor === null ? "/api/feed" : `/api/feed?cursor=${encodeURIComponent(cursor)}`;
      const controller = new AbortController();
      let timedOut = false;
      const timer = timers.set(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      try {
        const response = await fetchImpl(url, { headers: { Accept: "application/json" }, signal: controller.signal });
        if (!response.ok) throw new FeedRequestError(response.status);
        return (await response.json()) as FeedPage;
      } catch (error) {
        if (timedOut) throw new FeedTimeoutError();
        throw error;
      } finally {
        timers.clear(timer);
      }
    },
  };
}
