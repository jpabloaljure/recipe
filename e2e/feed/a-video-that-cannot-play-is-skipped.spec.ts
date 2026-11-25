import { activeSlide, catalog, openFeed, slides, videos } from "../support/feed";
import { activeVideoId, emitError, expectPlayerExists } from "../support/player";
import { expect, test } from "../support/test";

// The client shuffles each page (REC-002), so the tests read this visit's order
// from the slides and compare with it. "A removed video on real YouTube" is a
// manual check (E2E rule 13).

async function visitOrder(page: Parameters<typeof slides>[0], count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push((await slides(page).nth(i).getAttribute("data-youtube-id")) as string);
  }
  return ids;
}

test("feed › A video that cannot play is skipped › The active video cannot play", async ({ page }) => {
  await openFeed(page, catalog(videos(4), 4));
  const [first, second] = await visitOrder(page, 2);
  expect(await activeVideoId(page)).toBe(first);
  await expectPlayerExists(page, first);

  await emitError(page, first, 100);

  await expect(page.locator(`[data-testid="feed-slide"][data-youtube-id="${first}"]`)).toHaveCount(0);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", second);
  await expect(activeSlide(page)).toBeInViewport();
});

test("feed › A video that cannot play is skipped › The next video cannot play", async ({ page }) => {
  await openFeed(page, catalog(videos(4), 4));
  const [first, second, third] = await visitOrder(page, 3);
  await expectPlayerExists(page, second);

  await emitError(page, second, 150);

  await expect(page.locator(`[data-testid="feed-slide"][data-youtube-id="${second}"]`)).toHaveCount(0);
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", first);
  expect(await visitOrder(page, 2)).toEqual([first, third]);
});
