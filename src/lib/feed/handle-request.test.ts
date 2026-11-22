import { describe, expect, it, vi } from "vitest";
import { encodeCursor } from "./cursor";
import { handleFeedRequest } from "./handle-request";
import type { FeedQuery } from "./query";
import type { FeedItem, FeedPage } from "./types";

// Expected values are written here by hand and checked against
// docs/api/openapi.yaml in review (REC-021 Conformance; no YAML parser).
// Names follow `feed › <Requirement> › <Scenario>`.

const item: FeedItem = { youtubeId: "AAAAAAAAAAA", title: "Pancakes", channelName: "Kitchen", recipe: null };
const get = (query: FeedQuery, search = "") => handleFeedRequest(new Request(`http://localhost/api/feed${search}`), query);
const returning = (page: FeedPage): FeedQuery => vi.fn(async () => page);
const validCursor = encodeCursor({ enteredFeedAt: new Date("2026-11-20T10:15:30.123Z"), id: 7 });

describe("feed › Feed pages are cacheable, errors and empty pages are not", () => {
  it("feed › … › First page with videos", async () => {
    const response = await get(returning({ items: [item], nextCursor: "next" }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    expect(await response.json()).toEqual({ items: [item], nextCursor: "next" });
  });

  it("feed › … › Later page with videos", async () => {
    const response = await get(returning({ items: [item], nextCursor: null }), `?cursor=${validCursor}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
  });

  it("feed › … › Empty page: the first page of an empty feed is not cached", async () => {
    const response = await get(returning({ items: [], nextCursor: null }));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ items: [], nextCursor: null });
  });

  it("feed › … › Empty page: a valid cursor with nothing after it is an empty last page, not cached", async () => {
    const response = await get(returning({ items: [], nextCursor: null }), `?cursor=${validCursor}`);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ items: [], nextCursor: null });
  });
});

describe("feed › Invalid page requests are rejected", () => {
  it.each([
    ["the empty string", "?cursor="],
    ["text that cannot be decoded", "?cursor=not-a-cursor"],
    ["the old offset cursor", `?cursor=${Buffer.from('{"o":3}').toString("base64url")}`],
  ])("feed › … › Position that cannot be understood (%s)", async (_label, search) => {
    const query = vi.fn();
    const response = await get(query, search);

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: { code: "invalid_cursor", message: expect.any(String) },
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("feed › … › Catalog cannot be read", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await get(async () => {
      throw new Error("connection refused");
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: { code: "internal_error", message: expect.any(String) },
    });
    spy.mockRestore();
  });
});

describe("the cursor reaches the query", () => {
  it("passes no position for the first page and the decoded position for a cursor", async () => {
    const query = vi.fn(async () => ({ items: [], nextCursor: null }));

    await get(query);
    await get(query, `?cursor=${validCursor}`);

    expect(query).toHaveBeenNthCalledWith(1, null);
    expect(query).toHaveBeenNthCalledWith(2, { enteredFeedAt: new Date("2026-11-20T10:15:30.123Z"), id: 7 });
  });
});
