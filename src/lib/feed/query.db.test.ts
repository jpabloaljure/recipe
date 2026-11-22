// Database tests for the feed query (REC-002). Names follow
// `feed › <Requirement> › <Scenario>` (change add-database-feed, specs/feed).
import type { Client } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { type DbClient, createAppDb } from "../db/client";
import { insertRecipe, insertVideo, youtubeId } from "../db/test/fixtures";
import { useTestDatabase } from "../db/test/test-database";
import { decodeCursor, type FeedPosition } from "./cursor";
import { PAGE_SIZE, createFeedQuery, type FeedQuery } from "./query";
import type { FeedItem } from "./types";

const database = useTestDatabase();
let owner: Client;
let app: DbClient;
let query: FeedQuery;

beforeAll(async () => {
  owner = await database().connectOwner();
  app = createAppDb(database().readonlyUrl);
  query = createFeedQuery(app.db);
});

// Registered after the helper's hook, so it runs first: the pool closes before the drop.
afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await owner.query("DELETE FROM video");
});

/** Inserts videos one transaction each, so each gets a later feed-entry time. */
async function insertInOrder(count: number, status = "needs_recipe"): Promise<string[]> {
  const ids: string[] = [];
  for (let n = 0; n < count; n++) {
    const id = youtubeId();
    await insertVideo(owner, { youtube_id: id, status });
    ids.push(id);
  }
  return ids;
}

/** Inserts videos in ONE transaction, so they share the feed-entry time (a tie). */
async function insertTied(count: number): Promise<string[]> {
  const ids: string[] = [];
  await owner.query("BEGIN");
  for (let n = 0; n < count; n++) {
    const id = youtubeId();
    await insertVideo(owner, { youtube_id: id, status: "needs_recipe" });
    ids.push(id);
  }
  await owner.query("COMMIT");
  return ids;
}

async function walkAllPages(): Promise<FeedItem[][]> {
  const pages: FeedItem[][] = [];
  let after: FeedPosition | null = null;
  for (let guard = 0; guard < 50; guard++) {
    const page = await query(after);
    pages.push(page.items);
    if (page.nextCursor === null) return pages;
    after = positionOf(page.nextCursor);
  }
  throw new Error("The feed never ended.");
}

function positionOf(cursor: string) {
  const decoded = decodeCursor(cursor);
  if (!decoded.ok) throw new Error("The query returned a cursor that does not decode.");
  return decoded.position;
}

describe("feed › Feed contains ready and title-only videos", () => {
  test("feed › Feed contains ready and title-only videos › Mixed statuses", async () => {
    const readyId = youtubeId();
    const ready = await insertVideo(owner, { youtube_id: readyId, status: "ready" });
    await insertRecipe(owner, ready);
    const titleOnly = youtubeId();
    await insertVideo(owner, { youtube_id: titleOnly, status: "needs_recipe" });
    for (const status of ["not_easy", "unavailable", "rejected"]) {
      await insertVideo(owner, { status });
    }

    const page = await query(null);

    expect(page.items.map((item) => item.youtubeId).sort()).toEqual([readyId, titleOnly].sort());
    const byId = new Map(page.items.map((item) => [item.youtubeId, item]));
    expect(byId.get(readyId)?.recipe).toEqual({
      servings: "2",
      ingredients: [{ name: "flour", quantity: "1", unit: "cup" }],
      steps: ["Mix everything."],
      source: "description",
    });
    expect(byId.get(titleOnly)?.recipe).toBeNull();
    expect(byId.get(titleOnly)?.channelName).toBe("A channel");
  });
});

describe("feed › Feed contains ready and title-only videos (malformed recipe)", () => {
  test("a recipe whose items are not the contract's shape is served title-only", async () => {
    const id = youtubeId();
    const row = await insertVideo(owner, { youtube_id: id, status: "ready" });
    await insertRecipe(owner, row, { ingredients: JSON.stringify(["flour"]) });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const page = await query(null);

    expect(page.items).toEqual([{ youtubeId: id, title: "A video", channelName: "A channel", recipe: null }]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(id));
    spy.mockRestore();
  });
});

