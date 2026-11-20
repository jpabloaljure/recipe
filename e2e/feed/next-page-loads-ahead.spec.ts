import { catalog, openFeed, scrollToSlide, videos } from "../support/feed";
import { expect, test } from "../support/test";

test("feed › Next page loads ahead › Approach the last loaded video", async ({ page }) => {
  // Two pages: video1–5 | video6–8. The first page leaves more than two slides ahead.
  const requested = await openFeed(page, catalog(videos(8), 5));
  expect(requested).toEqual([null]);

  await scrollToSlide(page, 2);

  await expect.poll(() => requested).toEqual([null, "p1"]);
});
