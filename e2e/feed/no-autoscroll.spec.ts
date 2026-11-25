import { activeSlide, catalog, openFeed, slides, videos } from "../support/feed";
import { activeVideoId, emitEnded, emitError, expectPlayerExists } from "../support/player";
import { expect, test } from "../support/test";

test("feed › No autoscroll › Video ends with no interaction", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const first = await activeVideoId(page);
  await expectPlayerExists(page, first);

  await emitEnded(page, first);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
});

test("feed › No autoscroll › Active video cannot play", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const first = await activeVideoId(page);
  const second = (await slides(page).nth(1).getAttribute("data-youtube-id")) as string;
  await expectPlayerExists(page, first);

  await emitError(page, first, 101);

  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", second);
});
