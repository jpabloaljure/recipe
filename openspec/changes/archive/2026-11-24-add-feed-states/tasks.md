# Tasks

Scenario names below are the exact ones in `specs/feed/spec.md` and
`specs/playback/spec.md`; E2E tests are named
`<capability> › <Requirement> › <Scenario>` and live in `e2e/<capability>/`
(E2E rules 2 and 4). Scenarios that are timing or logic rules are Vitest tests
with injected timers (E2E rule 1); each task says which.

## 1. Player error event

- [x] 1.1 In `src/lib/player/youtube-player.ts` and `types.ts` pass `onError(code)` to the YouTube API and report 100, 101 and 150 as one "cannot play" signal, ignoring every other code (design Decision 5); verify with tests in `youtube-player.test.ts` for "The player reports videos that cannot play › Removed video", "› Embedding not allowed" and "› Another error code"
- [x] 1.2 In `src/app/feed/SlideVideo.tsx` forward the signal with the video's ID to the feed; verify `pnpm typecheck` passes
- [x] 1.3 In `e2e/support/youtube-fake.ts` add `emitError(code)` per player and a helper in `e2e/support/player.ts`; verify with a test in `e2e/support/support.spec.ts` that the error reaches the app's handler

## 2. Feed state rules (Vitest, no browser)

- [x] 2.1 In `src/lib/feed/feed-state.ts` add `status`, `skipped` and `skipsInARow` and the pure transitions of design Decision 1 (page arrives, first page fails, empty page, video skipped, video plays, Retry); verify with tests in `feed-state.test.ts` for each transition
- [x] 2.2 Add tests for "A video that cannot play is skipped" (a skipped ID leaves every repeat of the list and is ignored by later pages), "Repeated skips end in the error message › Three in a row" and "› None left" (including the counter reset when a video plays and "every loaded video failed but a next page exists requests that page"), and "› Retry after skipped videos" (forgets the skipped IDs and requests the first page); verify `pnpm test` passes
- [x] 2.3 Add tests for the end slide rules: it exists only while `!catalogEnded`, stays after the last remaining slide when a video is dropped next to it, and a swipe past it leaves it active ("An end slide while more pages remain › Swipe past the end slide", logic part); verify `pnpm test` passes

## 3. Timeout (Vitest, no browser)

- [x] 3.1 In `src/lib/feed/http-source.ts` take injected timers and abort the `fetch` after 10 seconds, so a late answer counts as a failure for the first page and for next pages (design Decision 3); verify with tests for "The first page shows its state › First page does not answer" and "An end slide while more pages remain › Next page did not answer" using fake timers (no real waiting)
- [x] 3.2 Add a test that a Retry is ignored while its request runs ("The first page shows its state › Retry is ignored while a request runs", logic part); verify with the E2E double-click test of 4.3 (the Vitest part does not apply: the guard is the Retry handler's status check, which is not a pure function, and `PageRequests` already refuses a cursor that is in flight)

## 4. Status view and first-page states

- [x] 4.1 In `src/app/feed/Feed.tsx` and `Feed.module.css` render the centered status view for loading, "No recipes yet" and "Oops, something went wrong" with Retry, and no slides while it shows (design Decision 2); verify `pnpm typecheck` passes
- [x] 4.2 In `e2e/support/feed.ts` extend `stubFeed` with options for an empty catalog, a 5xx answer, a request held until released, and an offline abort; verify with a test in `e2e/support/support.spec.ts`
- [x] 4.3 Add E2E tests in `e2e/feed/the-first-page-shows-its-state.spec.ts` for "First page is loading", "Empty catalog", "First page request fails", "Offline", "Retry the first page" and "Retry is ignored while a request runs"; verify they pass on the three projects with `pnpm test:e2e` ("First page does not answer" is the Vitest test of 3.1: a 10-second wait is not an E2E test)

## 5. End slide

- [x] 5.1 Render the end slide with the loading indicator or the retry row while `!catalogEnded`, ignoring swipes past it (design Decisions 2 and 4); verify `pnpm typecheck` passes
- [x] 5.2 Add E2E tests in `e2e/feed/an-end-slide-while-more-pages-remain.spec.ts` for "Next page is loading at the end", "Next page failed at the end", "Retry the next page" and "Swipe past the end slide"; verify they pass on the three projects ("Next page did not answer" is the Vitest test of 3.1)
- [x] 5.3 Update the E2E tests for "Wrap to the start after the last video" and "Next page loads ahead" if the end slide changes what they see; verify the existing `e2e/feed/` tests still pass

## 6. Skipping a video

- [x] 6.1 In `Feed.tsx` drop a video the player reported, by ID, from every cycle, and show the status view after 3 in a row or none left (design Decisions 1 and 5); verify `pnpm typecheck` passes
- [x] 6.2 Keep the watched video on screen: find the new index of the active key and update the active index at once, and set `overflow-anchor: none` on the feed (design Decision 6; Chromium's scroll-snap keeps the snapped slide, so no `scrollTop` assignment is needed); verify with the E2E test of 6.3 for "The watched video stays on screen when others are dropped"
- [x] 6.3 Add E2E tests in `e2e/feed/a-video-that-cannot-play-is-skipped.spec.ts` for "The active video cannot play" and "The next video cannot play", in `e2e/feed/the-watched-video-stays-on-screen-when-others-are-dropped.spec.ts` for "An earlier video is removed" (in the second cycle), and in `e2e/feed/repeated-skips-end-in-the-error-message.spec.ts` for "Three in a row", "None left" and "Retry after skipped videos"; verify they pass on the three projects
- [x] 6.4 Add the E2E tests in `e2e/feed/no-autoscroll.spec.ts` for "No autoscroll › Active video cannot play" and "› Video ends with no interaction" (which had no feed test of its own); verify they pass on the three projects
- [x] 6.5 Verify the existing `e2e/playback/` and `e2e/feed/` tests still pass with `pnpm test:e2e`

## 7. Manual checks (human)

- [x] 7.1 "A removed video on real YouTube (manual)": on desktop Chrome and a real Android phone, serve a local feed page that lists a removed video, a private video, a video with embedding off and good videos; swipe through and confirm each broken one is skipped, the next one takes its place, and which error code each reports; record the IDs used and the codes in the PR (the human supplies the broken IDs) (checked by the owner on 2026-11-24 on the production site: all five checks reported OK, covering the broken videos skipped, the device, the neighbour, the 10-second value and the embedding-off case; no video IDs, error codes or timings were recorded, and the owner's removed-video test changed one character of a real ID)
- [x] 7.2 "Neighbour error on load (manual)": with the same page, confirm a broken neighbour is dropped before it is reached; if it only reports once played, record it in the PR and revise the neighbour scenario and design Decision 5 (checked on 2026-11-24, see 7.1)
- [x] 7.3 Check the 10-second value on a throttled phone connection and record whether it feels right; change it in `http-source.ts` only if the human asks (checked on 2026-11-24, see 7.1; the value stays 10 seconds)

## 8. Docs

- [x] 8.1 Update the REC-018 status and the README features or checklist lines that list the feed states, if any; run the `doc-checker` agent on the changed files and fix or explain each problem and unsure item it reports (done: REC-018 `done`, `docs/checklist.md` rows 9, 13 and 21 and the outside-the-checklist line; the README lists no feed states; `doc-checker` run on the changed files)

## Workflow follow-up

- Archive the change in a docs PR after the production smoke check, set REC-018 to `done` when it meets the Definition of Done, and log the manual check results in the PR.
