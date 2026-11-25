// The text rules of the recipe panel (REC-006, change add-recipe-panel, design
// Decision 5), as pure functions so unit tests need no browser.
import type { Ingredient, RecipeSource } from "./types";

/** "2 cups flour"; a missing quantity or unit is left out, with no stray space. */
export function ingredientLine(ingredient: Ingredient): string {
  return [ingredient.quantity, ingredient.unit, ingredient.name]
    .map((part) => (part ?? "").trim())
    .filter((part) => part !== "")
    .join(" ");
}

/** "Servings: 4", or `null` when the recipe has no serving size. */
export function servingsText(servings: string | null): string | null {
  const text = (servings ?? "").trim();
  return text === "" ? null : `Servings: ${text}`;
}

const SOURCE_LABELS: Record<RecipeSource, string> = {
  description: "Recipe from the description",
  comment: "Recipe from the top comment",
  captions: "Recipe from the captions",
};

/** Where the recipe came from, in words (wording confirmed 2026-11-24). */
export function sourceLabel(source: RecipeSource): string {
  return SOURCE_LABELS[source];
}

/** The original YouTube video the source link opens. */
export function videoUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`;
}
