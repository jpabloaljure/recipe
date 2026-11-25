import type { Page } from "@playwright/test";
import { activeFrame, catalog, openFeed, videosWithRecipes } from "../support/feed";
import { activeVideoId, expectPlayer } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const panel = (page: Page) => page.getByTestId("recipe-panel");

async function expectPanelLeftOfVideo(page: Page): Promise<void> {
  await expect(panel(page)).toBeVisible();
  const box = (await panel(page).boundingBox())!;
  const frame = (await activeFrame(page).boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(frame.x);
}

async function expectNoControls(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: "Recipe" })).toHaveCount(0);
  await expect(panel(page).getByRole("button")).toHaveCount(0);
}

// 56.25vh + 520px: at 800 px high the room is 260 px per side from 970 px wide.
const exactlyRoom = { width: 970, height: 800 };
const lessRoom = { width: 960, height: 800 }; // 255 px per side

test("recipe-panel › The panel is open beside the video when there is room › Desktop window", async ({ page }) => {
  onlyOn("desktop");

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await expectPanelLeftOfVideo(page);
  await expectNoControls(page);
});

test("recipe-panel › The panel is open beside the video when there is room › Phone in landscape with room", async ({ page }) => {
  onlyOn("phone-landscape");

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await expectPanelLeftOfVideo(page);
});

test("recipe-panel › The panel is open beside the video when there is room › Exactly 260 px of room", async ({ page }) => {
  onlyOn("desktop");
  await page.setViewportSize(exactlyRoom);

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await expectPanelLeftOfVideo(page);
});

test("recipe-panel › The panel is open beside the video when there is room › 255 px of room", async ({ page }) => {
  onlyOn("desktop");
  await page.setViewportSize(lessRoom);

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  await expect(panel(page)).toBeHidden();
});

test("recipe-panel › The panel is open beside the video when there is room › Widen a window", async ({ page }) => {
  onlyOn("desktop");
  await page.setViewportSize(lessRoom);
  await openFeed(page, catalog(videosWithRecipes(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(panel(page)).toBeHidden();

  await page.setViewportSize(exactlyRoom);

  await expectPanelLeftOfVideo(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
});
