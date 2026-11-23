import { catalog, openFeed, videos } from "../support/feed";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

test("playback › Unmute button placement › Wide screen", async ({ page }) => {
  onlyOn("desktop", "phone-landscape");
  await openFeed(page, catalog(videos(3), 3));

  const button = await page.getByTestId("unmute-button").boundingBox();
  const frame = await page.locator('[data-active="true"]').getByTestId("feed-frame").boundingBox();

  expect(button && frame).toBeTruthy();
  // Outside the video, to the right of it, in its lower half.
  expect(button!.x).toBeGreaterThanOrEqual(frame!.x + frame!.width);
  expect(button!.y).toBeGreaterThan(frame!.y + frame!.height / 2);
  expect(button!.y + button!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
});

test("playback › Unmute button placement › Tall phone screen", async ({ page }) => {
  onlyOn("phone-portrait");
  await openFeed(page, catalog(videos(3), 3));

  const button = page.getByTestId("unmute-button");
  const box = await button.boundingBox();
  const frame = await page.locator('[data-active="true"]').getByTestId("feed-frame").boundingBox();

  expect(box && frame).toBeTruthy();
  // Over the video's bottom-right corner, not at its very bottom (YouTube's control bar is there).
  expect(box!.x).toBeGreaterThan(frame!.x + frame!.width / 2);
  expect(box!.x + box!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
  expect(box!.y).toBeGreaterThan(frame!.y + frame!.height / 2);
  expect(box!.y + box!.height).toBeLessThan(frame!.y + frame!.height - 40);
  // Transparent: the background lets most of the video through.
  const alpha = await button.evaluate((element) => {
    const match = /rgba?\(([^)]+)\)/.exec(getComputedStyle(element).backgroundColor);
    const parts = match ? match[1].split(",").map((part) => parseFloat(part)) : [0, 0, 0, 1];
    return parts.length === 4 ? parts[3] : 1;
  });
  expect(alpha).toBeLessThanOrEqual(0.3);
});
