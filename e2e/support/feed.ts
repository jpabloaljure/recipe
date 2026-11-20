import type { Locator, Page } from "@playwright/test";
import type { FeedItem, FeedPage } from "../../src/lib/feed/types";
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

/**
 * Answers `/api/feed` from `pages` (no cursor = page 0, cursor `pN` = page N)
 * and returns the list of cursors requested, in order (`null` for the first page).
 */
export async function stubFeed(page: Page, pages: FeedPage[]): Promise<(string | null)[]> {
  const requested: (string | null)[] = [];
  await page.route("**/api/feed**", async (route) => {
    const cursor = new URL(route.request().url()).searchParams.get("cursor");
    requested.push(cursor);
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

/** Opens the feed on `pages` and waits for its first slide. */
export async function openFeed(page: Page, pages: FeedPage[]): Promise<(string | null)[]> {
  const requested = await stubFeed(page, pages);
  await page.goto("/");
  await expect(activeSlide(page)).toBeAttached();
  return requested;
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
