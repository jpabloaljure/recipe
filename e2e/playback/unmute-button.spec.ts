import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, expectPlayer, playerOf, setPlayerVolume } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Unmute button › Tap the unmute button", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });

  await page.getByTestId("unmute-button").click();

  await expectPlayer(page, id, { state: "playing", muted: false });
  await expect(page.getByTestId("unmute-button")).toHaveCount(0);
});

test("playback › Unmute button › Tap the unmute button when the player's volume is 0", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await setPlayerVolume(page, id, 0);

  await page.getByTestId("unmute-button").click();

  await expectPlayer(page, id, { state: "playing", muted: false });
  await expect.poll(async () => (await playerOf(page, id))?.volume).toBeGreaterThan(0);
  await expect(page.getByTestId("unmute-button")).toHaveCount(0);
});
