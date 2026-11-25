import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type CuratedEntry, parseList, validateEntry } from "./curated.mts";
import { isEasy, planRecipes, validateRecipeEntry } from "./recipes.mts";

// Rules of the one-time placeholder recipes (a direct PR, not REC-008).

const curatedEntry = (overrides: Partial<CuratedEntry> = {}): CuratedEntry => ({
  youtubeId: "AAAAAAAAAAA",
  title: "Garlic pasta #shorts",
  channelName: "Example Kitchen",
  channelId: "UCexample0001",
  durationSeconds: 42,
  embeddable: true,
  language: "en",
  ...overrides,
});

const recipe = (overrides: Record<string, unknown> = {}) => ({
  youtube_id: "AAAAAAAAAAA",
  dish: "Garlic Pasta",
  servings: "2",
  ingredients: [
    { name: "pasta", quantity: "200", unit: "g" },
    { name: "garlic", quantity: "2", unit: "cloves" },
  ],
  steps: ["Boil the pasta.", "Toss it with the garlic."],
  estimated_active_minutes: 15,
  ...overrides,
});

describe("seed recipes › Recipe entry", () => {
  it("› a complete entry is accepted, with empty quantity and unit as null", () => {
    const result = validateRecipeEntry(recipe({ ingredients: [{ name: "salt", quantity: "to taste", unit: "" }, { name: "pasta" }] }));
    expect(result.ok && result.entry.ingredients).toEqual([
      { name: "salt", quantity: "to taste", unit: null },
      { name: "pasta", quantity: null, unit: null },
    ]);
  });

  it.each([
    ["fewer than 2 ingredients (EXT-5)", { ingredients: [{ name: "pasta" }] }],
    ["fewer than 2 steps (EXT-5)", { steps: ["Boil the pasta."] }],
    ["an ingredient without a name", { ingredients: [{ name: "pasta" }, { quantity: "1" }] }],
    ["a dish with a hashtag", { dish: "Garlic pasta #shorts" }],
    ["a dish with a handle", { dish: "Pasta @someone" }],
    ["an empty dish", { dish: " " }],
    ["a bad youtube_id", { youtube_id: "short" }],
    ["minutes that are not a positive whole number", { estimated_active_minutes: 0 }],
    ["a step that is not text", { steps: ["Boil.", 3] }],
  ])("› %s is refused", (_name, overrides) => {
    expect(validateRecipeEntry(recipe(overrides)).ok).toBe(false);
  });
});

describe("seed recipes › Easy check (PRD 6.3)", () => {
  const facts = { ingredients: Array.from({ length: 10 }, (_, i) => ({ name: `i${i}`, quantity: null, unit: null })), estimatedActiveMinutes: 30, specialEquipment: [] };

  it("› 10 ingredients, 30 minutes and no special equipment is easy", () => {
    expect(isEasy(facts)).toBe(true);
  });
  it.each([
    ["11 ingredients", { ingredients: [...facts.ingredients, { name: "x", quantity: null, unit: null }] }],
    ["31 minutes", { estimatedActiveMinutes: 31 }],
    ["special equipment", { specialEquipment: ["sous vide"] }],
  ])("› %s is not easy", (_name, overrides) => {
    expect(isEasy({ ...facts, ...overrides })).toBe(false);
  });
});

describe("seed recipes › Plan", () => {
  it("› a recipe for a curated video becomes ready and remembers the original title", () => {
    const plan = planRecipes([recipe()], [curatedEntry()]);
    expect(plan.skipped).toEqual([]);
    expect(plan.toApply).toHaveLength(1);
    expect(plan.toApply[0]).toMatchObject({ status: "ready", originalTitle: "Garlic pasta #shorts" });
  });

  it("› a hard recipe becomes not_easy", () => {
    const plan = planRecipes([recipe({ estimated_active_minutes: 90 })], [curatedEntry()]);
    expect(plan.toApply[0].status).toBe("not_easy");
  });

  it("› a video that is not in the curated list, a rejected one and a repeated ID are skipped", () => {
    const plan = planRecipes(
      [recipe({ youtube_id: "BBBBBBBBBBB" }), recipe({ youtube_id: "CCCCCCCCCCC" }), recipe(), recipe()],
      [curatedEntry(), curatedEntry({ youtubeId: "CCCCCCCCCCC", embeddable: false })],
    );
    expect(plan.toApply).toHaveLength(1);
    expect(plan.skipped.map((s) => s.youtubeId)).toEqual(["BBBBBBBBBBB", "CCCCCCCCCCC", "AAAAAAAAAAA"]);
  });
});

describe("seed recipes › The committed files", () => {
  const read = (name: string) => {
    const parsed = parseList(readFileSync(new URL(`../../../scripts/db/${name}`, import.meta.url), "utf8"));
    if (!parsed.ok) throw new Error(parsed.reason);
    return parsed.entries;
  };
  const curated = read("curated-shorts.json").flatMap((raw) => {
    const result = validateEntry(raw);
    return result.ok ? [result.entry] : [];
  });
  const plan = planRecipes(read("curated-recipes.json"), curated);

  it("› every recipe in curated-recipes.json is valid and none is skipped", () => {
    expect(plan.skipped).toEqual([]);
    expect(plan.toApply).toHaveLength(21);
  });

  it("› every placeholder recipe is easy, so each video stays in the feed", () => {
    expect(plan.toApply.every((p) => p.status === "ready")).toBe(true);
  });

  it("› three good videos are left without a recipe, to show the title-only state", () => {
    const withRecipe = new Set(plan.toApply.map((p) => p.entry.youtubeId));
    expect(["U-GTBW-s2RU", "jPB1-F87ZME", "qZ-rT0A7MgM"].filter((id) => withRecipe.has(id))).toEqual([]);
  });
});
