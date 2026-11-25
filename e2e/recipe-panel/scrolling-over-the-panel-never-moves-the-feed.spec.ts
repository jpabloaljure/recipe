import { activeSlide, catalog, longRecipe, openFeed, recipe, videosWithRecipes } from "../support/feed";
import { activeVideoId } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const withRoom = () => onlyOn("desktop", "phone-landscape");

async function wheelOverPanel(page: import("@playwright/test").Page, deltaY: number): Promise<void> {
  const box = (await page.getByTestId("recipe-panel").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, deltaY);
}

const feedScroll = (page: import("@playwright/test").Page) => page.getByTestId("feed").evaluate((element) => element.scrollTop);

test("recipe-panel › Scrolling over the panel never moves the feed › A recipe taller than the panel", async ({ page }) => {
  withRoom();
  await openFeed(page, catalog(videosWithRecipes(3, () => longRecipe()), 3));
  const first = await activeVideoId(page);
  const body = page.getByTestId("recipe-body");

  for (let i = 0; i < 12; i++) await wheelOverPanel(page, 600);

  await expect.poll(() => body.evaluate((element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1)).toBe(true);
  expect(await feedScroll(page)).toBe(0);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
  await expect(body.getByText("Step 40:")).toBeInViewport();
});

test("recipe-panel › Scrolling over the panel never moves the feed › A recipe shorter than the panel", async ({ page }) => {
  withRoom();
  const short = recipe({ steps: ["Mix.", "Cook."], ingredients: [{ name: "flour", quantity: null, unit: null }, { name: "water", quantity: null, unit: null }] });
  await openFeed(page, catalog(videosWithRecipes(3, () => short), 3));
  const first = await activeVideoId(page);

  for (let i = 0; i < 4; i++) await wheelOverPanel(page, 600);

  expect(await feedScroll(page)).toBe(0);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
});
