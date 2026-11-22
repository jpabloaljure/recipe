// Seeds fixture videos into a LOCAL or CI Postgres (REC-002, design D7).
// Usage: `pnpm db:seed` (after `pnpm db:up`, migrations and `pnpm db:setup`).
//
// Safe to run twice: a video whose YouTube ID is already stored is left as it
// is (and so is its recipe), so a second run changes nothing. It refuses a
// non-local database: these are made-up videos, never for Neon.
//
// Each group of the seed is one transaction, so its videos share one
// feed-entry time (a tie); separate groups get increasing times (an order).
import { existsSync } from "node:fs";
import { Client } from "pg";
import { buildSeedGroups } from "../../src/lib/catalog/seed-rows.mts";
import { assertLocalDatabase } from "./local-only.mts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const url = process.env.DATABASE_URL_DIRECT;
if (!url) {
  console.error("DATABASE_URL_DIRECT is not set. Copy .env.example to .env.local.");
  process.exit(1);
}
try {
  assertLocalDatabase(url, "DATABASE_URL_DIRECT");
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}

const client = new Client({ connectionString: url });
let added = 0;
try {
  await client.connect();
  for (const group of buildSeedGroups()) {
    await client.query("BEGIN");
    try {
      for (const v of group) {
        const { rows } = await client.query<{ id: number }>(
          `INSERT INTO video (youtube_id, title, channel_id, channel_name, duration_seconds, embeddable, language, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (youtube_id) DO NOTHING
           RETURNING id`,
          [v.youtubeId, v.title, v.channelId, v.channelName, v.durationSeconds, v.embeddable, v.language, v.status],
        );
        if (rows.length === 0) continue; // already seeded
        added += 1;
        if (v.recipe) {
          await client.query(
            `INSERT INTO recipe (video_id, servings, ingredients, steps, source, ingredient_count, estimated_active_minutes, special_equipment)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              rows[0].id,
              v.recipe.servings,
              JSON.stringify(v.recipe.ingredients),
              JSON.stringify(v.recipe.steps),
              v.recipe.source,
              v.recipe.ingredientCount,
              v.recipe.estimatedActiveMinutes,
              v.recipe.specialEquipment,
            ],
          );
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
  console.log(`Seed done: ${added} new video(s).`);
} catch (error) {
  console.error(`Could not seed the database: ${(error as Error).message}`);
  console.error("Is the database running and migrated? Try `pnpm db:up`, `pnpm db:migrate`, `pnpm db:setup`.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
