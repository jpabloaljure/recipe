import { activeSlide, catalog, openFeed, videos } from "../support/feed";
import { swipeNext } from "../support/gestures";
import { activeVideoId, expectPlayer, videoIdOfSlide } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Sound carries over in this tab › Another video becomes active after turning sound on", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  await page.getByTestId("unmute-button").click();
  await expectPlayer(page, await activeVideoId(page), { state: "playing", muted: false });

  await swipeNext(page);

  await expect(page.getByTestId("feed-slide").nth(1)).toHaveAttribute("data-active", "true");
  await expectPlayer(page, await videoIdOfSlide(page, 1), { state: "playing", muted: false });
  await expect(page.getByTestId("unmute-button")).toHaveCount(0);
});

test("playback › Sound carries over in this tab › Reload after turning sound on", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  await page.getByTestId("unmute-button").click();
  await expect(page.getByTestId("unmute-button")).toHaveCount(0);

  await page.reload();

  await expect(activeSlide(page)).toBeAttached();
  await expectPlayer(page, await activeVideoId(page), { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();
});
