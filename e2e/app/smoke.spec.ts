import { expect, test } from "../support/test";

// Smoke test: the app is up. Part of every E2E run; if it fails, nothing else
// in the suite is meaningful. Run it alone with `pnpm test:e2e --grep @smoke`.

test("app › smoke › home page loads with no console errors", { tag: "@smoke" }, async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto("/");

  await expect(page).toHaveTitle("Easy Recipes");
  expect(consoleErrors).toEqual([]);
});
