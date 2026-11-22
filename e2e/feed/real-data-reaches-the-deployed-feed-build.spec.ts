import { slides } from "../support/feed";
import { expect, test } from "../support/test";

// Smoke test: the app is up. Part of every E2E run; if it fails, nothing else
// in the suite is meaningful. Run it alone with `pnpm test:e2e --grep @smoke`.
//
// It stubs nothing: it loads the real `/api/feed` route and checks the feed
// shows a video (REC-002). In CI the build reads a migrated, seeded database;
// against production it needs videos loaded by the curated-list loader.

test("feed › Real data reaches the deployed feed build › Smoke test against a seeded database", { tag: "@smoke" }, async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("Easy Recipes");
  await expect(slides(page).first()).toBeAttached();
  expect(consoleErrors).toEqual([]);
});
