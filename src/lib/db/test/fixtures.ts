// Small helpers the database tests share: rows with sensible defaults, so each
// test only states what it is about.
import type { Client } from "pg";

/** Postgres error codes the tests expect. */
export const PG = {
  notNull: "23502",
  unique: "23505",
  check: "23514",
  invalidEnum: "22P02",
  raise: "P0001",
  insufficientPrivilege: "42501",
} as const;

let counter = 0;

/** A unique 11-character YouTube ID. */
export function youtubeId(): string {
  counter += 1;
  return `vid${String(counter).padStart(8, "0")}`;
}

type Row = Record<string, unknown>;

async function insert(client: Client, table: string, row: Row, returning?: string): Promise<Row[]> {
  // `undefined` leaves a column out, so a test can omit a field.
  const entries = Object.entries(row).filter(([, value]) => value !== undefined);
  const columns = entries.map(([key]) => `"${key}"`).join(", ");
  const params = entries.map((_, index) => `$${index + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${columns}) VALUES (${params})${returning ? ` RETURNING ${returning}` : ""}`;
  const { rows } = await client.query(
    sql,
    entries.map(([, value]) => value),
  );
  return rows;
}

/** Inserts a video outside the feed (`not_easy`) unless the test says otherwise. */
export async function insertVideo(client: Client, overrides: Row = {}): Promise<number> {
  const rows = await insert(
    client,
    "video",
    {
      youtube_id: youtubeId(),
      title: "A video",
      channel_id: "UC0000001",
      channel_name: "A channel",
      duration_seconds: 45,
      embeddable: true,
      language: "en",
      status: "not_easy",
      ...overrides,
    },
    "id",
  );
  return rows[0].id as number;
}

/** Inserts a recipe for a video. List columns are JSON text. */
export async function insertRecipe(client: Client, videoId: number, overrides: Row = {}): Promise<void> {
  await insert(client, "recipe", {
    video_id: videoId,
    servings: "2",
    ingredients: JSON.stringify([{ name: "flour", quantity: "1", unit: "cup" }]),
    steps: JSON.stringify(["Mix everything."]),
    source: "description",
    ingredient_count: 1,
    estimated_active_minutes: 10,
    special_equipment: [],
    ...overrides,
  });
}
