import { FIXTURE_ITEMS } from "./fixture";
import type { FeedItem, FeedPage } from "./types";

/** Items per page of the stub feed: small, so the fixture spans several pages. */
export const FIXTURE_PAGE_SIZE = 3;

/**
 * The cursor is opaque to clients (REC-021). Here it is the next offset,
 * as base64url-encoded JSON: `{"o":3}` → `eyJvIjozfQ`.
 */
export function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset }), "utf8").toString("base64url");
}

/** The offset in a cursor, or `null` when the cursor cannot be decoded. */
export function decodeCursor(cursor: string): number | null {
  if (!/^[A-Za-z0-9_-]+$/.test(cursor)) return null;
  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const offset = (value as { o?: unknown }).o;
  return typeof offset === "number" && Number.isInteger(offset) && offset > 0 ? offset : null;
}

export type FixturePageResult = { ok: true; page: FeedPage } | { ok: false };

/**
 * The page a cursor points to. `null` asks for the first page. A cursor that
 * cannot be decoded, or that points past the end, is not ok (the route
 * answers 400 `invalid_cursor`).
 */
export function getFixturePage(
  cursor: string | null,
  items: readonly FeedItem[] = FIXTURE_ITEMS,
  pageSize: number = FIXTURE_PAGE_SIZE,
): FixturePageResult {
  let offset = 0;
  if (cursor !== null) {
    const decoded = decodeCursor(cursor);
    if (decoded === null || decoded >= items.length) return { ok: false };
    offset = decoded;
  }
  const end = offset + pageSize;
  return {
    ok: true,
    page: {
      items: items.slice(offset, end),
      nextCursor: end < items.length ? encodeCursor(end) : null,
    },
  };
}
