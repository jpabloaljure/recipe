import type { Locator, Page } from "@playwright/test";
import type { FeedItem, FeedPage, Recipe } from "../../src/lib/feed/types";
import { expect } from "./test";

/**
 * Feed helpers (add-vertical-swipe-feed design Decision 8).
 *
 * Each test answers `/api/feed` itself with `page.route` and so chooses its
 * own catalog (E2E rule 5). The stub follows the API contract
 * (docs/api/openapi.yaml), so the tests stay valid when REC-002 replaces the
 * route's data with the database.
 */

/** Title-only feed items `video1`, `video2`, … (YouTube embeds are stubbed by the network guard). */
export function videos(count: number): FeedItem[] {
  return Array.from({ length: count }, (_, i) => ({
    youtubeId: `video${i + 1}`,
    title: `Video ${i + 1}`,
    channelName: "Test channel",
    recipe: null,
  }));
}

/**
 * A recipe stub (REC-006). The first step names the video it belongs to, so a
 * test can tell which video's recipe the panel shows. A missing quantity or unit
 * is `null`, as in the API contract.
 */
export function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    servings: "4",
    ingredients: [
      { name: "flour", quantity: "2", unit: "cups" },
      { name: "water", quantity: "1", unit: "cup" },
      { name: "salt", quantity: null, unit: null },
    ],
    steps: ["Mix the flour and the water.", "Rest the dough for ten minutes.", "Cook until golden."],
    source: "description",
    ...overrides,
  };
}

/** A recipe long enough to need scrolling in the panel on every project's screen. */
export function longRecipe(): Recipe {
  return recipe({
    steps: Array.from({ length: 40 }, (_, i) => `Step ${i + 1}: keep stirring and taste it before you go on.`),
  });
}

/** Feed items `video1`, `video2`, … that each have a recipe (REC-006); `recipeOf` can change one. */
export function videosWithRecipes(count: number, recipeOf: (index: number) => Recipe | null = () => recipe()): FeedItem[] {
  return videos(count).map((item, index) => {
    const base = recipeOf(index);
    return {
      ...item,
      recipe: base ? { ...base, steps: [`Recipe of video ${index + 1}.`, ...base.steps.slice(1)] } : null,
    };
  });
}

/** Splits items into contract-shaped pages, linked by the cursors `p1`, `p2`, … */
export function catalog(items: FeedItem[], pageSize: number): FeedPage[] {
  const pages: FeedPage[] = [];
  for (let start = 0; start < items.length; start += pageSize) {
    const index = pages.length;
    const next = start + pageSize < items.length ? `p${index + 1}` : null;
    pages.push({ items: items.slice(start, start + pageSize), nextCursor: next });
  }
  return pages;
}

/** How a page request fails (REC-018): a 5xx answer, a lost connection, or no answer until released. */
export type FeedFailure = "5xx" | "offline" | "hold";

/**
 * What a test changes while the feed runs: `failures` maps a page (`first`, or a
 * cursor such as `p1`) to how its request fails; a page with no entry is
 * answered normally. Requests set to `hold` wait until `releaseHeld`.
 */
export type FeedBehavior = { failures: Record<string, FeedFailure | undefined>; held: Array<() => void> };

export function feedBehavior(): FeedBehavior {
  return { failures: {}, held: [] };
}

/** Lets every held request go on to its normal answer. */
export function releaseHeld(behavior: FeedBehavior): void {
  for (const release of behavior.held.splice(0)) release();
}

/**
 * Answers `/api/feed` from `pages` (no cursor = page 0, cursor `pN` = page N)
 * and returns the list of cursors requested, in order (`null` for the first page).
 * Pass a `behavior` to make requests fail or hang, and change it as the test goes.
 */
