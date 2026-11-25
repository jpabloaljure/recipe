import { catalog, feedBehavior, releaseHeld, slides, statusView, stubFeed, videos } from "../support/feed";
import { expect, test } from "../support/test";

// The "does not answer within 10 seconds" scenario is a Vitest test with injected
// timers (http-source.test.ts): a 10-second wait is not an E2E test (rule 1).

test("feed › The first page shows its state › First page is loading", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.first = "hold";
  await stubFeed(page, catalog(videos(2), 2), behavior);

  await page.goto("/");

  await expect(statusView(page).getByTestId("feed-loading")).toBeVisible();
  releaseHeld(behavior);
  await expect(slides(page).first()).toBeAttached();
  await expect(statusView(page)).toHaveCount(0);
});

test("feed › The first page shows its state › Empty catalog", async ({ page }) => {
  await stubFeed(page, [{ items: [], nextCursor: null }]);

  await page.goto("/");

  await expect(statusView(page).getByText("No recipes yet")).toBeVisible();
  await expect(slides(page)).toHaveCount(0);
});

test("feed › The first page shows its state › First page request fails", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.first = "5xx";
  await stubFeed(page, catalog(videos(2), 2), behavior);

  await page.goto("/");

  await expect(statusView(page).getByText("Oops, something went wrong")).toBeVisible();
  await expect(statusView(page).getByRole("button", { name: "Retry" })).toBeVisible();
});

test("feed › The first page shows its state › Offline", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.first = "offline";
  await stubFeed(page, catalog(videos(2), 2), behavior);

  await page.goto("/");

  await expect(statusView(page).getByText("Oops, something went wrong")).toBeVisible();
  await expect(statusView(page).getByRole("button", { name: "Retry" })).toBeVisible();
});

test("feed › The first page shows its state › Retry the first page", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.first = "5xx";
  const requested = await stubFeed(page, catalog(videos(2), 2), behavior);
  await page.goto("/");
  await expect(statusView(page).getByRole("button", { name: "Retry" })).toBeVisible();
  behavior.failures.first = "hold";

  await statusView(page).getByRole("button", { name: "Retry" }).click();

  await expect(statusView(page).getByTestId("feed-loading")).toBeVisible();
  await expect.poll(() => requested).toEqual([null, null]);
  releaseHeld(behavior);
});

test("feed › The first page shows its state › Retry is ignored while a request runs", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.first = "5xx";
  const requested = await stubFeed(page, catalog(videos(2), 2), behavior);
  await page.goto("/");
  const retry = statusView(page).getByRole("button", { name: "Retry" });
  await expect(retry).toBeVisible();
  behavior.failures.first = "hold";

  // Two clicks in one tick, before React has replaced the button: only the first may start a request.
  await retry.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });

  await expect(statusView(page).getByTestId("feed-loading")).toBeVisible();
  releaseHeld(behavior);
  await expect(slides(page).first()).toBeAttached();
  await expect.poll(() => requested).toEqual([null, null]);
});
