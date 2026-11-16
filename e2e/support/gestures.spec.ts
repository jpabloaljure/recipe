import type { Page } from "@playwright/test";
import { swipeNext, swipePrevious } from "./gestures";
import { expect, test } from "./test";

// Self-tests of the gesture helpers in e2e/support/gestures.ts, on a
// full-height scroll-snap list of five items (the pattern REC-001 uses).

const SNAP_LIST = `<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      html, body { margin: 0; height: 100%; overflow: hidden; }
      #list {
        height: 100dvh;
        overflow-y: scroll;
        scroll-snap-type: y mandatory;
        overscroll-behavior-y: contain;
      }
      .item {
        height: 100dvh;
        scroll-snap-align: start;
        scroll-snap-stop: always;
      }
    </style>
  </head>
  <body>
    <div id="list" data-testid="list">
      <div class="item" style="background:#333">1</div>
      <div class="item" style="background:#444">2</div>
      <div class="item" style="background:#555">3</div>
      <div class="item" style="background:#666">4</div>
      <div class="item" style="background:#777">5</div>
    </div>
  </body>
</html>`;

/** Index of the item the list has snapped to. */
function activeItem(page: Page): Promise<number> {
  return page
    .getByTestId("list")
    .evaluate((list) => Math.round(list.scrollTop / list.clientHeight));
}

async function openListAt(page: Page, index: number): Promise<void> {
  await page.setContent(SNAP_LIST);
  await page.getByTestId("list").evaluate((list, i) => {
    list.scrollTop = i * list.clientHeight;
  }, index);
  expect(await activeItem(page)).toBe(index);
}

test("gestures › swipeNext › moves to the next item", async ({ page }) => {
  await openListAt(page, 0);

  await swipeNext(page);

  expect(await activeItem(page)).toBe(1);
});

test("gestures › swipeNext hard › still moves exactly one item", async ({ page }) => {
  await openListAt(page, 0);

  await swipeNext(page, { strength: "hard" });

  expect(await activeItem(page)).toBe(1);
});

test("gestures › swipePrevious › moves to the previous item", async ({ page }) => {
  await openListAt(page, 2);

  await swipePrevious(page);

  expect(await activeItem(page)).toBe(1);
});

test("gestures › swipePrevious on the first item › stays on the first item", async ({ page }) => {
  await openListAt(page, 0);

  await swipePrevious(page);

  expect(await activeItem(page)).toBe(0);
});
