import { activeSlide, catalog, openFeed, videos } from "../support/feed";
import { swipeNext } from "../support/gestures";
import { onlyOn } from "../support/projects";
import { expect, test } from "../support/test";

// The plain "Tap on the video" scenario is the YouTube player's own behavior: a manual check (E2E rule 13).
test("feed › Taps reach the video player › Swipe that starts on the unmute icon", async ({ page }) => {
  onlyOn("phone-portrait");
  await openFeed(page, catalog(videos(3), 3));

  await swipeNext(page, { target: page.getByTestId("unmute-button") });

  await expect(page.getByTestId("feed-slide").nth(1)).toHaveAttribute("data-active", "true");
  await expect(activeSlide(page)).toHaveAttribute("data-youtube-id", /.+/);
});