describe("feed › Feed pages are newest first", () => {
  test("feed › Feed pages are newest first › Second page", async () => {
    await insertInOrder(25);

    const first = await query(null);
    const second = await query(positionOf(first.nextCursor!));

    expect(first.items).toHaveLength(PAGE_SIZE);
    expect(second.items).toHaveLength(PAGE_SIZE);
    const times = async (items: FeedItem[]) =>
      (
        await owner.query<{ t: Date }>(
          "SELECT entered_feed_at AS t FROM video WHERE youtube_id = ANY($1) ORDER BY entered_feed_at DESC",
          [items.map((item) => item.youtubeId)],
        )
      ).rows.map((row) => row.t.getTime());
    const firstTimes = await times(first.items);
    const secondTimes = await times(second.items);
    expect(Math.max(...secondTimes)).toBeLessThanOrEqual(Math.min(...firstTimes));
    const firstIds = new Set(first.items.map((item) => item.youtubeId));
    expect(second.items.some((item) => firstIds.has(item.youtubeId))).toBe(false);
  });

  test("feed › Feed pages are newest first › Videos entering mid-visit", async () => {
    const all = await insertInOrder(15);
    const first = await query(null);
    const newcomer = youtubeId();
    await insertVideo(owner, { youtube_id: newcomer, status: "needs_recipe" });

    const second = await query(positionOf(first.nextCursor!));

    const seen = [...first.items, ...second.items].map((item) => item.youtubeId);
    expect(new Set(seen).size).toBe(seen.length);
    // Everything that was in the feed when page 1 was read is still reached once.
    expect([...seen].sort()).toEqual([...all].sort());
    expect(seen).not.toContain(newcomer);
  });

  test("walking all pages returns every video once, newest first", async () => {
    const all = await insertInOrder(23);

    const pages = await walkAllPages();

    expect(pages.map((page) => page.length)).toEqual([10, 10, 3]);
    expect(pages.flat().map((item) => item.youtubeId)).toEqual([...all].reverse());
  });

  test("ties on the feed-entry time at a page boundary neither repeat nor skip", async () => {
    // 4 older videos, then 12 tied ones (the tie straddles the page-10 boundary), then 4 newer.
    const older = await insertInOrder(4);
    const tied = await insertTied(12);
    const newer = await insertInOrder(4);

    const pages = await walkAllPages();

    const ids = pages.flat().map((item) => item.youtubeId);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...older, ...tied, ...newer].sort());
  });
});

describe("feed › The last page says there are no more pages", () => {
  test("feed › The last page says there are no more pages › Last page", async () => {
    await insertInOrder(13);

    const first = await query(null);
    const second = await query(positionOf(first.nextCursor!));

    expect(first.nextCursor).not.toBeNull();
    expect(second.items).toHaveLength(3);
    expect(second.nextCursor).toBeNull();
  });

  test("feed › The last page says there are no more pages › Last videos fill a page exactly", async () => {
    await insertInOrder(20);

    const first = await query(null);
    const second = await query(positionOf(first.nextCursor!));

    expect(second.items).toHaveLength(PAGE_SIZE);
    expect(second.nextCursor).toBeNull();
  });

  test("feed › The last page says there are no more pages › No videos in the feed", async () => {
    await insertVideo(owner, { status: "not_easy" });

    expect(await query(null)).toEqual({ items: [], nextCursor: null });
  });

  test("feed › The last page says there are no more pages › Request past the end of the feed", async () => {
    await insertInOrder(3);
    const first = await query(null);
    const oldest = first.items.at(-1)!;
    const { rows } = await owner.query<{ id: number; t: Date }>(
      "SELECT id, entered_feed_at AS t FROM video WHERE youtube_id = $1",
      [oldest.youtubeId],
    );

    const page = await query({ enteredFeedAt: rows[0].t, id: rows[0].id });

    expect(page).toEqual({ items: [], nextCursor: null });
  });
});
