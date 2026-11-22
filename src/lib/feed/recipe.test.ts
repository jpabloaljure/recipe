import { describe, expect, it } from "vitest";
import { toRecipe, type RecipeRow } from "./recipe";

const row = (overrides: Partial<RecipeRow> = {}): RecipeRow => ({
  servings: "2",
  ingredients: [{ name: "flour", quantity: "1", unit: "cup" }, { name: "salt", quantity: null, unit: null }],
  steps: ["Mix.", "Bake."],
  source: "description",
  ...overrides,
});

describe("toRecipe", () => {
  it("returns the recipe as stored when its items have the contract's shape", () => {
    expect(toRecipe(row())).toEqual(row());
  });

  it("keeps a null servings value", () => {
    expect(toRecipe(row({ servings: null }))?.servings).toBeNull();
  });

  it.each([
    ["an ingredient that is a string", { ingredients: ["flour"] }],
    ["an ingredient without a name", { ingredients: [{ quantity: "1", unit: "cup" }] }],
    ["an ingredient with an empty name", { ingredients: [{ name: "", quantity: null, unit: null }] }],
    ["a quantity that is a number", { ingredients: [{ name: "egg", quantity: 2, unit: null }] }],
    ["a step that is not text", { steps: ["Mix.", 3] }],
    ["ingredients that are not a list", { ingredients: { name: "flour" } }],
    ["steps that are not a list", { steps: "Mix." }],
  ])("returns null for %s", (_label, overrides) => {
    expect(toRecipe(row(overrides as Partial<RecipeRow>))).toBeNull();
  });
});
