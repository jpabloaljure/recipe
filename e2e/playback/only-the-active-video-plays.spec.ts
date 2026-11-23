import { catalog, openFeed, scrollToSlide, videos } from "../support/feed";
import { expectPlayer, playerOf, videoIdOfSlide } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Only the active video plays › Neighbour videos are idle", async ({ page }) => {
  await openFeed(page, catalog(videos(4), 4));
  await scrollToSlide(page, 1);
  const [before, active, after] = [await videoIdOfSlide(page, 0), await videoIdOfSlide(page, 1), await videoIdOfSlide(page, 2)];
  await expectPlayer(page, active, { state: "playing", muted: true });

  // Both neighbours have a player, and neither is playing.
  await expect.poll(async () => (await playerOf(page, after)) !== null).toBe(true);
  for (const id of [before, after]) {
    const player = await playerOf(page, id);
    expect(player?.muted).toBe(true);
    expect(["unstarted", "paused"]).toContain(player?.state);
  }
});
