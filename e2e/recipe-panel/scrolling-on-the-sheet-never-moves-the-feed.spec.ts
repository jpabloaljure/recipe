import { activeSlide, catalog, longRecipe, openFeed, recipe, videosWithRecipes } from "../support/feed";
import { swipeNext } from "../support/gestures";
import { activeVideoId } from "../support/player";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const onAPhoneInPortrait = () => onlyOn("phone-portrait");

const feedScroll = (page: import("@playwright/test").Page) => page.getByTestId("feed").evaluate((element) => element.scrollTop);

test("recipe-panel › Scrolling on the sheet never moves the feed › A recipe taller than the sheet", async ({ page }) => {
  onAPhoneInPortrait();
  await openFeed(page, catalog(videosWithRecipes(3, () => longRecipe()), 3));
  const first = await activeVideoId(page);
  await page.getByRole("button", { name: "Recipe" }).click();
  const body = page.getByTestId("recipe-sheet-body");

  for (let i = 0; i < 6; i++) await swipeNext(page, { target: page.getByTestId("recipe-sheet") });

  expect(await body.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(body.getByText("Step 40:")).toBeInViewport();
  expect(await feedScroll(page)).toBe(0);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
});

test("recipe-panel › Scrolling on the sheet never moves the feed › A recipe shorter than the sheet", async ({ page }) => {
  onAPhoneInPortrait();
  const short = recipe({ steps: ["Mix.", "Cook."], ingredients: [{ name: "flour", quantity: null, unit: null }, { name: "water", quantity: null, unit: null }] });
  await openFeed(page, catalog(videosWithRecipes(3, () => short), 3));
  const first = await activeVideoId(page);
  await page.getByRole("button", { name: "Recipe" }).click();

  await swipeNext(page, { target: page.getByTestId("recipe-sheet") });

  expect(await feedScroll(page)).toBe(0);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
});
