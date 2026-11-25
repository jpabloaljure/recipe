import { activeFrame, activeSlide, catalog, longRecipe, openFeed, scrollToSlide, videos, videosWithRecipes } from "../support/feed";
import { activeVideoId } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const withRoom = () => onlyOn("desktop", "phone-landscape");

test("recipe-panel › The panel follows the active video › Another video becomes active", async ({ page }) => {
  withRoom();
  await openFeed(page, catalog(videosWithRecipes(3, () => longRecipe()), 3));
  const first = await activeVideoId(page);
  const body = page.getByTestId("recipe-body");
  await body.evaluate((element) => (element.scrollTop = 200));
  await expect.poll(() => body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

  await scrollToSlide(page, 1);

  const second = await activeVideoId(page);
  expect(second).not.toBe(first);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", second);
  await expect(page.getByTestId("recipe-body")).toHaveAttribute("data-youtube-id", second);
  expect(await page.getByTestId("recipe-body").evaluate((element) => element.scrollTop)).toBe(0);
  await expect(page.getByTestId("recipe-panel").getByText(`Recipe of video ${second.replace("video", "")}.`)).toBeVisible();
});

test("recipe-panel › The panel follows the active video › A title-only video", async ({ page }) => {
  withRoom();

  await openFeed(page, catalog(videos(3), 3));

  await expect(page.getByTestId("recipe-panel")).toBeHidden();
  await expect(page.getByTestId("recipe-body")).toHaveCount(0);
  const viewport = page.viewportSize()!;
  const frame = (await activeFrame(page).boundingBox())!;
  expect(frame.x + frame.width / 2).toBeCloseTo(viewport.width / 2, 0);
});
