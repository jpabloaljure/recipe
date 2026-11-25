import { catalog, longRecipe, openFeed, recipe, videosWithRecipes } from "../support/feed";
import { activeVideoId } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const onAPhoneInPortrait = () => onlyOn("phone-portrait");

test("recipe-panel › The sheet shows the recipe › The sheet shows the recipe's content", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const number = (await activeVideoId(page)).replace("video", "");

  await page.getByRole("button", { name: "Recipe" }).click();

  const sheet = page.getByTestId("recipe-sheet");
  await expect(sheet.getByText("Servings: 4")).toBeVisible();
  await expect(sheet.getByRole("list").first().getByRole("listitem")).toHaveText(["2 cups flour", "1 cup water", "salt"]);
  await expect(sheet.getByRole("list").nth(1).getByRole("listitem")).toHaveText([
    `Recipe of video ${number}.`,
    "Rest the dough for ten minutes.",
    "Cook until golden.",
  ]);
  expect(await page.getByTestId("recipe-sheet-body").evaluate((element) => element.scrollTop)).toBe(0);
});

test("recipe-panel › The sheet shows the recipe › The sheet names the source", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3, () => recipe({ source: "captions" })), 3));
  const id = await activeVideoId(page);
  await page.getByRole("button", { name: "Recipe" }).click();

  const sheet = page.getByTestId("recipe-sheet");

  await expect(sheet.getByText("Recipe from the captions")).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Open on YouTube" })).toHaveAttribute("href", `https://www.youtube.com/watch?v=${id}`);
});

test("recipe-panel › The sheet shows the recipe › A missing serving size or quantity in the sheet", async ({ page }) => {
  onAPhoneInPortrait();
  const missing = recipe({
    servings: null,
    ingredients: [
      { name: "salt", quantity: null, unit: null },
      { name: "eggs", quantity: "2", unit: null },
      { name: "flour", quantity: null, unit: "cups" },
    ],
  });
  await openFeed(page, catalog(videosWithRecipes(3, () => missing), 3));

  await page.getByRole("button", { name: "Recipe" }).click();

  const sheet = page.getByTestId("recipe-sheet");
  await expect(sheet.getByText("Servings")).toHaveCount(0);
  await expect(sheet.getByRole("list").first().getByRole("listitem")).toHaveText(["salt", "2 eggs", "cups flour"]);
});

test("recipe-panel › The sheet shows the recipe › Open the sheet again", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3, () => longRecipe()), 3));
  await page.getByRole("button", { name: "Recipe" }).click();
  const body = page.getByTestId("recipe-sheet-body");
  await body.evaluate((element) => (element.scrollTop = 300));
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Close recipe" }).click();

  await page.getByRole("button", { name: "Recipe" }).click();

  expect(await page.getByTestId("recipe-sheet-body").evaluate((element) => element.scrollTop)).toBe(0);
});
