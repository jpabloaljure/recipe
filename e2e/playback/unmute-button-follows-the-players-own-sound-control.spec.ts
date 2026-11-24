import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, emitUserMute, emitUserUnmute, expectPlayer } from "../support/player";
import { expect, test } from "../support/test";

test("playback › The unmute button follows the player's own sound control › Unmute with the player's control", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();

  await emitUserUnmute(page, id);

  await expect(page.getByTestId("unmute-button")).toHaveCount(0);
});

test("playback › The unmute button follows the player's own sound control › Mute with the player's control", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await page.getByTestId("unmute-button").click();
  await expectPlayer(page, id, { state: "playing", muted: false });
  await expect(page.getByTestId("unmute-button")).toHaveCount(0);

  await emitUserMute(page, id);

  await expect(page.getByTestId("unmute-button")).toBeVisible();
});
