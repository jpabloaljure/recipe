import { describe, expect, it } from "vitest";
import { FIXTURE_ITEMS } from "../../../lib/feed/fixture";
import { GET } from "./route";

// Expected values are written here by hand and checked against
// docs/api/openapi.yaml in review (REC-021 Conformance; no YAML parser).

const get = (query = "") => GET(new Request(`http://localhost/api/feed${query}`));

describe("GET /api/feed (stub)", () => {
  it("returns the first page, cacheable, in the contract's shape", async () => {
    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, s-maxage=3600");
    expect(response.headers.get("Content-Type")).toContain("application/json");

    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["items", "nextCursor"]);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(10);
    expect(body.items[0]).toEqual(FIXTURE_ITEMS[0]);
    for (const item of body.items) {
      expect(Object.keys(item).sort()).toEqual(["channelName", "recipe", "title", "youtubeId"]);
    }
    expect(typeof body.nextCursor).toBe("string");
  });

  it("returns the next page for a page's cursor, and null on the last page", async () => {
    const seen: string[] = [];
    let query = "";
    for (;;) {
      const body = await (await get(query)).json();
      seen.push(...body.items.map((item: { youtubeId: string }) => item.youtubeId));
      if (body.nextCursor === null) break;
      query = `?cursor=${encodeURIComponent(body.nextCursor)}`;
    }
    expect(seen).toEqual(FIXTURE_ITEMS.map((item) => item.youtubeId));
  });

  it.each([
    ["the empty string", "?cursor="],
    ["a value that cannot be decoded", "?cursor=not-a-cursor"],
  ])("returns 400 invalid_cursor, not cached, for %s", async (_label, query) => {
    const response = await get(query);

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: { code: "invalid_cursor", message: expect.any(String) },
    });
  });
});