export async function stubFeed(
  page: Page,
  pages: FeedPage[],
  behavior: FeedBehavior = feedBehavior(),
): Promise<(string | null)[]> {
  const requested: (string | null)[] = [];
  await page.route("**/api/feed**", async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get("cursor");
    requested.push(cursor);
    const failure = behavior.failures[cursor ?? "first"];
    if (failure === "offline") return route.abort("internetdisconnected");
    if (failure === "5xx") {
      return route.fulfill({
        status: 500,
        headers: { "Cache-Control": "no-store" },
        json: { error: { code: "internal_error", message: "Test failure." } },
      });
    }
    if (failure === "hold") await new Promise<void>((release) => behavior.held.push(release));
    const index = cursor === null ? 0 : Number(cursor.replace(/^p/, ""));
    const body = pages[index];
    if (!body) {
      return route.fulfill({
        status: 400,
        headers: { "Cache-Control": "no-store" },
        json: { error: { code: "invalid_cursor", message: "Unknown test cursor." } },
      });
    }
    return route.fulfill({ status: 200, headers: { "Cache-Control": "no-store" }, json: body });
  });
  return requested;
}

/**
 * Opens the feed on `pages` and waits until the first slide is active and its
 * embed has loaded (the network guard's YouTube stub page). Swipes start over
 * the cross-origin embed, and Chromium routes a touch over an out-of-process
 * iframe differently while it is still loading, which made a hard flick move
 * two videos on slower CI runs.
 */
export async function openFeed(
  page: Page,
  pages: FeedPage[],
  behavior?: FeedBehavior,
): Promise<(string | null)[]> {
  const requested = await stubFeed(page, pages, behavior);
  await page.goto("/");
  await expect(activeSlide(page)).toBeAttached();
  await expect(activeFrame(page).frameLocator("iframe").getByTestId("youtube-stub")).toBeAttached();
  return requested;
}

/** The status view (loading, empty or error message) that stands in for the slides. */
export function statusView(page: Page): Locator {
  return page.getByTestId("feed-status");
}

/** The end slide that closes a list whose next page is not here yet. */
export function endSlide(page: Page): Locator {
  return page.getByTestId("feed-end");
}

/** Scrolls to the end slide, as a swipe past the last video would. */
export async function scrollToEnd(page: Page): Promise<void> {
  await expect(endSlide(page)).toBeAttached();
  await page.getByTestId("feed").evaluate(
    (element) =>
      new Promise<void>((resolve) => {
        element.addEventListener("scrollend", () => resolve(), { once: true });
        element.scrollTop = element.scrollHeight;
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  await expect(endSlide(page)).toBeInViewport();
}

export function slides(page: Page): Locator {
  return page.getByTestId("feed-slide");
}

/** The slide the feed considers active (`data-active="true"`). */
export function activeSlide(page: Page): Locator {
  return slides(page).and(page.locator('[data-active="true"]'));
}

/** The video frame of the active slide. */
export function activeFrame(page: Page): Locator {
  return activeSlide(page).getByTestId("feed-frame");
}

/**
 * Sets up a starting slide by code, not by gestures (E2E rule 3): scrolls one
 * slide at a time so pages and cycles load as they would, and waits until
 * each slide is the active one. Each scroll resolves on `scrollend`, or after
 * 10 animation frames with no `scroll` event if nothing moved, so a scroll
 * that cannot happen fails on the `data-active` assertion instead of hanging
 * (same rule as e2e/support/gestures.ts; no fixed waits, rule 6).
 */
export async function scrollToSlide(page: Page, index: number): Promise<void> {
  const feed = page.getByTestId("feed");
  for (let i = 1; i <= index; i++) {
    await expect(slides(page).nth(i)).toBeAttached();
    await feed.evaluate(
      (element, target) =>
        new Promise<void>((resolve) => {
          let scrolled = false;
          let quietFrames = 0;
          element.addEventListener("scroll", () => (scrolled = true), { once: true });
          element.addEventListener("scrollend", () => resolve(), { once: true });
          element.scrollTop = target * element.clientHeight;
          const tick = () => {
            if (!scrolled && ++quietFrames >= 10) return resolve();
            if (!scrolled) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      i,
    );
    await expect(slides(page).nth(i)).toHaveAttribute("data-active", "true");
  }
}
