import { catalog, openFeed, videos } from "../support/feed";
import { swipeNext } from "../support/gestures";
import { blockUnmutedAutoplay, expectPlayer, stallAfterUnmute, videoIdOfSlide } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Blocked unmuted autoplay falls back to muted › Browser blocks unmuted autoplay", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  await page.getByTestId("unmute-button").click();
  await blockUnmutedAutoplay(page);

  await swipeNext(page);

  await expectPlayer(page, await videoIdOfSlide(page, 1), { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();
});

test("playback › Blocked unmuted autoplay falls back to muted › The video stalls after the unmute", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  await page.getByTestId("unmute-button").click();
  await stallAfterUnmute(page);

  await swipeNext(page);

  await expectPlayer(page, await videoIdOfSlide(page, 1), { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();
});
