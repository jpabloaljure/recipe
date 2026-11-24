import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, expectPlayer } from "../support/player";
import { expect, test } from "../support/test";

test("playback › Unmute button › Tap the unmute button", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });

  await page.getByTestId("unmute-button").click();

  await expectPlayer(page, id, { state: "playing", muted: false });
  await expect(page.getByTestId("unmute-button")).toHaveCount(0);
});
