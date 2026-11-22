// The shared client against a real Postgres: the app's client reads as
// `app_readonly` and cannot write; the direct client writes as the owner.
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { type DbClient, createAppDb, createDirectDb } from "./client";
import { video } from "./schema";
import { useTestDatabase } from "./test/test-database";
import { youtubeId } from "./test/fixtures";

const database = useTestDatabase();
let app: DbClient;
let direct: DbClient;

beforeAll(() => {
  app = createAppDb(database().readonlyUrl);
  direct = createDirectDb(database().ownerUrl);
});

// Registered after the helper's hook, so it runs first (hooks run in reverse):
// the pools are closed before the database is dropped.
afterAll(async () => {
  await app.close();
  await direct.close();
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

  test("a connection closed by the server while idle does not crash the process", async () => {
    // A suspended Neon compute or the pooler closes idle connections. node-pg
    // reports that as an 'error' event on the pool, which kills the process
    // unless the client handles it.
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = createDirectDb(database().ownerUrl);
    try {
      const { rows } = await client.db.execute<{ pid: number }>(sql`SELECT pg_backend_pid() AS pid`);
      const admin = await database().connectOwner();
      await admin.query("SELECT pg_terminate_backend($1)", [rows[0].pid]);

      await vi.waitFor(() => expect(log).toHaveBeenCalledWith(expect.stringContaining("idle connection error")));

      // The pool discards the broken connection and works on the next query.
      const next = await client.db.execute<{ ok: number }>(sql`SELECT 1 AS ok`);
      expect(next.rows[0].ok).toBe(1);
    } finally {
      await client.close();
      log.mockRestore();
    }
  });
});
