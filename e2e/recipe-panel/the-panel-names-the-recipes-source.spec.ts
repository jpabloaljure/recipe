import { catalog, openFeed, recipe, videosWithRecipes } from "../support/feed";
import { activeVideoId } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const withRoom = () => onlyOn("desktop", "phone-landscape");

test("recipe-panel › The panel names the recipe's source › The source label", async ({ page }) => {
  withRoom();

  await openFeed(page, catalog(videosWithRecipes(3, () => recipe({ source: "comment" })), 3));

  await expect(page.getByTestId("recipe-panel").getByText("Recipe from the top comment")).toBeVisible();
});

test("recipe-panel › The panel names the recipe's source › The source link", async ({ page }) => {
  withRoom();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const id = await activeVideoId(page);

  const popupPromise = page.waitForEvent("popup");
  await page.getByTestId("recipe-panel").getByRole("link", { name: "Open on YouTube" }).click();

  const popup = await popupPromise;
  expect(popup.url()).toBe(`https://www.youtube.com/watch?v=${id}`);
  await expect(page.getByTestId("feed")).toBeVisible();
});
