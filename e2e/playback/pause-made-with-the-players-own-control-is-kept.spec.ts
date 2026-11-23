import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, emitUserPause, expectPlayer, hideTab, playerOf, showTab } from "../support/player";
import { expect, test } from "../support/test";
import type { Page } from "@playwright/test";

/** Lets the page run two frames, so anything the app would do in response has happened. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test("playback › A pause made with the player's own control is kept › Pause with the player's control", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  const before = (await playerOf(page, id))?.calls.length;

  await emitUserPause(page, id);
  await settle(page);

  await expectPlayer(page, id, { state: "paused", muted: true });
  expect((await playerOf(page, id))?.calls.length).toBe(before);
});

test("playback › A pause made with the player's own control is kept › Hide and show the tab after pausing", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await emitUserPause(page, id);
  const before = (await playerOf(page, id))?.calls.length;

  await hideTab(page);
  await showTab(page);
  await settle(page);

  await expectPlayer(page, id, { state: "paused", muted: true });
  expect((await playerOf(page, id))?.calls.length).toBe(before);
});
