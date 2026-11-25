import { swipeNext } from "../support/gestures";
import { catalog, endSlide, feedBehavior, openFeed, releaseHeld, scrollToEnd, scrollToSlide, videos } from "../support/feed";
import { expect, test } from "../support/test";

// Two pages: video1–5 | video6–8. The last loaded video is slide 4; reaching slide 2 asks for page 2.
// "Next page did not answer" is a Vitest test with injected timers (http-source.test.ts).

test("feed › An end slide while more pages remain › Next page is loading at the end", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.p1 = "hold";
  await openFeed(page, catalog(videos(8), 5), behavior);
  await scrollToSlide(page, 4);

  await scrollToEnd(page);

  await expect(endSlide(page).getByTestId("feed-loading")).toBeVisible();
  releaseHeld(behavior);
});

test("feed › An end slide while more pages remain › Next page failed at the end", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.p1 = "5xx";
  await openFeed(page, catalog(videos(8), 5), behavior);
  await scrollToSlide(page, 4);

  await expect(endSlide(page).getByRole("button", { name: "Retry" })).toBeAttached();
  await scrollToEnd(page);

  await expect(endSlide(page).getByRole("button", { name: "Retry" })).toBeVisible();
});

test("feed › An end slide while more pages remain › Retry the next page", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.p1 = "5xx";
  const requested = await openFeed(page, catalog(videos(8), 5), behavior);
  await scrollToSlide(page, 4);
  await expect(endSlide(page).getByRole("button", { name: "Retry" })).toBeAttached();
  await scrollToEnd(page);
  behavior.failures.p1 = "hold";
  const before = requested.length;

  await endSlide(page).getByRole("button", { name: "Retry" }).click();

  await expect(endSlide(page).getByTestId("feed-loading")).toBeVisible();
  await expect.poll(() => requested.length).toBe(before + 1);
  releaseHeld(behavior);
});

test("feed › An end slide while more pages remain › Swipe past the end slide", async ({ page }) => {
  const behavior = feedBehavior();
  behavior.failures.p1 = "hold";
  await openFeed(page, catalog(videos(8), 5), behavior);
  await scrollToSlide(page, 4);
  await scrollToEnd(page);

  await swipeNext(page);

  await expect(endSlide(page)).toBeInViewport();
  releaseHeld(behavior);
});
