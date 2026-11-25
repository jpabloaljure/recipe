import { activeFrame, catalog, openFeed, videosWithRecipes } from "../support/feed";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

// Both scenarios need room for the panel: the desktop and phone-landscape projects.
const withRoom = () => onlyOn("desktop", "phone-landscape");

test("recipe-panel › The panel does not cover the video or the unmute button › The video stays centered", async ({ page }) => {
  withRoom();

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  const viewport = page.viewportSize()!;
  const frame = (await activeFrame(page).boundingBox())!;
  const panel = (await page.getByTestId("recipe-panel").boundingBox())!;
  expect(frame.x + frame.width / 2).toBeCloseTo(viewport.width / 2, 0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(frame.x);
});

test("recipe-panel › The panel does not cover the video or the unmute button › The unmute button stays visible", async ({ page }) => {
  withRoom();

  await openFeed(page, catalog(videosWithRecipes(3), 3));

  const unmute = page.getByTestId("unmute-button");
  await expect(unmute).toBeVisible();
  const frame = (await activeFrame(page).boundingBox())!;
  const button = (await unmute.boundingBox())!;
  const panel = (await page.getByTestId("recipe-panel").boundingBox())!;
  expect(button.x).toBeGreaterThanOrEqual(frame.x + frame.width);
  expect(button.x).toBeGreaterThanOrEqual(panel.x + panel.width);
});
