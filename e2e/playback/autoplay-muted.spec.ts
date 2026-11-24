import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, expectPlayer, mutedReads } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Autoplay muted › A video becomes active with sound off", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);

  await expectPlayer(page, id, { state: "playing", muted: true });

  // The app has read the player's muted state many times, and the player reports it late:
  // the video must still be muted, with the unmute button shown.
  await expect.poll(() => mutedReads(page, id)).toBeGreaterThan(8);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();
});
