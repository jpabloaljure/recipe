import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, emitEnded, expectPlayer, playerOf } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Loop and end event › Video reaches the end", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await page.getByTestId("feed").evaluate((feed) => {
    const ended: string[] = [];
    (window as unknown as { __ended: string[] }).__ended = ended;
    feed.addEventListener("videoended", (event) => ended.push((event as CustomEvent<{ youtubeId: string }>).detail.youtubeId));
  });

  await emitEnded(page, id);

  await expect.poll(() => page.evaluate(() => (window as unknown as { __ended: string[] }).__ended)).toEqual([id]);
  await expectPlayer(page, id, { state: "playing", muted: true });
  expect((await playerOf(page, id))?.calls.slice(-2)).toEqual(["seekTo(0)", "play"]);
});
