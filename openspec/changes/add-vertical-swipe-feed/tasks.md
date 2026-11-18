# Tasks

## 1. Start

- [ ] 1.1 Set REC-001 to `**Status:** in-progress` in `backlog/E01-browse-feed.md` with the Edit tool (so `.claude/hooks/validate-ac.sh` runs); verify the hook accepts the edit and the story's Flags are still `—`

## 2. Feed types and stub source

- [ ] 2.1 Add `src/lib/feed/types.ts`: feed item (`youtubeId`, `title`; no `id`, per the REC-021 API specification), page (`items`, `nextCursor: string | null`, `null` = end of catalog) and the `FeedSource` interface (`getPage(cursor)` returning a promise of a page); verify `pnpm typecheck` passes
- [ ] 2.2 Pick about 7 real, public, embeddable English cooking Shorts and put their IDs and titles in a fixture in `src/lib/feed/stub-source.ts` (no invented IDs); verify each ID plays at `https://www.youtube-nocookie.com/embed/<id>` in the browser
- [ ] 2.3 Implement the stub `FeedSource` over the fixture with page size 3 (async, cursor = next offset as a string, `nextCursor: null` on the last page) and add `stub-source.test.ts`; verify `pnpm test` covers: first page, middle page, last page returns `nextCursor: null`, and the pages together return every fixture item once, in order

## 3. Feed order and wrap-around logic

- [ ] 3.1 Add pure functions in `src/lib/feed/` (design Decisions 2–4): append a page to the visit order and set `catalogEnded`; build the slide list (visit order plus appended cycles, key `<cycle>-<videoId>`); decide whether to load the next page (active within two slides of the last loaded, catalog not ended); decide whether to append a cycle (catalog ended, active within two slides of the end); active index from `scrollTop` and slide height; whether a slide index is in the active ±1 iframe window
- [ ] 3.2 Add `*.test.ts` for 3.1; verify `pnpm test` passes and covers: the slide after the last catalog video is the first video of the visit order; the wrap works when the catalog spans three pages; the slide after the wrap is the second video; nothing exists before the first slide (no backward wrap); no next-page load after the catalog ended; keys stay unique across cycles; active index rounds to the nearest slide; the window is active −1 to active +1, clamped at 0

## 4. Feed component

- [ ] 4.1 Add the client component `src/app/feed/Feed.tsx` and `Feed.module.css`: scroll container (`100dvh`, `overflow-y: scroll`, `scroll-snap-type: y mandatory`, `overscroll-behavior-y: contain`), `100dvh` slides with `scroll-snap-align: start` and `scroll-snap-stop: always`, safe-area padding, centered `aspect-ratio: 9 / 16` frame with `max-width: 100%`, no element layered over the iframe; verify `pnpm typecheck` passes
- [ ] 4.2 Wire the logic from group 3: load the first stub page on mount, update the active index on `scrollend`, load the next page and append cycles when the 3.1 functions say so, and render the plain embed (`youtube-nocookie.com/embed/<id>?playsinline=1&rel=0`, no autoplay or loop) only for slides in the ±1 window; verify in `pnpm dev` that scrolling from the first to the eighth slide shows videos 1–7 then video 1 again, and that the DOM never holds more than three iframes
- [ ] 4.3 Replace the placeholder in `src/app/page.tsx` with `<Feed />` and remove the unused placeholder styles from `page.module.css` (delete the file if nothing uses it); verify `pnpm typecheck`, `pnpm test` and `pnpm build` pass
- [ ] 4.4 Update the C4 level 3 web-app diagram (`docs/architecture/c4/03-components-web-app.md`): Feed component description (CSS scroll-snap, one video per gesture, wrap-around; stub source until REC-002) and a note that Feed is built while the other components are still planned; keep `Status: Proposed`; verify the Mermaid block still renders

## 5. Checks on devices (spec: feed)

- [ ] 5.1 Desktop Chrome (`pnpm dev` or a Vercel preview): wheel and trackpad move one video per gesture, including over the video; the video is centered at full height; at the last video the next scroll shows the first video, with no visible jump or second snap; scroll back on the first video does nothing; a video left to end stays active; clicking the YouTube player's controls works and does not move the feed; verify each item and note the results in the PR description
- [ ] 5.2 Chrome on Android (human, Vercel preview): the same checks as 5.1 by swipe, plus portrait shows one full-screen video, landscape shows it centered, five hard flicks each move exactly one video (with three live iframes), and a backward swipe on the first video does not trigger pull-to-refresh; verify each item and note the results in the PR description
- [ ] 5.3 Set REC-001 to `**Status:** done` with the Edit tool once 5.1 and 5.2 pass; verify the hook accepts the edit

## Workflow follow-up

- Archive this change after review and merge (sync `specs/feed` into `openspec/specs/feed/`).
- REC-002 replaces the stub `FeedSource` with one that calls `GET /api/feed`, keeping the `nextCursor: null` end-of-catalog signal.
- REC-003 replaces the plain embed with the player controller (IFrame API, autoplay muted, unmute, loop, pause).
