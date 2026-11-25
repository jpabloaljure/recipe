import { catalog, openFeed, videosWithRecipes } from "../support/feed";
import { activeVideoId, expectPlayer } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

// The phone's two shapes: 412x915 (no room for the panel) and 915x412 (342 px per side).
const portrait = { width: 412, height: 915 };
const landscape = { width: 915, height: 412 };

test("recipe-panel › A turn or resize across the panel's switch swaps the sheet and the panel › Turn a phone from landscape to portrait", async ({ page }) => {
  onlyOn("phone-portrait");
  await page.setViewportSize(landscape);
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByTestId("recipe-panel")).toBeVisible();

  await page.setViewportSize(portrait);

  await expect(page.getByTestId("recipe-panel")).toBeHidden();
  await expect(page.getByRole("button", { name: "Recipe", exact: true })).toBeVisible();
  await expectPlayer(page, id, { state: "playing", muted: true });
});

test("recipe-panel › A turn or resize across the panel's switch swaps the sheet and the panel › Turn a phone with the button from portrait to landscape", async ({ page }) => {
  onlyOn("phone-portrait");
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByRole("button", { name: "Recipe", exact: true })).toBeVisible();

  await page.setViewportSize(landscape);

  await expect(page.getByTestId("recipe-panel")).toBeVisible();
  await expect(page.getByTestId("recipe-button")).toBeHidden();
  await expectPlayer(page, id, { state: "playing", muted: true });
});

test("recipe-panel › A turn or resize across the panel's switch swaps the sheet and the panel › Turn a phone with the sheet open from portrait to landscape", async ({ page }) => {
  onlyOn("phone-portrait");
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await page.getByRole("button", { name: "Recipe" }).click();
  await expect(page.getByTestId("recipe-sheet")).toBeVisible();

  await page.setViewportSize(landscape);

  await expect(page.getByTestId("recipe-panel")).toBeVisible();
  await expect(page.getByTestId("recipe-sheet")).toHaveCount(0);
  await expect(page.getByTestId("recipe-button")).toBeHidden();
  await expectPlayer(page, id, { state: "playing", muted: true });
  // Turning back does not bring a stale open sheet.
  await page.setViewportSize(portrait);
  await expect(page.getByTestId("recipe-sheet")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Recipe", exact: true })).toBeVisible();
});
