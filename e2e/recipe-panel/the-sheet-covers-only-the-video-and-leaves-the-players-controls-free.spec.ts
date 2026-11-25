import { activeFrame, catalog, openFeed, videosWithRecipes } from "../support/feed";
import { activeVideoId, expectPlayer } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const onAPhoneInPortrait = () => onlyOn("phone-portrait");

// "The player's control zones stay free" and "A tap on a player control with the sheet open" are
// manual checks (the player's own layout, E2E rule 13): tasks 5.2 and 5.3 of the change.

test("recipe-panel › The sheet covers only the video and leaves the player's controls free › A translucent sheet", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await page.getByRole("button", { name: "Recipe" }).click();

  const color = await page.getByTestId("recipe-sheet").evaluate((element) => getComputedStyle(element).backgroundColor);
  const alpha = Number(/rgba\(\s*0,\s*0,\s*0,\s*([\d.]+)\)/.exec(color)?.[1]);
  expect(alpha).toBeGreaterThan(0);
  expect(alpha).toBeLessThan(1);
});

test("recipe-panel › The sheet covers only the video and leaves the player's controls free › The sheet covers only the video's area", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await page.getByRole("button", { name: "Recipe" }).click();

  const sheet = (await page.getByTestId("recipe-sheet").boundingBox())!;
  const frame = (await activeFrame(page).boundingBox())!;
  expect(sheet.x).toBeGreaterThanOrEqual(frame.x - 1);
  expect(sheet.x + sheet.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
  expect(sheet.y).toBeGreaterThanOrEqual(frame.y);
  expect(sheet.y + sheet.height).toBeLessThanOrEqual(frame.y + frame.height);
});

test("recipe-panel › The sheet covers only the video and leaves the player's controls free › Tap the unmute button with the sheet open", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await page.getByRole("button", { name: "Recipe" }).click();

  await page.getByTestId("unmute-button").click();

  await expectPlayer(page, id, { state: "playing", muted: false });
  await expect(page.getByTestId("recipe-sheet")).toBeVisible();
});
