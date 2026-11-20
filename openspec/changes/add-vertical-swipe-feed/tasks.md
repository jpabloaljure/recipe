# Tasks

## 1. Start

- [x] 1.1 Set REC-001 to `**Status:** in-progress` in `backlog/E01-browse-feed.md` with the Edit tool (so `.claude/hooks/validate-ac.sh` runs); verify the hook accepts the edit and the story's Flags are still `—`

## 2. Contract types, fixture and the stub feed route

- [x] 2.1 Add `src/lib/feed/types.ts` with the contract's response types (design Decision 4): `FeedItem` (`youtubeId`, `title`, `channelName: string | null`, `recipe: Recipe | null`; no `id`), `Recipe`, `Ingredient`, `FeedPage` (`items`, `nextCursor: string | null`), `ApiError` and the `FeedSource` interface; verify `pnpm typecheck` passes and each field matches `docs/api/openapi.yaml` by reading them side by side
- [x] 2.2 Pick about 7 real, public, embeddable English cooking Shorts and put their IDs, titles and real channel names, with `recipe: null`, in `src/lib/feed/fixture.ts` (no invented IDs or recipes); verify each ID plays at `https://www.youtube-nocookie.com/embed/<id>` in the browser
- [x] 2.3 Add the paging function and cursor encoding in `src/lib/feed/fixture-pages.ts` (3 items per page, cursor = next offset as base64url JSON) with `fixture-pages.test.ts`; verify `pnpm test` covers: first page with a cursor, a valid cursor returning the next page, the last page returning `nextCursor: null`, every fixture item returned once in order across pages, and an undecodable cursor (including the empty string) reported as invalid
- [x] 2.4 Add the route `src/app/api/feed/route.ts` (`GET`, design Decision 4) with `route.test.ts` calling it with a `Request`; verify `pnpm test` covers: 200 with `Cache-Control: public, s-maxage=3600` and the page body, and 400 with `{ "error": { "code": "invalid_cursor", "message" } }` and `Cache-Control: no-store`. The expected values are written into the test by hand and checked against `openapi.yaml` in review
- [x] 2.5 Add the client `src/lib/feed/http-source.ts` (`FeedSource` that fetches `/api/feed`, with `?cursor=` after the first page, and throws on a non-2xx response) with `http-source.test.ts` using a stubbed `fetch`; verify `pnpm test` covers: first request has no cursor, next request passes the cursor unchanged, a 400 response throws

## 3. Feed order, wrap-around and next-page logic

- [x] 3.1 Add pure functions in `src/lib/feed/` (design Decisions 2–4):
  - append a page to the visit order and set `catalogEnded` when `nextCursor` is `null`;
  - build the slide list: the visit order plus appended cycles, with key `<cycle>-<youtubeId>`;
  - decide whether to request the next page: active within two slides of the last loaded slide, and catalog not ended;
  - decide whether to append a cycle: catalog ended, and active within two slides of the end;
  - the active index from `scrollTop` and slide height;
  - whether a slide index is in the active ±1 iframe window.
- [x] 3.2 Add `*.test.ts` for 3.1; verify `pnpm test` passes and covers:
  - the slide after the last catalog video is the first video of the visit order;
  - the wrap works when the catalog spans three pages;
  - the slide after the wrap is the second video;
  - a one-video catalog wraps to the same video;
  - nothing exists before the first slide (no backward wrap);
  - the next page is requested within two slides of the last loaded slide, and not after the catalog ended;
  - keys stay unique across cycles;
  - the active index rounds to the nearest slide;
  - the window is active −1 to active +1, clamped at 0.

## 4. Feed component and docs

- [x] 4.1 Add the client component `src/app/feed/Feed.tsx` and `Feed.module.css` (design Decisions 1, 5 and 6):
  - scroll container: `100dvh`, `overflow-y: scroll`, `scroll-snap-type: y mandatory`, `overscroll-behavior-y: contain`;
  - slides: `100dvh`, `scroll-snap-align: start`, `scroll-snap-stop: always`, safe-area padding;
  - a centered `aspect-ratio: 9 / 16` frame with `max-width: 100%`;
  - no element layered over the iframe;
  - each slide has `data-testid="feed-slide"`, `data-youtube-id`, and `data-active="true"` on the active one.

  Verify `pnpm typecheck` passes.
- [x] 4.2 Wire the logic from group 3 with the HTTP source from 2.5:
  - load the first page on mount;
  - update the active index on `scrollend`;
  - request the next page and append cycles when the 3.1 functions say so;
  - render the plain embed (`youtube-nocookie.com/embed/<id>?playsinline=1&rel=0`, no autoplay or loop) only for slides in the ±1 window.

  Verify in `pnpm dev` that scrolling from the first slide past the last fixture video shows the fixture videos, then video 1 again, that the network panel shows `/api/feed?cursor=…` requests, and that the DOM never holds more than three iframes.
