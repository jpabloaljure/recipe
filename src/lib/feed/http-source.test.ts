import { describe, expect, it, vi } from "vitest";
import { createHttpFeedSource, FeedRequestError } from "./http-source";
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
