import { catalog, openFeed, slides, videos } from "./feed";
import { expect, test } from "./test";

// Self-tests of the network guard in e2e/support/test.ts and the feed stub in e2e/support/feed.ts.

test("feed stub › stubbed page › renders its slides", async ({ page }) => {
  const requested = await openFeed(page, catalog(videos(2), 2));

  await expect(slides(page)).toHaveCount(4); // two videos, then one wrap-around cycle
  // The client shuffles each page (REC-002), so only the set of videos is fixed.
  const ids = await slides(page).evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-youtube-id")));
  expect([...ids.slice(0, 2)].sort()).toEqual(["video1", "video2"]);
  expect(ids.slice(2)).toEqual(ids.slice(0, 2)); // the wrap-around cycle repeats the visit's order
  expect(requested).toEqual([null]);
});

test("network guard › YouTube embed › serves the local stub page", async ({ page, blockedRequests }) => {
  await page.setContent(
    '<iframe title="video" src="https://www.youtube-nocookie.com/embed/abc123?playsinline=1"></iframe>',
  );

  await expect(page.frameLocator('iframe[title="video"]').getByTestId("youtube-stub")).toBeAttached();
  expect(blockedRequests).toEqual([]);
});

test("network guard › outside request › fails the test", async ({ page, blockedRequests }) => {
  // The guard's teardown check must fail this test. Everything in the body is
  // expected to pass, so the only failure left is the guard's.
  test.fail();

  const fetchFailed = await page.evaluate(() =>
    fetch("https://example.com/data.json").then(
      () => false,
      () => true,
    ),
  );

  expect(fetchFailed).toBe(true);
  expect(blockedRequests).toEqual(["https://example.com/data.json"]);
});
