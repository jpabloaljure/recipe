import type { CDPSession, Locator, Page } from "@playwright/test";

/**
 * Swipe helpers (add-e2e-testing design Decision 5).
 *
 * Every project, desktop included, gets a finger swipe built from raw touch
 * events sent through the Chrome DevTools Protocol (`Input.dispatchTouchEvent`:
 * touchStart, timed touchMoves, touchEnd). They run through Chromium's real
 * scroll, fling and snap path, on macOS and Linux alike.
 *
 * Not used:
 * - `Input.synthesizeScrollGesture`: on Linux (CI) it sends touchstart and
 *   touchend with no touchmove, so nothing scrolls.
 * - Synthesized mouse-wheel scrolls: in headless Chromium they jump instantly
 *   and do not follow scroll-snap like a real wheel.
 *
 * Each helper resolves once scrolling has settled: on the `scrollend` event,
 * or, if nothing scrolled, after 10 animation frames with no `scroll` event
 * once the gesture has been sent. Never on a fixed delay (E2E rule 6).
 *
 * Synthesized touch is not real input physics: hard flicks on a real phone
 * and real wheel/trackpad scrolling stay manual checks (E2E rule 13).
 */

export type GestureOptions = {
  /** Element the finger starts on. Defaults to the whole viewport. */
  target?: Locator;
  /** The finger's x position, in px; defaults to the middle of the target. */
  x?: number;
  /** `normal` is a slow drag; `hard` is a fast flick. */
  strength?: "normal" | "hard";
};

/** Moves the content forward (the finger moves up). */
export function swipeNext(page: Page, options: GestureOptions = {}): Promise<void> {
  return swipe(page, 1, options);
}

/** Moves the content backward (the finger moves down). */
export function swipePrevious(page: Page, options: GestureOptions = {}): Promise<void> {
  return swipe(page, -1, options);
}

// Both gestures cover 70% of the screen height, so a slow drag (which snaps to
// the nearest item) ends clearly past halfway. The hard flick moves at about
// 12,000 px/s on a Pixel 7, the top of a real finger flick; far faster
// synthesized flicks (~20,000 px/s) were seen to skip past
// `scroll-snap-stop: always`, which a real flick does not.
const DISTANCE = 0.7;
const STROKES = {
  normal: { moves: 12, msPerMove: 16 },
  hard: { moves: 5, msPerMove: 10 },
} as const;

type GestureState = { started: boolean; ended: boolean };
type GestureWindow = Window & { __e2eGesture?: GestureState };

async function swipe(page: Page, direction: 1 | -1, options: GestureOptions): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1280, height: 800 };
  const area = options.target ? await options.target.boundingBox() : null;
  if (options.target && !area) throw new Error("Gesture target is not visible");
  const box = area ?? { x: 0, y: 0, width: viewport.width, height: viewport.height };

  // The finger starts near the far edge of the target and stays on screen.
  const x = options.x ?? Math.round(box.x + box.width / 2);
  const startY = box.y + box.height * (direction === 1 ? 0.85 : 0.15);
  const deltaY = -direction * DISTANCE * viewport.height;

  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const state: GestureState = { started: false, ended: false };
        (window as GestureWindow).__e2eGesture = state;
        // Scroll events do not bubble; listen in the capture phase to see every scroller.
        window.addEventListener("scroll", () => (state.started = true), { capture: true });
        window.addEventListener("scrollend", () => (state.ended = true), { capture: true });
        // Scroll events are dispatched per frame. Let events from an earlier
        // scroll (e.g. a test's setup) flush, then reset, so only this
        // gesture's events count.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            state.started = false;
            state.ended = false;
            resolve();
          }),
        );
      }),
  );

  const cdp = await page.context().newCDPSession(page);
  try {
    await stroke(cdp, x, startY, deltaY, STROKES[options.strength ?? "normal"]);
  } finally {
    await cdp.detach();
  }

  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const state = (window as GestureWindow).__e2eGesture!;
        let quietFrames = 0;
        const tick = () => {
          if (state.ended) return resolve();
          if (!state.started && ++quietFrames >= 10) return resolve();
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}

/**
 * One finger stroke. Event timestamps (not wall-clock pauses) set the speed,
 * so the fling velocity Chromium computes is the same on a fast or busy machine.
 */
async function stroke(
  cdp: CDPSession,
  x: number,
  startY: number,
  deltaY: number,
  { moves, msPerMove }: { moves: number; msPerMove: number },
): Promise<void> {
  let timestamp = Date.now() / 1000;
  const at = (y: number) => [{ x, y: Math.round(y), id: 1 }];

  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(startY), timestamp });
  for (let i = 1; i <= moves; i++) {
    timestamp += msPerMove / 1000;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: at(startY + (deltaY * i) / moves),
      timestamp,
    });
  }
  timestamp += msPerMove / 1000;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], timestamp });
}
