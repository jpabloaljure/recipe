import type { Page } from "@playwright/test";
import { activeFrame, catalog, openFeed, videos } from "../support/feed";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

async function expectCenteredFullHeight(page: Page): Promise<void> {
  const viewport = page.viewportSize()!;
  const frame = (await activeFrame(page).boundingBox())!;

  expect(frame.height).toBeCloseTo(viewport.height, 0);
  expect(frame.width).toBeLessThan(viewport.width);
  expect(frame.width / frame.height).toBeCloseTo(9 / 16, 2);
  expect(frame.x + frame.width / 2).toBeCloseTo(viewport.width / 2, 0);
}

test("feed › Centered video on wide screens › Desktop", async ({ page }) => {
  onlyOn("desktop");

  await openFeed(page, catalog(videos(3), 3));

  await expectCenteredFullHeight(page);
});

test("feed › Centered video on wide screens › Phone in landscape", async ({ page }) => {
  onlyOn("phone-landscape");

  await openFeed(page, catalog(videos(3), 3));

  await expectCenteredFullHeight(page);
});
