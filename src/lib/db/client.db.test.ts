// The shared client against a real Postgres: the app's client reads as
// `app_readonly` and cannot write; the direct client writes as the owner.
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { type DbClient, createAppDb, createDirectDb } from "./client";
import { video } from "./schema";
import { type TestDatabase, createTestDatabase } from "./test/test-database";
import { youtubeId } from "./test/fixtures";

let testDb: TestDatabase;
let app: DbClient;
let direct: DbClient;

beforeAll(async () => {
  testDb = await createTestDatabase();
  app = createAppDb(testDb.readonlyUrl);
  direct = createDirectDb(testDb.ownerUrl);
});

afterAll(async () => {
  await app.close();
  await direct.close();
  await testDb.drop();
});

const newVideo = (status: "ready" | "not_easy") => ({
  youtubeId: youtubeId(),
  title: "A video",
  channelId: "UC0000001",
  durationSeconds: 45,
  embeddable: true,
  language: "en",
  status,
});

describe("shared database client", () => {
  test("the direct client writes as the owner and reads the time back unchanged", async () => {
    const [row] = await direct.db.insert(video).values(newVideo("ready")).returning();
    expect(row.enteredFeedAt).toBeInstanceOf(Date);

    // The millisecond the database stored is the millisecond JS sees: nothing is
    // lost on the way to a JS Date (the cursor in REC-002 relies on this).
    const { rows } = await direct.db.execute<{ ms: string }>(
      sql`SELECT (extract(epoch FROM entered_feed_at) * 1000)::bigint::text AS ms FROM video WHERE id = ${row.id}`,
    );
    expect(String(row.enteredFeedAt!.getTime())).toBe(rows[0].ms);
  });

  test("the app client reads", async () => {
    const [row] = await direct.db.insert(video).values(newVideo("not_easy")).returning();
    const found = await app.db.select().from(video).where(sql`${video.id} = ${row.id}`);
    expect(found).toHaveLength(1);
    expect(found[0].youtubeId).toBe(row.youtubeId);
  });

  test("the app client cannot write", async () => {
    await expect(app.db.insert(video).values(newVideo("not_easy"))).rejects.toThrow(/permission denied|Failed query/);
    const [{ count }] = await direct.db.select({ count: sql<number>`count(*)::int` }).from(video);
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
