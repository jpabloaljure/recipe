import type { Page } from "@playwright/test";
import { activeSlide, catalog, openFeed, scrollToSlide, slides, videos } from "../support/feed";
import { swipeNext } from "../support/gestures";
import { expect, test } from "../support/test";

// The client shuffles each page it receives (REC-002), so these tests never
// assume which video is first: they read this visit's order from the slides
// the feed rendered and compare with that.
async function videoAt(page: Page, index: number): Promise<string> {
  const id = await slides(page).nth(index).getAttribute("data-youtube-id");
  if (!id) throw new Error(`Slide ${index} has no data-youtube-id.`);
  return id;
}

test("feed › Wrap to the start after the last video › Swipe past the last video", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const first = await videoAt(page, 0);
  await scrollToSlide(page, 2);

  await swipeNext(page);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
});

test("feed › Wrap to the start after the last video › Catalog spans several pages", async ({ page }) => {
  // Three pages: 3 + 3 + 1 videos, each page shuffled.
  await openFeed(page, catalog(videos(7), 3));
  const first = await videoAt(page, 0);
  await scrollToSlide(page, 6);
  const last = await videoAt(page, 6);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", last);
  expect(last).not.toBe(first);

  await swipeNext(page);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
});

test("feed › Wrap to the start after the last video › Keep swiping after the wrap", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const first = await videoAt(page, 0);
  const second = await videoAt(page, 1);
  await scrollToSlide(page, 3);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);

  await swipeNext(page);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", second);
});
