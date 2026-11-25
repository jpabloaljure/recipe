import { activeSlide, catalog, openFeed, scrollToSlide, slides, videos } from "../support/feed";
import { emitError, expectPlayerExists } from "../support/player";
import { expect, test } from "../support/test";

test("feed › The watched video stays on screen when others are dropped › An earlier video is removed", async ({ page }) => {
  // Four videos, so the list repeats: slides 0–3, then 4–7 (the second cycle). With three, dropping
  // one would leave a list whose length divides the shift and the old position would show the same video.
  await openFeed(page, catalog(videos(4), 4));
  const order = [0, 1].map((i) => slides(page).nth(i).getAttribute("data-youtube-id"));
  const [first, second] = (await Promise.all(order)) as string[];
  await scrollToSlide(page, 5); // the second cycle's copy of the second video
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", second);
  await expectPlayerExists(page, first); // the second cycle's first video is the neighbour above

  await emitError(page, first, 100);

  await expect(page.locator(`[data-testid="feed-slide"][data-youtube-id="${first}"]`)).toHaveCount(0);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", second);
  await expect(activeSlide(page)).toBeInViewport();
});
