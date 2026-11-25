// Writes and reverts the placeholder recipes (see recipes.mts). Each video is
// its own transaction, so a failure leaves every other video as it was and a
// re-run only does what is missing. The recipe and the new status are written
// together (data model Rule 3), and the update is guarded by the current status,
// so a video that is no longer `needs_recipe` is never touched. The database
// keeps `entered_feed_at` (data model Rule 2); it is never sent.
import type { Client } from "pg";
import type { PlannedRecipe, RecipePlan } from "./recipes.mts";

type Queryable = Pick<Client, "query">;

export type ApplyResult = { applied: string[]; alreadyDone: string[]; notFound: string[]; failed: { youtubeId: string; reason: string }[] };
export type RevertResult = { reverted: string[]; notOurs: string[]; notFound: string[]; failed: { youtubeId: string; reason: string }[] };

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

async function applyOne(client: Queryable, planned: PlannedRecipe): Promise<"applied" | "alreadyDone" | "notFound"> {
  const { entry, status } = planned;
  await client.query("BEGIN");
  try {
    const updated = await client.query<{ id: number }>(
      `UPDATE video SET title = $1, status = $2 WHERE youtube_id = $3 AND status = 'needs_recipe' RETURNING id`,
      [entry.dish, status, entry.youtubeId],
    );
    if (updated.rows.length === 0) {
      await client.query("ROLLBACK");
      const existing = await client.query(`SELECT 1 FROM video WHERE youtube_id = $1`, [entry.youtubeId]);
      return existing.rows.length === 0 ? "notFound" : "alreadyDone";
    }
    await client.query(
      `INSERT INTO recipe (video_id, servings, ingredients, steps, source, ingredient_count, estimated_active_minutes, special_equipment)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, 'description', $5, $6, $7)`,
      [
        updated.rows[0].id,
        entry.servings,
        JSON.stringify(entry.ingredients),
        JSON.stringify(entry.steps),
        entry.ingredients.length,
        entry.estimatedActiveMinutes,
        entry.specialEquipment,
      ],
    );
    await client.query("COMMIT");
    return "applied";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function applyRecipes(client: Queryable, plan: RecipePlan): Promise<ApplyResult> {
  const result: ApplyResult = { applied: [], alreadyDone: [], notFound: [], failed: [] };
  for (const planned of plan.toApply) {
    try {
      result[await applyOne(client, planned)].push(planned.entry.youtubeId);
    } catch (error) {
      result.failed.push({ youtubeId: planned.entry.youtubeId, reason: message(error) });
    }
  }
  return result;
}

async function revertOne(client: Queryable, planned: PlannedRecipe): Promise<"reverted" | "notOurs" | "notFound"> {
  const { entry, originalTitle } = planned;
  await client.query("BEGIN");
  try {
    const found = await client.query<{ id: number }>(`SELECT id FROM video WHERE youtube_id = $1 FOR UPDATE`, [entry.youtubeId]);
    if (found.rows.length === 0) {
      await client.query("ROLLBACK");
      return "notFound";
    }
    const id = found.rows[0].id;
    // Only the placeholder itself is removed: a recipe that differs (a real
    // extraction that replaced it) is left alone.
    const deleted = await client.query(
      `DELETE FROM recipe WHERE video_id = $1 AND ingredients = $2::jsonb AND steps = $3::jsonb RETURNING video_id`,
      [id, JSON.stringify(entry.ingredients), JSON.stringify(entry.steps)],
    );
    if (deleted.rows.length === 0) {
      await client.query("ROLLBACK");
      return "notOurs";
    }
    await client.query(`UPDATE video SET title = $1, status = 'needs_recipe' WHERE id = $2`, [originalTitle, id]);
    await client.query("COMMIT");
    return "reverted";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function revertRecipes(client: Queryable, plan: RecipePlan): Promise<RevertResult> {
  const result: RevertResult = { reverted: [], notOurs: [], notFound: [], failed: [] };
  for (const planned of plan.toApply) {
    try {
      result[await revertOne(client, planned)].push(planned.entry.youtubeId);
    } catch (error) {
      result.failed.push({ youtubeId: planned.entry.youtubeId, reason: message(error) });
    }
  }
  return result;
}

export type CatalogCheck = { counts: Record<string, number>; problems: string[] };

/** A read-only health check of the catalog rules (data model Rules 3 and 4, EXT-4, EXT-5, PRD 6.3). */
export async function checkCatalog(client: Queryable): Promise<CatalogCheck> {
  const counts: Record<string, number> = {};
  for (const row of (await client.query<{ status: string; n: string }>(`SELECT status::text AS status, count(*) AS n FROM video GROUP BY status`)).rows) {
    counts[row.status] = Number(row.n);
  }
  const problems: string[] = [];
  const find = async (label: string, sql: string) => {
    for (const row of (await client.query<{ youtube_id: string }>(sql)).rows) problems.push(`${label}: ${row.youtube_id}`);
  };
  await find("a ready or not_easy video has no recipe", `SELECT v.youtube_id FROM video v LEFT JOIN recipe r ON r.video_id = v.id WHERE v.status IN ('ready','not_easy') AND r.video_id IS NULL`);
  await find("a needs_recipe or rejected video has a recipe", `SELECT v.youtube_id FROM video v JOIN recipe r ON r.video_id = v.id WHERE v.status IN ('needs_recipe','rejected')`);
  await find("a recipe's ingredient_count differs from its ingredients", `SELECT v.youtube_id FROM video v JOIN recipe r ON r.video_id = v.id WHERE r.ingredient_count <> jsonb_array_length(r.ingredients)`);
  await find("a recipe is not complete (fewer than 2 ingredients or 2 steps, EXT-5)", `SELECT v.youtube_id FROM video v JOIN recipe r ON r.video_id = v.id WHERE v.status IN ('ready','not_easy') AND (jsonb_array_length(r.ingredients) < 2 OR jsonb_array_length(r.steps) < 2)`);
  await find("a ready video is not easy (PRD 6.3)", `SELECT v.youtube_id FROM video v JOIN recipe r ON r.video_id = v.id WHERE v.status = 'ready' AND (r.ingredient_count > 10 OR r.estimated_active_minutes > 30 OR cardinality(r.special_equipment) > 0)`);
  await find("a not_easy video meets the easy thresholds (PRD 6.3)", `SELECT v.youtube_id FROM video v JOIN recipe r ON r.video_id = v.id WHERE v.status = 'not_easy' AND r.ingredient_count <= 10 AND r.estimated_active_minutes <= 30 AND cardinality(r.special_equipment) = 0`);
  await find("a feed video has no feed-entry time", `SELECT youtube_id FROM video WHERE status IN ('ready','needs_recipe') AND entered_feed_at IS NULL`);
  return { counts, problems };
}
