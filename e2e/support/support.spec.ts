import { catalog, openFeed, slides, videos } from "./feed";
import { emitError, failVideos, livePlayers } from "./player";
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

test("network guard › IFrame Player API › serves a fake player the tests can drive", async ({ page, blockedRequests }) => {
  await page.setContent(
    `<iframe id="v" src="https://www.youtube-nocookie.com/embed/abc123?enablejsapi=1"></iframe>
     <script src="https://www.youtube.com/iframe_api"></script>`,
  );
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { YT?: { Player?: unknown } }).YT?.Player)).toBe("function");

  const result = await page.evaluate(
    () =>
      new Promise<{ ready: boolean; states: number[]; muted: boolean; id: string | null }>((resolve) => {
        const states: number[] = [];
        const w = window as unknown as {
          YT: { Player: new (el: Element, o: unknown) => { mute(): void; playVideo(): void; youtubeId: string | null } };
        };
        const player = new w.YT.Player(document.getElementById("v") as Element, {
          events: {
            onReady: () => {
              player.mute();
              player.playVideo();
              resolve({ ready: true, states, muted: true, id: player.youtubeId });
            },
            onStateChange: (e: { data: number }) => states.push(e.data),
          },
        });
      }),
  );

  expect(result).toEqual({ ready: true, states: [1], muted: true, id: "abc123" });
  expect(blockedRequests).toEqual([]);
});

test("network guard › IFrame Player API › gives each fake player its own creation serial", async ({ page }) => {
  await page.setContent(
    `<iframe id="a" src="https://www.youtube-nocookie.com/embed/aaa?enablejsapi=1"></iframe>
     <iframe id="b" src="https://www.youtube-nocookie.com/embed/bbb?enablejsapi=1"></iframe>
     <script src="https://www.youtube.com/iframe_api"></script>`,
  );
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { YT?: { Player?: unknown } }).YT?.Player)).toBe("function");

  await page.evaluate(() => {
    const w = window as unknown as { YT: { Player: new (el: Element, o: unknown) => unknown } };
    new w.YT.Player(document.getElementById("a") as Element, {});
    new w.YT.Player(document.getElementById("b") as Element, {});
  });

  const first = await livePlayers(page);
  expect(first.map((p) => [p.youtubeId, p.serial])).toEqual([["aaa", 0], ["bbb", 1]]);
  // Reading again returns the same serials: a player keeps its serial for its whole life.
  expect((await livePlayers(page)).map((p) => p.serial)).toEqual([0, 1]);
});

test("network guard › IFrame Player API › a player reports an error the test emits", async ({ page }) => {
  await page.setContent(
    `<iframe id="a" src="https://www.youtube-nocookie.com/embed/aaa?enablejsapi=1"></iframe>
     <script src="https://www.youtube.com/iframe_api"></script>`,
  );
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { YT?: { Player?: unknown } }).YT?.Player)).toBe("function");
  await page.evaluate(() => {
    const w = window as unknown as { YT: { Player: new (el: Element, o: unknown) => unknown }; __errors: number[] };
    w.__errors = [];
    new w.YT.Player(document.getElementById("a") as Element, {
      events: { onError: (e: { data: number }) => w.__errors.push(e.data) },
    });
  });

  await emitError(page, "aaa", 100);

  expect(await page.evaluate(() => (window as unknown as { __errors: number[] }).__errors)).toEqual([100]);
});

test("network guard › IFrame Player API › a video set to fail reports its error once created", async ({ page }) => {
  await failVideos(page, { aaa: 150 });
  await page.goto("about:blank"); // an init script runs when a document loads
  await page.setContent(
    `<iframe id="a" src="https://www.youtube-nocookie.com/embed/aaa?enablejsapi=1"></iframe>
     <iframe id="b" src="https://www.youtube-nocookie.com/embed/bbb?enablejsapi=1"></iframe>
     <script src="https://www.youtube.com/iframe_api"></script>`,
  );
  await expect.poll(() => page.evaluate(() => typeof (window as unknown as { YT?: { Player?: unknown } }).YT?.Player)).toBe("function");
  await page.evaluate(() => {
    const w = window as unknown as { YT: { Player: new (el: Element, o: unknown) => unknown }; __log: string[] };
    w.__log = [];
    for (const id of ["a", "b"]) {
      new w.YT.Player(document.getElementById(id) as Element, {
        events: {
          onReady: () => w.__log.push(`${id}:ready`),
          onError: (e: { data: number }) => w.__log.push(`${id}:error${e.data}`),
        },
      });
    }
  });

  await expect.poll(() => page.evaluate(() => (window as unknown as { __log: string[] }).__log.length)).toBe(2);
  expect(await page.evaluate(() => (window as unknown as { __log: string[] }).__log.sort())).toEqual(["a:error150", "b:ready"]);
});
