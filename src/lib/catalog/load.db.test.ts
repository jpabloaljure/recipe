// Database tests for the curated-list loader (REC-002). Names follow
// `video-catalog › <Requirement> › <Scenario>` (change add-database-feed).
import type { Client } from "pg";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { createFeedQuery } from "../feed/query";
import { createAppDb } from "../db/client";
import { useTestDatabase } from "../db/test/test-database";
import { planLoad } from "./curated.mts";
import { writePlan } from "./load.mts";

const database = useTestDatabase();
let owner: Client;

beforeAll(async () => {
  owner = await database().connectOwner();
});
beforeEach(async () => {
  await owner.query("DELETE FROM video");
});

const entry = (id: string, overrides: Record<string, unknown> = {}) => ({
  youtube_id: id.padEnd(11, "x"),
  title: `Title ${id}`,
  channel_name: "Example Kitchen",
  channel_id: "UCexample0001",
  duration_seconds: 42,
  embeddable: true,
  language: "en",
  ...overrides,
});
const rows = async () =>
  (await owner.query("SELECT youtube_id, title, channel_name, status::text, entered_feed_at FROM video ORDER BY youtube_id")).rows;

describe("video-catalog › Curated list loading", () => {
  test("video-catalog › Curated list loading › Short that passes the checks", async () => {
    const result = await writePlan(owner, planLoad([entry("a"), entry("b")]));

    expect(result).toEqual({ inserted: 2, alreadyStored: 0 });
    const stored = await rows();
    expect(stored.map((row) => row.status)).toEqual(["needs_recipe", "needs_recipe"]);
    expect(stored[0]).toMatchObject({ youtube_id: "axxxxxxxxxx", title: "Title a", channel_name: "Example Kitchen" });
    expect(stored.every((row) => row.entered_feed_at instanceof Date)).toBe(true);
  });

  test("video-catalog › Curated list loading › Short that fails the checks", async () => {
    await writePlan(owner, planLoad([entry("ok"), entry("long", { duration_seconds: 240})]));

    expect((await rows()).map((row) => [row.youtube_id, row.status])).toEqual([
      ["longxxxxxxx", "rejected"],
      ["okxxxxxxxxx", "needs_recipe"],
    ]);
    const app = createAppDb(database().readonlyUrl);
    try {
      const page = await createFeedQuery(app.db)(null);
      expect(page.items.map((item) => item.youtubeId)).toEqual(["okxxxxxxxxx"]);
    } finally {
      await app.close();
    }
  });
});

describe("video-catalog › Loading is repeatable", () => {
  test("video-catalog › Loading is repeatable › Loader runs again", async () => {
    const plan = planLoad([entry("a"), entry("b")]);
    await writePlan(owner, plan);
    const before = await rows();

    const again = await writePlan(owner, planLoad([entry("a", { title: "Changed" }), entry("b")]));

    expect(again).toEqual({ inserted: 0, alreadyStored: 2 });
    expect(await rows()).toEqual(before);
  });

  test("video-catalog › Loading is repeatable › Run failed partway", async () => {
    const plan = planLoad([entry("a"), entry("b"), entry("c")]);
    // A writer that fails on the third video, like a dropped connection.
    let calls = 0;
    const flaky = {
      query: (text: string, params?: unknown[]) => {
        if (++calls === 3) return Promise.reject(new Error("connection lost"));
        return owner.query(text, params);
      },
    } as Pick<Client, "query">;
    await expect(writePlan(flaky, plan)).rejects.toThrow("connection lost");
    expect((await rows()).map((row) => row.youtube_id)).toEqual(["axxxxxxxxxx", "bxxxxxxxxxx"]);

    const rerun = await writePlan(owner, plan);

    expect(rerun).toEqual({ inserted: 1, alreadyStored: 2 });
    expect((await rows()).map((row) => row.youtube_id)).toEqual(["axxxxxxxxxx", "bxxxxxxxxxx", "cxxxxxxxxxx"]);
  });
});
