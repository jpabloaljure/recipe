// Database tests for the feed-entry time and the `rejected` rule
// (spec video-catalog; migration 0001). One test per scenario, named
// `video-catalog › <Requirement> › <Scenario>`.
import type { Client } from "pg";
import { beforeAll, describe, expect, test } from "vitest";
import { PG, insertVideo, youtubeId } from "./test/fixtures";
import { useTestDatabase } from "./test/test-database";

const database = useTestDatabase();
let client: Client;

beforeAll(async () => {
  client = await database().connectOwner();
});

const OLD = "2000-01-01T00:00:00Z";

/** The stored time as text, or null. */
async function enteredFeedAt(id: number): Promise<string | null> {
  const { rows } = await client.query<{ t: string | null }>("SELECT entered_feed_at::text AS t FROM video WHERE id = $1", [id]);
  return rows[0].t;
}

/** True when the stored time is "just now" by the database's own clock. */
async function isJustNow(id: number): Promise<boolean> {
  const { rows } = await client.query<{ ok: boolean | null }>(
    "SELECT entered_feed_at BETWEEN now() - interval '1 minute' AND now() AS ok FROM video WHERE id = $1",
    [id],
  );
  return rows[0].ok === true;
}

async function setStatus(id: number, status: string, extra: Record<string, unknown> = {}): Promise<void> {
  const sets = ["status = $1", ...Object.keys(extra).map((key, index) => `"${key}" = $${index + 3}`)];
  await client.query(`UPDATE video SET ${sets.join(", ")} WHERE id = $2`, [status, id, ...Object.values(extra)]);
}

describe("video-catalog › Feed-entry time is set by the database", () => {
  test.each(["ready", "needs_recipe"])(
    "video-catalog › Feed-entry time is set by the database › Video inserted into the feed (%s)",
    async (status) => {
      const id = await insertVideo(client, { status });
      expect(await isJustNow(id)).toBe(true);
    },
  );

  test.each(["not_easy", "unavailable", "rejected"])(
    "video-catalog › Feed-entry time is set by the database › Video inserted outside the feed (%s)",
    async (status) => {
      const id = await insertVideo(client, { status });
      expect(await enteredFeedAt(id)).toBeNull();
    },
  );

  test.each([
    ["not_easy", "ready"],
    ["unavailable", "needs_recipe"],
  ])("video-catalog › Feed-entry time is set by the database › Video moves into the feed (%s to %s)", async (from, to) => {
    const id = await insertVideo(client, { status: from });
    expect(await enteredFeedAt(id)).toBeNull();
    await setStatus(id, to);
    expect(await isJustNow(id)).toBe(true);
  });

  test("video-catalog › Feed-entry time is set by the database › Writer sends a time on insert", async () => {
    const inFeed = await insertVideo(client, { status: "ready", entered_feed_at: OLD });
    expect(await isJustNow(inFeed)).toBe(true);

    const outside = await insertVideo(client, { status: "not_easy", entered_feed_at: OLD });
    expect(await enteredFeedAt(outside)).toBeNull();
  });

  test("video-catalog › Feed-entry time is set by the database › Writer sends a time with a status change into the feed", async () => {
    const id = await insertVideo(client, { status: "not_easy" });
    await setStatus(id, "ready", { entered_feed_at: OLD });
    expect(await isJustNow(id)).toBe(true);
  });
});

describe("video-catalog › Feed-entry time is protected", () => {
  test("video-catalog › Feed-entry time is protected › Time changed on its own", async () => {
    const inFeed = await insertVideo(client, { status: "ready" });
    await expect(client.query("UPDATE video SET entered_feed_at = $1 WHERE id = $2", [OLD, inFeed])).rejects.toMatchObject({
      code: PG.raise,
    });

    const outside = await insertVideo(client, { status: "not_easy" });
    await expect(client.query("UPDATE video SET entered_feed_at = now() WHERE id = $1", [outside])).rejects.toMatchObject({
      code: PG.raise,
    });
  });

  test("video-catalog › Feed-entry time is protected › Time cleared for a feed video", async () => {
    const id = await insertVideo(client, { status: "needs_recipe" });
    await expect(client.query("UPDATE video SET entered_feed_at = NULL WHERE id = $1", [id])).rejects.toMatchObject({
      code: PG.raise,
    });
    expect(await isJustNow(id)).toBe(true);
  });
});