- [x] 4.3 Replace the placeholder in `src/app/page.tsx` with `<Feed />` and remove the unused placeholder styles from `page.module.css` (delete the file if nothing uses it); verify `pnpm typecheck`, `pnpm test` and `pnpm build` pass, and that the `@smoke` test still passes against the build
- [ ] 4.4 Update the C4 level 3 web-app diagram (`docs/architecture/c4/03-components-web-app.md`):
  - Feed: CSS scroll-snap, one video per gesture, wrap-around, next page via `/api/feed`;
  - Feed route: fixture data until REC-002, with its database read starting in REC-002;
  - a note that Feed and the Feed route are built while the other components are still planned.

  Keep `Status: Proposed`; verify the Mermaid block still renders
- [x] 4.5 In `docs/api/openapi.yaml`, change the `info.description` implementers to REC-001 (the client and the stub feed route), REC-002 (the data) and REC-014 (the deep link); verify a one-off `npx @redocly/cli lint docs/api/openapi.yaml` still reports the file valid (ask the human before running it, as in REC-021)

## 5. End-to-end tests (spec: feed)

- [x] 5.1 Add `e2e/support/feed.ts` (design Decision 8): `stubFeed(page, pages)` answering `/api/feed` from pages built with the shared types, `activeSlide(page)`, and `scrollToSlide(page, index)` that waits for `scrollend`; verify with a test in `e2e/support/support.spec.ts` that a stubbed page renders its slides
- [x] 5.2 `e2e/feed/one-full-screen-video-at-a-time.spec.ts`: `feed › One full-screen video at a time › Feed loads on a phone in portrait` (`onlyOn("phone-portrait")`); verify `pnpm test:e2e` passes
- [x] 5.3 `e2e/feed/one-video-per-gesture.spec.ts`, all projects:
  - Swipe to the next video;
  - Swipe to the previous video;
  - Hard flick (`strength: "hard"`; real flick physics stay manual in 6.2);
  - Swipe that starts on the video (target: the iframe frame).

  Verify `pnpm test:e2e` passes on all three projects
- [x] 5.4 `e2e/feed/centered-video-on-wide-screens.spec.ts`: Desktop (`onlyOn("desktop")`) and Phone in landscape (`onlyOn("phone-landscape")`), checking that the frame is full height and horizontally centered; verify `pnpm test:e2e` passes
- [x] 5.5 `e2e/feed/wrap-to-the-start-after-the-last-video.spec.ts`, all projects:
  - Swipe past the last video: a one-page catalog;
  - Catalog spans several pages: a three-page catalog;
  - Keep swiping after the wrap.

  Each scrolls by code to its starting slide. Verify `pnpm test:e2e` passes
- [x] 5.6 `e2e/feed/no-backward-wrap-on-the-first-video.spec.ts`: Swipe back on the first video, all projects; verify `pnpm test:e2e` passes
- [x] 5.7 `e2e/feed/next-page-loads-ahead.spec.ts`: Approach the last loaded video, all projects, waiting for a request to `/api/feed?cursor=`; verify `pnpm test:e2e` passes
- [x] 5.8 Record these scenarios as manual in the PR description, with the reason (E2E rule 13):
  - Tap on the video: the YouTube player's own behavior, stubbed in E2E;
  - Video ends with no interaction: needs a playing real player;
  - Chrome on Android: real device.

  Verify each one appears in 6.1 or 6.2

## 6. Manual checks on devices

- [ ] 6.1 Desktop Chrome (`pnpm dev` or a Vercel preview), checking each item and noting the results in the PR description:
  - real wheel and trackpad move one video per gesture, including over the video;
  - the video is centered at full height;
  - at the last video the next scroll shows the first video, with no visible jump or second snap;
  - a video played to the end stays active;
  - clicking the YouTube player's controls works and does not move the feed.
- [ ] 6.2 Chrome on Android (human, Vercel preview), checking each item and noting the results in the PR description:
  - the same checks as 6.1, by swipe;
  - portrait shows one full-screen video, and landscape shows it centered;
  - five hard flicks each move exactly one video, with three live iframes;
  - a backward swipe on the first video does not trigger pull-to-refresh.
- [ ] 6.3 Set REC-001 to `**Status:** done` with the Edit tool once every E2E test in group 5 passes in CI and 6.1 and 6.2 pass (Definition of Done); verify the hook accepts the edit

## Workflow follow-up

- Archive this change after review and merge (sync `specs/feed` into `openspec/specs/feed/`).
- REC-002 replaces the fixture inside `/api/feed` with the database query, cache headers by response type and shuffle, adds the empty-feed and 5xx responses, and keeps `@smoke` green in CI; the client and the E2E tests stay as they are.
- REC-003 replaces the plain embed with the player controller (IFrame API, autoplay muted, unmute, loop, pause).
