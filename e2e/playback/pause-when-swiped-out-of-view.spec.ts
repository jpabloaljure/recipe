import { catalog, openFeed, scrollToSlide, videos } from "../support/feed";
import { swipeNext, swipePrevious } from "../support/gestures";
import { activeVideoId, expectPlayer, playerOf } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Pause when swiped out of view › Swipe away from a playing video", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const first = await activeVideoId(page);
  await expectPlayer(page, first, { state: "playing", muted: true });

  await swipeNext(page);

  await expectPlayer(page, first, { state: "paused", muted: true });
});

test("playback › Pause when swiped out of view › Swipe back to a video", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const first = await activeVideoId(page);
  await scrollToSlide(page, 1);
  await expectPlayer(page, first, { state: "paused", muted: true });

  await swipePrevious(page);

  await expect(page.getByTestId("feed-slide").nth(0)).toHaveAttribute("data-active", "true");
  await expectPlayer(page, first, { state: "playing", muted: true });
  expect((await playerOf(page, first))?.calls).toContain("seekTo(0)");
});
