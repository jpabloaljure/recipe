import { catalog, openFeed, scrollToSlide, videosWithRecipes } from "../support/feed";
import { activeVideoId, expectPlayer } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const onAPhoneInPortrait = () => onlyOn("phone-portrait");

test("recipe-panel › The sheet closes with its button and when the video changes › Close the sheet", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  await page.getByRole("button", { name: "Recipe" }).click();

  await page.getByRole("button", { name: "Close recipe" }).click();

  await expect(page.getByTestId("recipe-sheet")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Recipe", exact: true })).toBeVisible();
});

test("recipe-panel › The sheet closes with its button and when the video changes › The close button's name", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await page.getByRole("button", { name: "Recipe" }).click();

  await expect(page.getByRole("button", { name: "Close recipe", exact: true })).toBeVisible();
});

test("recipe-panel › The sheet closes with its button and when the video changes › The video keeps playing", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await page.getByRole("button", { name: "Recipe" }).click();

  await page.getByRole("button", { name: "Close recipe" }).click();

  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByTestId("feed-frame").first()).toBeVisible();
});

test("recipe-panel › The sheet closes with its button and when the video changes › Another video becomes active with the sheet open", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  await page.getByRole("button", { name: "Recipe" }).click();
  await expect(page.getByTestId("recipe-sheet")).toBeVisible();

  await scrollToSlide(page, 1);

  await expect(page.getByTestId("recipe-sheet")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Recipe", exact: true })).toBeVisible();
});

test("recipe-panel › The sheet closes with its button and when the video changes › Close the sheet with Escape", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  await page.getByRole("button", { name: "Recipe" }).click();
  await expect(page.getByTestId("recipe-sheet")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByTestId("recipe-sheet")).toHaveCount(0);
  await expect(page.getByTestId("recipe-button")).toBeFocused();
});

test("recipe-panel › The sheet closes with its button and when the video changes › Focus moves into the sheet", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await page.getByRole("button", { name: "Recipe" }).click();

  await expect(page.getByRole("button", { name: "Close recipe", exact: true })).toBeFocused();
});
