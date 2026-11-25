import { describe, expect, it } from "vitest";
import { ingredientLine, servingsText, sourceLabel, videoUrl } from "./recipe-text";

// Names follow `recipe-panel › <Requirement> › <Scenario>` (change add-recipe-panel).

describe("recipe-panel › The panel shows the recipe's content", () => {
  it("› an ingredient shows its quantity, unit and name", () => {
    expect(ingredientLine({ name: "flour", quantity: "2", unit: "cups" })).toBe("2 cups flour");
  });

  it("› a missing quantity or unit is left out, with no empty label or stray space", () => {
    expect(ingredientLine({ name: "salt", quantity: null, unit: null })).toBe("salt");
    expect(ingredientLine({ name: "eggs", quantity: "2", unit: null })).toBe("2 eggs");
    expect(ingredientLine({ name: "flour", quantity: null, unit: "cups" })).toBe("cups flour");
    expect(ingredientLine({ name: "salt", quantity: " ", unit: "" })).toBe("salt");
  });

  it("› the serving size is shown when there is one and left out when there is none", () => {
    expect(servingsText("4")).toBe("Servings: 4");
    expect(servingsText("2–3")).toBe("Servings: 2–3");
    expect(servingsText(null)).toBeNull();
    expect(servingsText("  ")).toBeNull();
  });
});

describe("recipe-panel › The panel names the recipe's source", () => {
  it("› the label names the source in words", () => {
    expect(sourceLabel("description")).toBe("Recipe from the description");
    expect(sourceLabel("comment")).toBe("Recipe from the top comment");
    expect(sourceLabel("captions")).toBe("Recipe from the captions");
  });

  it("› the link goes to the original video", () => {
    expect(videoUrl("G7D983zlGFc")).toBe("https://www.youtube.com/watch?v=G7D983zlGFc");
  });
});
