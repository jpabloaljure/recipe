// Maps a stored recipe row to the API's `Recipe` (REC-002). The database only
// checks that `ingredients` and `steps` are JSON arrays (REC-019); their items
// are checked here, so one malformed row (a console edit, an ingestion bug)
// cannot hand the client a recipe it cannot show.
import type { Ingredient, Recipe, RecipeSource } from "./types";

export type RecipeRow = {
  servings: string | null;
  ingredients: unknown;
  steps: unknown;
  source: RecipeSource;
};

const isText = (value: unknown): value is string => typeof value === "string";
const isTextOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";

function isIngredient(value: unknown): value is Ingredient {
  if (typeof value !== "object" || value === null) return false;
  const { name, quantity, unit } = value as Record<string, unknown>;
  return isText(name) && name !== "" && isTextOrNull(quantity) && isTextOrNull(unit);
}

/**
 * The recipe, or `null` when its items are not the shape the contract promises.
 * `null` is the title-only state the client already handles (REC-006); the
 * caller logs it, so the bad row can be found and fixed.
 */
export function toRecipe(row: RecipeRow): Recipe | null {
  const { ingredients, steps } = row;
  if (!Array.isArray(ingredients) || !ingredients.every(isIngredient)) return null;
  if (!Array.isArray(steps) || !steps.every(isText)) return null;
  return { servings: row.servings, ingredients, steps, source: row.source };
}
