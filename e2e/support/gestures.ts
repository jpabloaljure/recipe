import type { Locator, Page } from "@playwright/test";

/**
 * Swipe helpers (add-e2e-testing design Decision 5).
 *
 * Every project, desktop included, gets a touch scroll synthesized through
 * the Chrome DevTools Protocol (`Input.synthesizeScrollGesture`), which runs
 * through Chromium's real scroll and snap path. Synthesized mouse-wheel
 * scrolls are not used: in headless Chromium they jump instantly and do not
 * follow scroll-snap like a real wheel.
 *
 * Each helper resolves once scrolling has settled: on the `scrollend` event,
 * or, if nothing scrolled, after 10 animation frames with no `scroll` event
 * once the gesture has been sent. Never on a fixed delay (E2E rule 6).
 *
 * Synthesized touch is not real input physics: hard flicks on a real phone
 * and real wheel/trackpad scrolling stay manual checks (E2E rule 13).
 */

export type GestureOptions = {
  /** Where the gesture starts. Defaults to the centre of the viewport. */
  target?: Locator;
  /** `hard` is a fast, long flick. */
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

type GestureState = { started: boolean; ended: boolean };
type GestureWindow = Window & { __e2eGesture?: GestureState };

async function swipe(page: Page, direction: 1 | -1, options: GestureOptions): Promise<void> {
  const strength = options.strength ?? "normal";
  const { x, y } = await startPoint(page, options.target);
  const height = page.viewportSize()?.height ?? 800;

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
    await cdp.send("Input.synthesizeScrollGesture", {
      x,
      y,
      // Positive yDistance scrolls up, so moving forward needs a negative one.
      // A slow drag snaps to the nearest item, so a normal swipe goes clearly
      // past halfway (at exactly half, touch slop or a busy CI machine can
      // leave it just short and it snaps back).
      yDistance: -direction * Math.round(height * (strength === "hard" ? 0.9 : 0.7)),
      speed: strength === "hard" ? 6000 : 1200,
      gestureSourceType: "touch",
    });
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

async function startPoint(page: Page, target?: Locator): Promise<{ x: number; y: number }> {
  if (target) {
    const box = await target.boundingBox();
    if (!box) throw new Error("Gesture target is not visible");
    return { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  }
  const size = page.viewportSize() ?? { width: 1280, height: 800 };
  return { x: Math.round(size.width / 2), y: Math.round(size.height / 2) };
}
