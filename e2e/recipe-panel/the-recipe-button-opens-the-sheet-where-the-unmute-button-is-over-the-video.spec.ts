import { catalog, openFeed, videos, videosWithRecipes } from "../support/feed";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

// A phone in portrait has no room for the panel, and its unmute button is over the video.
const onAPhoneInPortrait = () => onlyOn("phone-portrait");

test("recipe-panel › The Recipe button opens the sheet where the unmute button is over the video › Tap the Recipe button", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const requests: string[] = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));

  await page.getByRole("button", { name: "Recipe" }).click();

  await expect(page.getByTestId("recipe-sheet")).toBeVisible();
  expect(requests.filter((path) => path.startsWith("/api/"))).toEqual([]);
});

test("recipe-panel › The Recipe button opens the sheet where the unmute button is over the video › The button's place with sound on", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const button = page.getByTestId("recipe-button");
  const unmute = page.getByTestId("unmute-button");
  const before = (await button.boundingBox())!;
  const unmuteBox = (await unmute.boundingBox())!;
  expect(before.y + before.height).toBeLessThanOrEqual(unmuteBox.y);

  await unmute.click();

  await expect(unmute).toHaveCount(0);
  const after = (await button.boundingBox())!;
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.y).toBeCloseTo(before.y, 0);
});

test("recipe-panel › The Recipe button opens the sheet where the unmute button is over the video › The button's name", async ({ page }) => {
  onAPhoneInPortrait();

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await expect(page.getByRole("button", { name: "Recipe", exact: true })).toBeVisible();
});

test("recipe-panel › The Recipe button opens the sheet where the unmute button is over the video › The button while the sheet is open", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await page.getByRole("button", { name: "Recipe" }).click();

  await expect(page.getByTestId("recipe-sheet")).toBeVisible();
  await expect(page.getByTestId("recipe-button")).toHaveCount(0);
});

test("recipe-panel › The Recipe button opens the sheet where the unmute button is over the video › A title-only video on a screen without room", async ({ page }) => {
  onAPhoneInPortrait();

  await openFeed(page, catalog(videos(3), 3));

  await expect(page.getByTestId("recipe-button")).toHaveCount(0);
  await expect(page.getByTestId("recipe-sheet")).toHaveCount(0);
});
