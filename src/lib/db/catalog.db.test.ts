// Database tests for the `video-catalog` capability: tables and integrity rules.
// One test per scenario, named `video-catalog › <Requirement> › <Scenario>`
// (openspec/changes/add-video-catalog-schema/specs/video-catalog/spec.md).
import type { Client } from "pg";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { PG, insertRecipe, insertVideo, youtubeId } from "./test/fixtures";
import { type TestDatabase, createTestDatabase } from "./test/test-database";

let db: TestDatabase;
let client: Client;

beforeAll(async () => {
  db = await createTestDatabase();
  client = await db.connectOwner();
});

afterAll(async () => {
  await db.drop();
});

async function columns(table: string): Promise<string[]> {
  const { rows } = await client.query<{ line: string }>(
    `SELECT column_name || ' ' || data_type || ' ' || is_nullable AS line
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [table],
  );
  return rows.map((row) => row.line);
}

describe("video-catalog › Catalog tables", () => {
  test("video-catalog › Catalog tables › Migrations create the tables", async () => {
    // Fields, types and keys of docs/architecture/data-model.md.
    expect(await columns("video")).toEqual([
      "id integer NO",
      "youtube_id text NO",
      "title text NO",
      "channel_id text NO",
      "channel_name text YES",
      "duration_seconds integer YES",
      "embeddable boolean YES",
      "language text YES",
      "status USER-DEFINED NO",
      "entered_feed_at timestamp with time zone YES",
      "created_at timestamp with time zone NO",
      "updated_at timestamp with time zone NO",
    ]);
    expect(await columns("recipe")).toEqual([
      "video_id integer NO",
      "servings text YES",
      "ingredients jsonb NO",
      "steps jsonb NO",
      "source USER-DEFINED NO",
      "ingredient_count integer NO",
      "estimated_active_minutes integer NO",
      "special_equipment ARRAY NO",
      "created_at timestamp with time zone NO",
      "updated_at timestamp with time zone NO",
    ]);

    const keys = await client.query<{ line: string }>(
      `SELECT conrelid::regclass::text || ' ' || contype::text || ' ' || pg_get_constraintdef(oid) AS line
         FROM pg_constraint
        WHERE conrelid IN ('video'::regclass, 'recipe'::regclass) AND contype IN ('p', 'f', 'u')
        ORDER BY 1`,
    );
    expect(keys.rows.map((row) => row.line)).toEqual([
      "recipe f FOREIGN KEY (video_id) REFERENCES video(id) ON DELETE CASCADE",
      "recipe p PRIMARY KEY (video_id)",
      "video p PRIMARY KEY (id)",
      "video u UNIQUE (youtube_id)",
    ]);

    // The video status accepts only the five statuses.
    const statuses = await client.query<{ value: string }>("SELECT unnest(enum_range(NULL::video_status))::text AS value");
    expect(statuses.rows.map((row) => row.value)).toEqual(["ready", "needs_recipe", "not_easy", "unavailable", "rejected"]);
    await expect(insertVideo(client, { status: "archived" })).rejects.toMatchObject({ code: PG.invalidEnum });
  });
});

describe("video-catalog › Unique YouTube ID", () => {
  test("video-catalog › Unique YouTube ID › Duplicate YouTube ID", async () => {
    const id = youtubeId();
    await insertVideo(client, { youtube_id: id });
    await expect(insertVideo(client, { youtube_id: id })).rejects.toMatchObject({ code: PG.unique });
  });
});

describe("video-catalog › Required video fields", () => {
  test.each(["duration_seconds", "embeddable", "language"])(
    "video-catalog › Required video fields › Video missing a required field (%s)",
    async (field) => {
      await expect(insertVideo(client, { [field]: null })).rejects.toMatchObject({ code: PG.check });
    },
  );

  test.each(["youtube_id", "title", "channel_id", "status"])(
    "video-catalog › Required video fields › Video missing a required field (%s is always required)",
    async (field) => {
      await expect(insertVideo(client, { [field]: null })).rejects.toMatchObject({ code: PG.notNull });
    },
  );

  test("video-catalog › Required video fields › A rejected video needs no duration, embeddable flag or language", async () => {
    await expect(
      insertVideo(client, { status: "rejected", duration_seconds: null, embeddable: null, language: null }),
    ).resolves.toBeTypeOf("number");
  });
});

describe("video-catalog › Recipe rules", () => {
  test.each(["ingredients", "steps", "source", "ingredient_count", "estimated_active_minutes", "special_equipment"])(
    "video-catalog › Recipe rules › Recipe missing a required column (%s)",
    async (column) => {
      const videoId = await insertVideo(client);
      await expect(insertRecipe(client, videoId, { [column]: null })).rejects.toMatchObject({ code: PG.notNull });
    },
  );

  test("video-catalog › Recipe rules › Recipe with servings left out is accepted", async () => {
    const videoId = await insertVideo(client);
    await expect(insertRecipe(client, videoId, { servings: null })).resolves.toBeUndefined();
  });

  test("video-catalog › Recipe rules › Recipe with an unknown source", async () => {
    const videoId = await insertVideo(client);
    await expect(insertRecipe(client, videoId, { source: "blog" })).rejects.toMatchObject({ code: PG.invalidEnum });
  });
});

describe("video-catalog › Recipe is deleted with its video", () => {
  test("video-catalog › Recipe is deleted with its video › Video deleted", async () => {
    const videoId = await insertVideo(client);
    await insertRecipe(client, videoId);
    expect((await client.query("SELECT 1 FROM recipe WHERE video_id = $1", [videoId])).rowCount).toBe(1);

    await client.query("DELETE FROM video WHERE id = $1", [videoId]);
    expect((await client.query("SELECT 1 FROM recipe WHERE video_id = $1", [videoId])).rowCount).toBe(0);
  });
});

// Checks that are not spec scenarios (REC-019 #32 A): listed as unit tests.
describe("schema details", () => {
  test("schema details › the feed index covers status, feed-entry time and id", async () => {
    const { rows } = await client.query<{ indexdef: string }>(
      "SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'video_feed_idx'",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].indexdef).toContain("(status, entered_feed_at, id)");
  });

  test("schema details › created_at defaults to now", async () => {
    const id = await insertVideo(client);
    const { rows } = await client.query<{ recent: boolean }>(
      "SELECT created_at > now() - interval '1 minute' AND created_at <= now() AS recent FROM video WHERE id = $1",
      [id],
    );
    expect(rows[0].recent).toBe(true);
  });

  test("schema details › ingredients and steps must be JSON lists", async () => {
    const videoId = await insertVideo(client);
    await expect(insertRecipe(client, videoId, { ingredients: JSON.stringify({ name: "flour" }) })).rejects.toMatchObject({
      code: PG.check,
    });
    await expect(insertRecipe(client, videoId, { steps: JSON.stringify("Mix") })).rejects.toMatchObject({ code: PG.check });
  });
});
