import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PANEL_MEDIA_QUERY, TALL_SCREEN_MEDIA_QUERY } from "./panel-room";

// Names follow `recipe-panel › <Requirement> › <Scenario>` (change add-recipe-sheet).

const css = (name: string) => readFileSync(new URL(`./${name}`, import.meta.url), "utf8");

describe("recipe-panel › A turn or resize across the panel's switch swaps the sheet and the panel", () => {
  it("› the panel, the sheet and the Recipe button use the same query as the code that listens", () => {
    for (const file of ["RecipePanel.module.css", "RecipeSheet.module.css", "Feed.module.css"]) {
      expect(css(file), file).toContain(PANEL_MEDIA_QUERY);
    }
  });

  it("› the Recipe button uses the tall-screen query that closes the sheet", () => {
    expect(css("Feed.module.css")).toContain(TALL_SCREEN_MEDIA_QUERY);
  });
});
