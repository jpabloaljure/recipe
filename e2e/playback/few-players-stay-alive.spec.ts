import { catalog, openFeed, scrollToSlide, videos } from "../support/feed";
import { swipeNext, swipePrevious } from "../support/gestures";
import { livePlayers } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Few players stay alive › Swipe through the feed", async ({ page }) => {
  await openFeed(page, catalog(videos(8), 8));
  await scrollToSlide(page, 3);
  await swipePrevious(page);

  await swipeNext(page);

  // Settled on slide 3 again: its own player and its two neighbours', and no more.
  await expect(page.getByTestId("feed-slide").nth(3)).toHaveAttribute("data-active", "true");
  await expect.poll(async () => (await livePlayers(page)).length).toBe(3);
  // Settled: it stays at three or fewer, never more.
  expect((await livePlayers(page)).length).toBeLessThanOrEqual(3);
});

test("playback › Few players stay alive › First video", async ({ page }) => {
  await openFeed(page, catalog(videos(5), 5));

  await expect.poll(async () => (await livePlayers(page)).length).toBe(2);
});
