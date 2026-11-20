import { activeSlide, catalog, openFeed, scrollToSlide, videos } from "../support/feed";
import { swipeNext } from "../support/gestures";
import { expect, test } from "../support/test";

test("feed › Wrap to the start after the last video › Swipe past the last video", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  await scrollToSlide(page, 2);

  await swipeNext(page);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", "video1");
});

test("feed › Wrap to the start after the last video › Catalog spans several pages", async ({ page }) => {
  // Three pages: video1–3 | video4–6 | video7.
  await openFeed(page, catalog(videos(7), 3));
  await scrollToSlide(page, 6);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", "video7");

  await swipeNext(page);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", "video1");
});

test("feed › Wrap to the start after the last video › Keep swiping after the wrap", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  await scrollToSlide(page, 3);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", "video1");

  await swipeNext(page);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", "video2");
});
