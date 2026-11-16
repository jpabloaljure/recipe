import { expect, test } from "./test";

// Self-tests of the network guard in e2e/support/test.ts.

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
