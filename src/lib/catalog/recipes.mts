// One-time placeholder recipes for the curated Shorts (change: seed recipes,
// a direct PR, not REC-008). The pure rules, so unit tests need no database;
// `scripts/db/load-recipes.mts` reads the files and `recipes-load.mts` writes.
//
// The recipes in `scripts/db/curated-recipes.json` are DUMMY data written from
// each video's title (not from its description or comments) to fill the app
// while the real extraction (REC-008, REC-010) is not built. They are stored
// with source `description`, the closest value the schema allows, and can be
// reverted with `--revert`. The real extraction never reads or replaces them:
// it skips known videos (ING-3).
import { type CuratedEntry, passesCandidateChecks } from "./curated.mts";

export type RecipeIngredient = { name: string; quantity: string | null; unit: string | null };

export type RecipeEntry = {
  youtubeId: string;
  /** The dish name: it becomes the video's title (the original stays in the curated list). */
  dish: string;
  servings: string | null;
  ingredients: RecipeIngredient[];
  steps: string[];
  estimatedActiveMinutes: number;
  specialEquipment: string[];
};

export type PlannedRecipe = {
  entry: RecipeEntry;
  /** `ready` when the recipe is easy (PRD 6.3), else `not_easy`. */
  status: "ready" | "not_easy";
  /** The title the curated list has, to restore on revert. */
  originalTitle: string;
};
export type SkippedRecipe = { youtubeId: string; reason: string };
export type RecipePlan = { toApply: PlannedRecipe[]; skipped: SkippedRecipe[] };

/** The easy thresholds (PRD 6.3). */
export const MAX_EASY_INGREDIENTS = 10;
export const MAX_EASY_MINUTES = 30;
/** EXT-5: a complete recipe has at least 2 ingredients and 2 steps. */
export const MIN_INGREDIENTS = 2;
export const MIN_STEPS = 2;
export const MAX_DISH_LENGTH = 80;

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";
const optionalText = (value: unknown): string | null => (isText(value) ? value.trim() : null);

export function isEasy(entry: Pick<RecipeEntry, "ingredients" | "estimatedActiveMinutes" | "specialEquipment">): boolean {
  return (
    entry.ingredients.length <= MAX_EASY_INGREDIENTS &&
    entry.estimatedActiveMinutes <= MAX_EASY_MINUTES &&
    entry.specialEquipment.length === 0
  );
}

/** The first thing a raw recipe entry lacks, or the entry in the shape the database needs. */
export function validateRecipeEntry(raw: unknown): { ok: true; entry: RecipeEntry } | (SkippedRecipe & { ok: false }) {
  const object = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  const rawId = object?.youtube_id;
  const id = typeof rawId === "string" ? rawId : "(no youtube_id)";
  const fail = (reason: string) => ({ ok: false as const, youtubeId: id, reason });

  if (!object) return fail("the entry is not an object");
  if (typeof rawId !== "string" || !YOUTUBE_ID.test(rawId)) return fail("youtube_id is missing or is not 11 characters of A-Z a-z 0-9 _ -");
  if (!isText(object.dish)) return fail("dish is missing");
  const dish = object.dish.trim();
  if (dish.length > MAX_DISH_LENGTH) return fail(`dish is longer than ${MAX_DISH_LENGTH} characters`);
  if (/[#@]/.test(dish)) return fail("dish must be a clean name, with no # or @");
  if (object.servings !== undefined && object.servings !== null && !isText(object.servings)) return fail("servings must be text when present");

  if (!Array.isArray(object.ingredients)) return fail("ingredients must be a list");
  const ingredients: RecipeIngredient[] = [];
  for (const [index, item] of object.ingredients.entries()) {
    const ingredient = typeof item === "object" && item !== null && !Array.isArray(item) ? (item as Record<string, unknown>) : null;
    if (!ingredient || !isText(ingredient.name)) return fail(`ingredient ${index + 1} has no name`);
    ingredients.push({ name: ingredient.name.trim(), quantity: optionalText(ingredient.quantity), unit: optionalText(ingredient.unit) });
  }
  if (ingredients.length < MIN_INGREDIENTS) return fail(`fewer than ${MIN_INGREDIENTS} ingredients (EXT-5)`);

  if (!Array.isArray(object.steps) || !object.steps.every(isText)) return fail("steps must be a list of non-empty texts");
  const steps = (object.steps as string[]).map((step) => step.trim());
  if (steps.length < MIN_STEPS) return fail(`fewer than ${MIN_STEPS} steps (EXT-5)`);

  const minutes = object.estimated_active_minutes;
  if (typeof minutes !== "number" || !Number.isInteger(minutes) || minutes <= 0) {
    return fail("estimated_active_minutes is missing or is not a positive whole number");
  }
  const equipment = object.special_equipment ?? [];
  if (!Array.isArray(equipment) || !equipment.every(isText)) return fail("special_equipment must be a list of texts");

  return {
    ok: true,
    entry: {
      youtubeId: rawId,
      dish,
      servings: optionalText(object.servings),
      ingredients,
      steps,
      estimatedActiveMinutes: minutes,
      specialEquipment: (equipment as string[]).map((item) => item.trim()),
    },
  };
}

/**
 * What to do with each raw recipe: apply it (to a curated video that passes
 * ING-2, so never to a `rejected` one) or skip it with a reason. The first of
 * a repeated YouTube ID wins.
 */
export function planRecipes(rawRecipes: readonly unknown[], curated: readonly CuratedEntry[]): RecipePlan {
  const byId = new Map(curated.map((entry) => [entry.youtubeId, entry]));
  const toApply: PlannedRecipe[] = [];
  const skipped: SkippedRecipe[] = [];
  const seen = new Set<string>();
  for (const raw of rawRecipes) {
    const result = validateRecipeEntry(raw);
    if (!result.ok) {
      skipped.push({ youtubeId: result.youtubeId, reason: result.reason });
      continue;
    }
    const { entry } = result;
    const video = byId.get(entry.youtubeId);
    if (!video) {
      skipped.push({ youtubeId: entry.youtubeId, reason: "the video is not in the curated list" });
      continue;
    }
    if (!passesCandidateChecks(video)) {
      skipped.push({ youtubeId: entry.youtubeId, reason: "the video fails the ING-2 checks, so it is stored as rejected" });
      continue;
    }
    if (seen.has(entry.youtubeId)) {
      skipped.push({ youtubeId: entry.youtubeId, reason: "the same youtube_id appears earlier in the recipe file" });
      continue;
    }
    seen.add(entry.youtubeId);
    toApply.push({ entry, status: isEasy(entry) ? "ready" : "not_easy", originalTitle: video.title });
  }
  return { toApply, skipped };
}
