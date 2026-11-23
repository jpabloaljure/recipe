import { test as base, expect } from "@playwright/test";
import { FAKE_IFRAME_API } from "./youtube-fake";

/**
 * Shared `test` for every E2E test (AGENTS.md E2E rule 5). Import `test` and
 * `expect` from here, never from "@playwright/test" directly.
 *
 * Its automatic network guard routes every request:
 * - the app's own origin passes through;
 * - YouTube embed hosts get a local stub page (`data-testid="youtube-stub"`),
 *   and `www.youtube.com/iframe_api` gets a fake player API (`youtube-fake.ts`);
 * - any other outside request is aborted, and the test fails at teardown,
 *   listing the URLs. A change that adds an outside request adds its stub here.
 */

const YOUTUBE_HOSTS = ["youtube.com", "youtube-nocookie.com", "ytimg.com", "googlevideo.com"];

const YOUTUBE_STUB_PAGE = `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>YouTube stub</title></head>
  <body data-testid="youtube-stub" style="margin:0;height:100vh;background:#222"></body>
</html>`;

function isYouTubeHost(hostname: string): boolean {
  return YOUTUBE_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

type Fixtures = {
  /** Outside requests the guard blocked in this test (normally empty). */
  blockedRequests: string[];
  networkGuard: void;
};

export const test = base.extend<Fixtures>({
  blockedRequests: async ({}, use) => {
    await use([]);
  },

  networkGuard: [
    async ({ context, baseURL, blockedRequests }, use) => {
      const ownOrigin = baseURL ? new URL(baseURL).origin : undefined;

      await context.route("**/*", async (route) => {
        const request = route.request();
        const url = new URL(request.url());

        if (url.protocol !== "http:" && url.protocol !== "https:") return route.continue();
        if (url.origin === ownOrigin) return route.continue();
        if (isYouTubeHost(url.hostname)) {
          // The IFrame Player API script is replaced by a fake the tests can drive (REC-003).
          if (url.hostname === "www.youtube.com" && url.pathname === "/iframe_api") {
            return route.fulfill({ status: 200, contentType: "text/javascript", body: FAKE_IFRAME_API });
          }
          if (request.resourceType() === "document") {
            return route.fulfill({ status: 200, contentType: "text/html", body: YOUTUBE_STUB_PAGE });
          }
          return route.fulfill({ status: 204 });
        }

        blockedRequests.push(url.href);
        return route.abort("blockedbyclient");
      });

      await use();

      expect(
        blockedRequests,
        "Outside requests are not allowed in E2E tests (AGENTS.md E2E rule 5); " +
          "stub them in e2e/support/test.ts",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
