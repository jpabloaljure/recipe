import { describe, expect, it } from "vitest";
import { FIXTURE_ITEMS } from "./fixture";
import { decodeCursor, encodeCursor, getFixturePage } from "./fixture-pages";
import type { FeedItem } from "./types";

const item = (n: number): FeedItem => ({
  youtubeId: `video${n}`,
  title: `Video ${n}`,
  channelName: null,
  recipe: null,
});
const seven = [1, 2, 3, 4, 5, 6, 7].map(item);

function page(cursor: string | null, items: readonly FeedItem[] = seven) {
  const result = getFixturePage(cursor, items, 3);
  if (!result.ok) throw new Error(`cursor ${cursor} was rejected`);
  return result.page;
}

describe("getFixturePage", () => {
  it("returns the first page with a cursor when no cursor is given", () => {
    const first = page(null);
    expect(first.items.map((i) => i.youtubeId)).toEqual(["video1", "video2", "video3"]);
    expect(first.nextCursor).toEqual(expect.any(String));
  });

  it("returns the next page for a page's cursor", () => {
    const second = page(page(null).nextCursor);
    expect(second.items.map((i) => i.youtubeId)).toEqual(["video4", "video5", "video6"]);
  });

  it("returns nextCursor null on the last page", () => {
    const third = page(page(page(null).nextCursor).nextCursor);
    expect(third.items.map((i) => i.youtubeId)).toEqual(["video7"]);
    expect(third.nextCursor).toBeNull();
  });

  it("returns nextCursor null when the last page is exactly full", () => {
    const second = page(page(null, seven.slice(0, 6)).nextCursor, seven.slice(0, 6));
    expect(second.items).toHaveLength(3);
    expect(second.nextCursor).toBeNull();
  });

  it("returns every item once, in order, across pages", () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const current = page(cursor);
      seen.push(...current.items.map((i) => i.youtubeId));
      cursor = current.nextCursor;
    } while (cursor !== null);
    expect(seen).toEqual(seven.map((i) => i.youtubeId));
  });

  it.each([
    ["the empty string", ""],
    ["not base64url", "not a cursor!"],
    ["base64url that is not JSON", "bm90IGpzb24"],
    ["JSON without an offset", encodeCursorJson({ x: 3 })],
    ["a negative offset", encodeCursorJson({ o: -3 })],
    ["offset zero", encodeCursorJson({ o: 0 })],
    ["a fractional offset", encodeCursorJson({ o: 1.5 })],
    ["an offset past the end", encodeCursor(7)],
  ])("rejects %s", (_label, cursor) => {
    expect(getFixturePage(cursor, seven, 3)).toEqual({ ok: false });
  });

  it("serves the real fixture as title-only items over several pages", () => {
    expect(FIXTURE_ITEMS.length).toBeGreaterThan(3);
    expect(FIXTURE_ITEMS.every((i) => i.recipe === null)).toBe(true);
    expect(new Set(FIXTURE_ITEMS.map((i) => i.youtubeId)).size).toBe(FIXTURE_ITEMS.length);
    expect(page(null, FIXTURE_ITEMS).nextCursor).not.toBeNull();
  });
});

describe("decodeCursor", () => {
  it("reads back the offset it encoded", () => {
    expect(decodeCursor(encodeCursor(6))).toBe(6);
  });
});

function encodeCursorJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}
