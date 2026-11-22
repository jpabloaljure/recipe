// The feed cursor (REC-002, design D1): the position of the last video of a
// page, as (the time it entered the feed, its id). The client treats it as an
// opaque string and passes it back unchanged.

export type FeedPosition = {
  /** When the last video of the page entered the feed (millisecond precision). */
  enteredFeedAt: Date;
  id: number;
};

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
    if (!Number.isSafeInteger(i) || i < 1) return { ok: false };
    const enteredFeedAt = new Date(t);
    if (Number.isNaN(enteredFeedAt.getTime()) || enteredFeedAt.toISOString() !== t) return { ok: false };
    return { ok: true, position: { enteredFeedAt, id: i } };
  } catch {
    return { ok: false };
  }
}
