import { catalog, openFeed, videos } from "../support/feed";
import { activeVideoId, emitUserMute, emitUserUnmute, expectPlayer, mutedReads, reportMutedAs } from "../support/player";
import { expect, test } from "../support/test";
import type { Page } from "@playwright/test";

/** Waits until the app has read the player's muted state enough times to hold a baseline. */
async function untilBaselineRead(page: Page, id: string): Promise<void> {
  const before = await mutedReads(page, id);
  await expect.poll(() => mutedReads(page, id)).toBeGreaterThan(before + 7);
}

test("playback › The unmute button follows the player's own sound control › Unmute with the player's control", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();
  await untilBaselineRead(page, id);

  await emitUserUnmute(page, id);

  await expect(page.getByTestId("unmute-button")).toHaveCount(0);
});

test("playback › The unmute button follows the player's own sound control › Mute with the player's control", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await page.getByTestId("unmute-button").click();
  await expectPlayer(page, id, { state: "playing", muted: false });
  await expect(page.getByTestId("unmute-button")).toHaveCount(0);
  await untilBaselineRead(page, id);

  await emitUserMute(page, id);

  await expect(page.getByTestId("unmute-button")).toBeVisible();
});

test("playback › The unmute button follows the player's own sound control › A wrong report of the player's state", async ({ page }) => {
  await openFeed(page, catalog(videos(3), 3));
  const id = await activeVideoId(page);
  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();

  // From now on the player keeps saying "not muted" although it is muted.
  await reportMutedAs(page, false);
  const before = await mutedReads(page, id);
  await expect.poll(() => mutedReads(page, id)).toBeGreaterThan(before + 10);

  await expectPlayer(page, id, { state: "playing", muted: true });
  await expect(page.getByTestId("unmute-button")).toBeVisible();
});
