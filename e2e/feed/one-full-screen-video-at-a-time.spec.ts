import { activeFrame, catalog, openFeed, slides, videos } from "../support/feed";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

test("feed › One full-screen video at a time › Feed loads on a phone in portrait", async ({ page }) => {
  onlyOn("phone-portrait");
  const viewport = page.viewportSize()!;

  await openFeed(page, catalog(videos(3), 3));

  const frame = (await activeFrame(page).boundingBox())!;
  expect(frame.x).toBeCloseTo(0, 0);
  expect(frame.y).toBeCloseTo(0, 0);
  expect(frame.width).toBeCloseTo(viewport.width, 0);
  expect(frame.height).toBeCloseTo(viewport.height, 0);
  const next = (await slides(page).nth(1).boundingBox())!;
  expect(next.y).toBeGreaterThanOrEqual(viewport.height - 1);
});
