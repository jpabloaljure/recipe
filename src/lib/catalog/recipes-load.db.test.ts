// Database tests for the one-time placeholder recipes (a direct PR, not REC-008).
import type { Client } from "pg";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { useTestDatabase } from "../db/test/test-database";
import { planLoad } from "./curated.mts";
import { writePlan } from "./load.mts";
import { applyRecipes, checkCatalog, revertRecipes } from "./recipes-load.mts";
import { planRecipes } from "./recipes.mts";

const database = useTestDatabase();
let owner: Client;

beforeAll(async () => {
  owner = await database().connectOwner();
});

const videoEntry = (id: string, overrides: Record<string, unknown> = {}) => ({
  youtube_id: id.padEnd(11, "x"),
  title: `Original ${id} #shorts`,
  channel_name: "Example Kitchen",
  channel_id: "UCexample0001",
  duration_seconds: 42,
  embeddable: true,
  language: "en",
  ...overrides,
});
const recipeEntry = (id: string, overrides: Record<string, unknown> = {}) => ({
  youtube_id: id.padEnd(11, "x"),
  dish: `Dish ${id}`,
  servings: "2",
  ingredients: [
    { name: "flour", quantity: "1", unit: "cup" },
    { name: "water", quantity: "1/2", unit: "cup" },
  ],
  steps: ["Mix.", "Cook."],
  estimated_active_minutes: 10,
  ...overrides,
});

const entries = [videoEntry("a"), videoEntry("b"), videoEntry("c")];
const curated = () => {
  const plan = planLoad(entries);
  return plan.toWrite.map((p) => p.entry);
};
const plan = (recipes: unknown[]) => planRecipes(recipes, curated());
const video = async (id: string) =>
  (await owner.query("SELECT title, status::text, entered_feed_at FROM video WHERE youtube_id = $1", [id.padEnd(11, "x")])).rows[0];
const recipeCount = async () => Number((await owner.query("SELECT count(*) AS n FROM recipe")).rows[0].n);

beforeEach(async () => {
  await owner.query("DELETE FROM video");
  await writePlan(owner, planLoad(entries));
});

describe("video-catalog › Seed recipes", () => {
  test("video-catalog › Seed recipes › A needs_recipe video gets its recipe, status and dish title together", async () => {
    const before = await video("a");

    const result = await applyRecipes(owner, plan([recipeEntry("a")]));

    expect(result.applied).toEqual(["axxxxxxxxxx"]);
    const after = await video("a");
    expect(after).toMatchObject({ title: "Dish a", status: "ready" });
    expect(after.entered_feed_at).toEqual(before.entered_feed_at);
    const row = (await owner.query("SELECT source::text, ingredient_count, estimated_active_minutes, special_equipment FROM recipe")).rows[0];
    expect(row).toMatchObject({ source: "description", ingredient_count: 2, estimated_active_minutes: 10, special_equipment: [] });
    expect((await checkCatalog(owner)).problems).toEqual([]);
  });

  test("video-catalog › Seed recipes › A second run changes nothing", async () => {
    await applyRecipes(owner, plan([recipeEntry("a")]));
    const first = await video("a");

    const result = await applyRecipes(owner, plan([recipeEntry("a")]));

    expect(result).toMatchObject({ applied: [], alreadyDone: ["axxxxxxxxxx"] });
    expect(await video("a")).toEqual(first);
    expect(await recipeCount()).toBe(1);
  });

  test("video-catalog › Seed recipes › A video that is no longer needs_recipe is never touched", async () => {
    await owner.query("UPDATE video SET status = 'unavailable' WHERE youtube_id = $1", ["bxxxxxxxxxx"]);

    const result = await applyRecipes(owner, plan([recipeEntry("b")]));

    expect(result.alreadyDone).toEqual(["bxxxxxxxxxx"]);
    expect(await video("b")).toMatchObject({ title: "Original b #shorts", status: "unavailable" });
    expect(await recipeCount()).toBe(0);
  });

  test("video-catalog › Seed recipes › A failure on one video leaves it as it was and the others are written", async () => {
    const { rows } = await owner.query("SELECT id FROM video WHERE youtube_id = $1", ["axxxxxxxxxx"]);
    // A recipe row already exists for "a" while it is still needs_recipe: the insert conflicts.
    await owner.query(
      `INSERT INTO recipe (video_id, ingredients, steps, source, ingredient_count, estimated_active_minutes, special_equipment)
       VALUES ($1, '[]', '[]', 'description', 0, 1, '{}')`,
      [rows[0].id],
    );

    const result = await applyRecipes(owner, plan([recipeEntry("a"), recipeEntry("b")]));

    expect(result.failed.map((f) => f.youtubeId)).toEqual(["axxxxxxxxxx"]);
    expect(result.applied).toEqual(["bxxxxxxxxxx"]);
    expect(await video("a")).toMatchObject({ title: "Original a #shorts", status: "needs_recipe" });
    expect(await video("b")).toMatchObject({ status: "ready" });
  });

  test("video-catalog › Seed recipes › A hard recipe makes the video not_easy and it leaves the feed", async () => {
    await applyRecipes(owner, plan([recipeEntry("a", { estimated_active_minutes: 90 })]));

    expect(await video("a")).toMatchObject({ status: "not_easy" });
    expect((await checkCatalog(owner)).problems).toEqual([]);
  });

  test("video-catalog › Seed recipes › Revert puts the title and status back and removes the placeholder", async () => {
    const recipes = [recipeEntry("a"), recipeEntry("b")];
    await applyRecipes(owner, plan(recipes));

    const result = await revertRecipes(owner, plan(recipes));

    expect(result.reverted.sort()).toEqual(["axxxxxxxxxx", "bxxxxxxxxxx"]);
    expect(await video("a")).toMatchObject({ title: "Original a #shorts", status: "needs_recipe" });
    expect(await recipeCount()).toBe(0);
    expect((await checkCatalog(owner)).problems).toEqual([]);
  });

  test("video-catalog › Seed recipes › Revert leaves a recipe that is no longer the placeholder", async () => {
    await applyRecipes(owner, plan([recipeEntry("a")]));
    await owner.query("UPDATE recipe SET steps = '[\"A real step\", \"Another real step\"]'::jsonb");

    const result = await revertRecipes(owner, plan([recipeEntry("a")]));

    expect(result.notOurs).toEqual(["axxxxxxxxxx"]);
    expect(await video("a")).toMatchObject({ title: "Dish a", status: "ready" });
    expect(await recipeCount()).toBe(1);
  });

  test("video-catalog › Seed recipes › The health check reports a broken rule", async () => {
    await owner.query("UPDATE video SET status = 'ready', title = title WHERE youtube_id = $1", ["cxxxxxxxxxx"]);

    const check = await checkCatalog(owner);

    expect(check.problems).toEqual(["a ready or not_easy video has no recipe: cxxxxxxxxxx"]);
  });
});
