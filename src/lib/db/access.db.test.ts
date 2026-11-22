// Database tests for `updated_at`, the app's read-only access and repeatable
// migrations (spec video-catalog; migrations 0002 and 0003). One test per
// scenario, named `video-catalog › <Requirement> › <Scenario>`.
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool, type Client } from "pg";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { PG, insertRecipe, insertVideo } from "./test/fixtures";
import { type TestDatabase, createTestDatabase } from "./test/test-database";

const migrationsFolder = fileURLToPath(new URL("./migrations", import.meta.url));

let db: TestDatabase;
let owner: Client;
let readonly: Client;

beforeAll(async () => {
  db = await createTestDatabase();
  owner = await db.connectOwner();
  readonly = await db.connectReadonly();
});

afterAll(async () => {
  await db.drop();
});

async function updatedAt(table: "video" | "recipe", key: number): Promise<string> {
  const column = table === "video" ? "id" : "video_id";
  const { rows } = await owner.query<{ t: string }>(`SELECT updated_at::text AS t FROM ${table} WHERE ${column} = $1`, [key]);
  return rows[0].t;
}

async function isLater(a: string, b: string): Promise<boolean> {
  const { rows } = await owner.query<{ later: boolean }>("SELECT $1::timestamptz > $2::timestamptz AS later", [a, b]);
  return rows[0].later;
}

describe("video-catalog › Updated time is kept by the database", () => {
  test("video-catalog › Updated time is kept by the database › Video or recipe updated", async () => {
    const videoId = await insertVideo(owner);
    await insertRecipe(owner, videoId);

    const videoBefore = await updatedAt("video", videoId);
    const recipeBefore = await updatedAt("recipe", videoId);
    await owner.query("SELECT pg_sleep(0.02)");

    // The writer's own value for updated_at is ignored too.
    await owner.query("UPDATE video SET title = 'A new title', updated_at = '2000-01-01' WHERE id = $1", [videoId]);
    await owner.query("UPDATE recipe SET servings = '4', updated_at = '2000-01-01' WHERE video_id = $1", [videoId]);

    expect(await isLater(await updatedAt("video", videoId), videoBefore)).toBe(true);
    expect(await isLater(await updatedAt("recipe", videoId), recipeBefore)).toBe(true);
  });
});

describe("video-catalog › Read-only access for the app", () => {
  test("video-catalog › Read-only access for the app › Read-only user reads", async () => {
    const videoId = await insertVideo(owner);
    await insertRecipe(owner, videoId);

    const videos = await readonly.query("SELECT id FROM video WHERE id = $1", [videoId]);
    const recipes = await readonly.query("SELECT video_id FROM recipe WHERE video_id = $1", [videoId]);
    expect(videos.rowCount).toBe(1);
    expect(recipes.rowCount).toBe(1);
  });

  test.each([
    ["video", "INSERT INTO video (youtube_id, title, channel_id, status, duration_seconds, embeddable, language) VALUES ('rowrite0001', 't', 'c', 'not_easy', 1, true, 'en')"],
    ["video", "UPDATE video SET title = 'changed'"],
    ["video", "DELETE FROM video"],
    ["recipe", "INSERT INTO recipe (video_id, ingredients, steps, source, ingredient_count, estimated_active_minutes, special_equipment) VALUES (1, '[]', '[]', 'description', 0, 0, '{}')"],
    ["recipe", "UPDATE recipe SET servings = '9'"],
    ["recipe", "DELETE FROM recipe"],
    ["video", "TRUNCATE video"],
  ])("video-catalog › Read-only access for the app › Read-only user writes (%s: %s)", async (_table, statement) => {
    await expect(readonly.query(statement)).rejects.toMatchObject({ code: PG.insufficientPrivilege });
  });
});

describe("video-catalog › Migrations are repeatable", () => {
  /** Everything the migrations create, as one comparable string. */
  async function fingerprint(): Promise<string> {
    const { rows } = await owner.query<{ line: string }>(
      `SELECT line FROM (
         SELECT 'column ' || table_name || '.' || column_name || ' ' || data_type || ' ' || is_nullable AS line
           FROM information_schema.columns WHERE table_schema = 'public'
         UNION ALL SELECT 'constraint ' || conrelid::regclass::text || ' ' || pg_get_constraintdef(oid) FROM pg_constraint
           WHERE connamespace = 'public'::regnamespace
         UNION ALL SELECT 'index ' || indexdef FROM pg_indexes WHERE schemaname = 'public'
         UNION ALL SELECT 'trigger ' || tgrelid::regclass::text || ' ' || tgname FROM pg_trigger WHERE NOT tgisinternal
         UNION ALL SELECT 'function ' || proname || ' ' || md5(prosrc) FROM pg_proc WHERE pronamespace = 'public'::regnamespace
         UNION ALL SELECT 'grant ' || grantee || ' ' || table_name || ' ' || privilege_type FROM information_schema.role_table_grants
           WHERE table_schema = 'public' AND grantee = 'app_readonly'
       ) schema_lines ORDER BY line`,
    );
    return rows.map((row) => row.line).join("\n");
  }

  test("video-catalog › Migrations are repeatable › Migrations run twice", async () => {
    const before = await fingerprint();
    const history = (await owner.query("SELECT 1 FROM drizzle.__drizzle_migrations")).rowCount;
    expect(history).toBeGreaterThanOrEqual(4);

    const pool = new Pool({ connectionString: db.ownerUrl, max: 1 });
    try {
      await migrate(drizzle(pool), { migrationsFolder });
    } finally {
      await pool.end();
    }

    expect(await fingerprint()).toBe(before);
    expect((await owner.query("SELECT 1 FROM drizzle.__drizzle_migrations")).rowCount).toBe(history);
  });
});

// Checks that are not spec scenarios: listed as unit tests.
describe("access details", () => {
  test("access details › a table created later by the owner is readable, not writable, by app_readonly", async () => {
    await owner.query("CREATE TABLE later_table (n integer)");
    await owner.query("INSERT INTO later_table VALUES (1)");
    expect((await readonly.query("SELECT n FROM later_table")).rowCount).toBe(1);
    await expect(readonly.query("INSERT INTO later_table VALUES (2)")).rejects.toMatchObject({
      code: PG.insufficientPrivilege,
    });
  });

  test("access details › app_readonly cannot create objects", async () => {
    await expect(readonly.query("CREATE TABLE app_made (n integer)")).rejects.toMatchObject({
      code: PG.insufficientPrivilege,
    });
  });

  test("access details › app_readonly is not a superuser and has no extra role memberships", async () => {
    const { rows } = await owner.query<{ rolsuper: boolean; rolcreatedb: boolean; rolcreaterole: boolean; memberships: string }>(
      `SELECT rolsuper, rolcreatedb, rolcreaterole,
              (SELECT count(*) FROM pg_auth_members WHERE member = r.oid)::text AS memberships
         FROM pg_roles r WHERE rolname = 'app_readonly'`,
    );
    expect(rows[0]).toEqual({ rolsuper: false, rolcreatedb: false, rolcreaterole: false, memberships: "0" });
  });
});
