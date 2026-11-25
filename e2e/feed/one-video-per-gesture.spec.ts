import { activeFrame, catalog, openFeed, scrollToSlide, slides, videos, videosWithRecipes } from "../support/feed";
import { swipeNext, swipePrevious } from "../support/gestures";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

const fiveVideos = () => catalog(videos(5), 5);

test("feed › One video per gesture › Swipe to the next video", async ({ page }) => {
  await openFeed(page, fiveVideos());
  await scrollToSlide(page, 1);

  await swipeNext(page);

  await expect(slides(page).nth(2)).toHaveAttribute("data-active", "true");
});

test("feed › One video per gesture › Swipe to the previous video", async ({ page }) => {
  await openFeed(page, fiveVideos());
  await scrollToSlide(page, 2);

  await swipePrevious(page);

  await expect(slides(page).nth(1)).toHaveAttribute("data-active", "true");
});

// Synthesized flick; real finger-flick physics on a phone stay a manual check (E2E rule 13).
// Skipped on CI (rule 10): on the Linux runner the synthesized flick moved two
// videos in about 3 of 8 runs (trace: scrollTop = 2 slides), and neither a
// slower flick nor waiting for the embed fixed it. It still runs locally.
// Follow-up: backlog/draft-backlog-list.md D-9.
test("feed › One video per gesture › Hard flick", async ({ page }) => {
  test.fixme(!!process.env.CI, "Flaky on the Linux CI runner: see backlog/draft-backlog-list.md D-9");
  await openFeed(page, fiveVideos());

  await swipeNext(page, { strength: "hard" });

  await expect(slides(page).nth(1)).toHaveAttribute("data-active", "true");
});

test("feed › One video per gesture › Swipe that starts on the video", async ({ page }) => {
  await openFeed(page, fiveVideos());

  await swipeNext(page, { target: activeFrame(page) });

  await expect(slides(page).nth(1)).toHaveAttribute("data-active", "true");
});

test("feed › One video per gesture › Swipe beside the video with the panel open", async ({ page }) => {
  onlyOn("desktop", "phone-landscape");
  await openFeed(page, catalog(videosWithRecipes(5), 5));
  await expect(page.getByTestId("recipe-panel")).toBeVisible();
  const frame = (await activeFrame(page).boundingBox())!;

  // The finger starts in the right gutter, beside the video, where the panel is not.
  await swipeNext(page, { x: Math.round(frame.x + frame.width + 60) });

  await expect(slides(page).nth(1)).toHaveAttribute("data-active", "true");
});
