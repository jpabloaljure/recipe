import { catalog, openFeed, slides, videos } from "../support/feed";
import { swipePrevious } from "../support/gestures";
import { expect, test } from "../support/test";

test("feed › No backward wrap on the first video › Swipe back on the first video", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));

  await swipePrevious(page);

  await expect(slides(page).first()).toHaveAttribute("data-active", "true");
  expect(await page.getByTestId("feed").evaluate((feed) => feed.scrollTop)).toBe(0);
});