describe("video-catalog › Feed-entry time is kept otherwise", () => {
  test("video-catalog › Feed-entry time is kept otherwise › Status changes between ready and needs_recipe", async () => {
    const id = await insertVideo(client, { status: "ready" });
    const before = await enteredFeedAt(id);
    await setStatus(id, "needs_recipe");
    expect(await enteredFeedAt(id)).toBe(before);
    await setStatus(id, "ready");
    expect(await enteredFeedAt(id)).toBe(before);
  });

  test.each(["not_easy", "unavailable"])(
    "video-catalog › Feed-entry time is kept otherwise › Video leaves the feed (%s)",
    async (to) => {
      const id = await insertVideo(client, { status: "ready" });
      const before = await enteredFeedAt(id);
      expect(before).not.toBeNull();
      await setStatus(id, to);
      expect(await enteredFeedAt(id)).toBe(before);
    },
  );

  test("video-catalog › Feed-entry time is kept otherwise › Another field is updated", async () => {
    const id = await insertVideo(client, { status: "ready" });
    const before = await enteredFeedAt(id);
    await client.query("UPDATE video SET title = 'A new title', channel_name = 'Another channel' WHERE id = $1", [id]);
    expect(await enteredFeedAt(id)).toBe(before);
  });
});

describe("video-catalog › Rejected is only for first-time candidates", () => {
  test.each([
    ["not_easy", "rejected"],
    ["unavailable", "rejected"],
    ["ready", "rejected"],
    ["needs_recipe", "rejected"],
    ["rejected", "not_easy"],
    ["rejected", "ready"],
  ])("video-catalog › Rejected is only for first-time candidates › Status changes to or from rejected (%s to %s)", async (from, to) => {
    const id = await insertVideo(client, { status: from });
    await expect(setStatus(id, to)).rejects.toMatchObject({ code: PG.raise });
    const { rows } = await client.query<{ status: string }>("SELECT status::text FROM video WHERE id = $1", [id]);
    expect(rows[0].status).toBe(from);
  });
});

// Checks that are not spec scenarios (REC-019 #32 A, #46 A): listed as unit tests.
describe("feed-entry time details", () => {
  test("feed-entry time details › the stored time has millisecond precision", async () => {
    const id = await insertVideo(client, { status: "ready" });
    const { rows } = await client.query<{ ok: boolean }>(
      "SELECT date_trunc('milliseconds', entered_feed_at) = entered_feed_at AS ok FROM video WHERE id = $1",
      [id],
    );
    expect(rows[0].ok).toBe(true);
  });

  test("feed-entry time details › two videos inserted in one transaction share one time", async () => {
    await client.query("BEGIN");
    try {
      const first = await insertVideo(client, { status: "ready" });
      const second = await insertVideo(client, { status: "needs_recipe" });
      const { rows } = await client.query<{ same: boolean }>(
        "SELECT (SELECT entered_feed_at FROM video WHERE id = $1) = (SELECT entered_feed_at FROM video WHERE id = $2) AS same",
        [first, second],
      );
      expect(rows[0].same).toBe(true);
    } finally {
      await client.query("COMMIT");
    }
  });

  test("feed-entry time details › a video that comes back gets a new time", async () => {
    const id = await insertVideo(client, { status: "ready" });
    const first = await enteredFeedAt(id);
    await setStatus(id, "unavailable");
    await client.query("SELECT pg_sleep(0.02)");
    await setStatus(id, "ready");
    const second = await enteredFeedAt(id);
    const { rows } = await client.query<{ later: boolean }>("SELECT $1::timestamptz > $2::timestamptz AS later", [second, first]);
    expect(rows[0].later).toBe(true);
  });

  test("feed-entry time details › a video in the feed must have a time even if the trigger is bypassed", async () => {
    await client.query("BEGIN");
    try {
      await client.query("ALTER TABLE video DISABLE TRIGGER video_feed_rules");
      await expect(
        client.query(
          `INSERT INTO video (youtube_id, title, channel_id, status, duration_seconds, embeddable, language)
           VALUES ($1, 'A video', 'UC1', 'ready', 30, true, 'en')`,
          [youtubeId()],
        ),
      ).rejects.toMatchObject({ code: PG.check });
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
