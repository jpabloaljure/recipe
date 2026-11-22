// The feed cursor (REC-002, design D1): the position of the last video of a
// page, as (the time it entered the feed, its id). The client treats it as an
// opaque string and passes it back unchanged.

export type FeedPosition = {
  /** When the last video of the page entered the feed (millisecond precision). */
  enteredFeedAt: Date;
  id: number;
};

/** The largest id of the `video.id` column (a 32-bit integer). */
const MAX_ID = 2_147_483_647;
/** Feed-entry times are recent; anything outside 1970–9999 is not one this module made. */
const MIN_TIME = Date.UTC(1970, 0, 1);
const MAX_TIME = Date.UTC(9999, 11, 31, 23, 59, 59, 999);

export type DecodedCursor = { ok: true; position: FeedPosition } | { ok: false };

/** base64url JSON `{"t": "<ISO time>", "i": <id>}`. */
export function encodeCursor(position: FeedPosition): string {
  const json = JSON.stringify({ t: position.enteredFeedAt.toISOString(), i: position.id });
  return Buffer.from(json, "utf8").toString("base64url");
}

/** Anything that is not a cursor this module made (the empty string included) is `{ ok: false }`. */
export function decodeCursor(cursor: string): DecodedCursor {
  if (!/^[A-Za-z0-9_-]+$/.test(cursor)) return { ok: false };
  try {
    const value: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof value !== "object" || value === null) return { ok: false };
    const { t, i } = value as Record<string, unknown>;
    if (typeof t !== "string" || typeof i !== "number") return { ok: false };
    if (!Number.isSafeInteger(i) || i < 1 || i > MAX_ID) return { ok: false };
    const enteredFeedAt = new Date(t);
    const time = enteredFeedAt.getTime();
    if (Number.isNaN(time) || time < MIN_TIME || time > MAX_TIME) return { ok: false };
    if (enteredFeedAt.toISOString() !== t) return { ok: false };
    return { ok: true, position: { enteredFeedAt, id: i } };
  } catch {
    return { ok: false };
  }
}
