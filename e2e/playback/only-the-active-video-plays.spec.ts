import { catalog, openFeed, scrollToSlide, videos } from "../support/feed";
import { expectPlayer, hideTab, playerOf, videoIdOfSlide } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Only the active video plays › Neighbour videos are idle", async ({ page }) => {
  await openFeed(page, catalog(videos(4), 4));
  await scrollToSlide(page, 1);
  const [before, active, after] = [await videoIdOfSlide(page, 0), await videoIdOfSlide(page, 1), await videoIdOfSlide(page, 2)];
  await expectPlayer(page, active, { state: "playing", muted: true });

  // Both neighbours have a player; the next one's warm-up is over, so neither plays.
  await expectPlayer(page, after, { state: "paused", muted: true });
  await expectPlayer(page, before, { state: "paused", muted: true });
});

test("playback › Only the active video plays › The next video is warmed up", async ({ page }) => {
  await openFeed(page, catalog(videos(4), 4));
  const next = await videoIdOfSlide(page, 1);

  // It played muted for a moment and was then paused at the start again.
  await expectPlayer(page, next, { state: "paused", muted: true });
  expect((await playerOf(page, next))?.calls.filter((call) => call !== "mute")).toEqual(["play", "pause", "seekTo(0)"]);
});

test("playback › Only the active video plays › No warm-up in a hidden tab", async ({ page }) => {
  await openFeed(page, catalog(videos(4), 4));
  await expectPlayer(page, await videoIdOfSlide(page, 1), { state: "paused", muted: true });
  await hideTab(page);
  await scrollToSlide(page, 1);
  const next = await videoIdOfSlide(page, 2);

  await expect.poll(async () => (await playerOf(page, next)) !== null).toBe(true);
  await expect.poll(async () => (await playerOf(page, await videoIdOfSlide(page, 1)))?.state).toBe("paused");
  expect((await playerOf(page, next))?.calls).not.toContain("play");
});
