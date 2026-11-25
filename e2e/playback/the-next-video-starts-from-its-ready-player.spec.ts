import { catalog, openFeed, videos } from "../support/feed";
import { swipeNext } from "../support/gestures";
import { activeVideoId, expectPlayer, playerOf, videoIdOfSlide } from "../support/player";
import { expect, test } from "../support/test";

test("playback › The next video starts from its ready player › Swipe to the next video", async ({ page }) => {
  await openFeed(page, catalog(videos(4), 4));
  await expectPlayer(page, await activeVideoId(page), { state: "playing", muted: true });
  const next = await videoIdOfSlide(page, 1);
  await expect.poll(async () => (await playerOf(page, next))?.state).toBe("paused");
  const serialBefore = (await playerOf(page, next))?.serial;

  await swipeNext(page);

  await expectPlayer(page, next, { state: "playing", muted: true });
  expect((await playerOf(page, next))?.serial).toBe(serialBefore);
});
