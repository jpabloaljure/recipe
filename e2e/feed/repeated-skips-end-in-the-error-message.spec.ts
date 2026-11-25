import type { Page } from "@playwright/test";
import { catalog, openFeed, slides, statusView, stubFeed, videos } from "../support/feed";
import { activeVideoId, emitError, expectPlayerExists, failVideosOnPlay } from "../support/player";
import { expect, test } from "../support/test";

/** The active video reports a removed video; waits until its slide is gone. */
async function dropActive(page: Page): Promise<string> {
  const id = await activeVideoId(page);
  await expectPlayerExists(page, id);
  await emitError(page, id, 100);
  await expect(page.locator(`[data-testid="feed-slide"][data-youtube-id="${id}"]`)).toHaveCount(0);
  return id;
}

test("feed › Repeated skips end in the error message › Three in a row", async ({ page }) => {
  // Every video fails only when it becomes active, so each one counts as skipped in a row.
  await failVideosOnPlay(page, Object.fromEntries(videos(5).map((video) => [video.youtubeId, 100])));
  await stubFeed(page, catalog(videos(5), 5));

  await page.goto("/"); // not openFeed: the feed reaches the error view before a first embed settles
  await expect(statusView(page).getByText("Oops, something went wrong")).toBeVisible();
  await expect(statusView(page).getByRole("button", { name: "Retry" })).toBeVisible();
});

test("feed › Repeated skips end in the error message › None left", async ({ page }) => {
  await openFeed(page, catalog(videos(2), 2));

  await dropActive(page);
  const last = await activeVideoId(page);
  await expectPlayerExists(page, last);
  await emitError(page, last, 100);

  await expect(statusView(page).getByText("Oops, something went wrong")).toBeVisible();
  await expect(statusView(page).getByRole("button", { name: "Retry" })).toBeVisible();
});

test("feed › Repeated skips end in the error message › Retry after skipped videos", async ({ page }) => {
  const requested = await openFeed(page, catalog(videos(2), 2));
  const dropped = [await dropActive(page)];
  const last = await activeVideoId(page);
  dropped.push(last);
  await expectPlayerExists(page, last);
  await emitError(page, last, 100);
  await expect(statusView(page).getByRole("button", { name: "Retry" })).toBeVisible();

  await statusView(page).getByRole("button", { name: "Retry" }).click();

  await expect(slides(page).first()).toBeAttached();
  const ids = await slides(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-youtube-id")));
  expect([...new Set(ids)].sort()).toEqual([...dropped].sort());
  expect(requested).toEqual([null, null]);
});
