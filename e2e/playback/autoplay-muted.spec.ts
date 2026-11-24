import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, expectPlayer } from "../support/player";
import { test } from "../support/test";

test("playback › Autoplay muted › A video becomes active with sound off", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));

  await expectPlayer(page, await activeVideoId(page), { state: "playing", muted: true });
});
