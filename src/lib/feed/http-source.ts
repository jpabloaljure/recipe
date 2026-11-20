import type { FeedPage, FeedSource } from "./types";

/** Thrown when the feed API answers with a non-2xx status (shown by REC-018). */
export class FeedRequestError extends Error {
  constructor(readonly status: number) {
    super(`GET /api/feed failed with status ${status}`);
    this.name = "FeedRequestError";
  }
}

/**
 * The feed client's source: `GET /api/feed`, then `?cursor=<nextCursor>`
 * with the cursor passed back unchanged (docs/api/openapi.yaml).
 */
export function createHttpFeedSource(fetchImpl: typeof fetch = (...args) => fetch(...args)): FeedSource {
  return {
    async getPage(cursor) {
      const url = cursor === null ? "/api/feed" : `/api/feed?cursor=${encodeURIComponent(cursor)}`;
      const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new FeedRequestError(response.status);
      return (await response.json()) as FeedPage;
    },
  };
}
