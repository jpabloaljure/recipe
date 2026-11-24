import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, expectPlayer, hideTab, showTab } from "../support/player";
import { test } from "../support/test";

test("playback › Pause when the tab is hidden › Tab is hidden while a video plays", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });

  await hideTab(page);

  await expectPlayer(page, id, { state: "paused", muted: true });
});

test("playback › Pause when the tab is hidden › Return to the tab", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await hideTab(page);
  await expectPlayer(page, id, { state: "paused", muted: true });

  await showTab(page);

  await expectPlayer(page, id, { state: "playing", muted: true });
});
