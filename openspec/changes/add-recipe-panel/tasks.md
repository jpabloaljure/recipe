# Tasks

Scenario names below are the exact ones in `specs/recipe-panel/spec.md` and
`specs/feed/spec.md`; E2E tests are named `<capability> › <Requirement> ›
<Scenario>` and live in `e2e/recipe-panel/` and `e2e/feed/` (E2E rules 2 and 4).

## 1. Test data and text rules

- [ ] 1.1 Add a recipe stub to the E2E feed helper (`e2e/support/feed.ts`, next to `videos()`): `videosWithRecipes(count)` with servings, ingredients, steps and a source, and variants for a missing serving size or quantity, a long recipe and a short one; verify the existing `e2e/feed/` tests still pass with `pnpm test:e2e`
- [ ] 1.2 Add `src/lib/feed/recipe-text.ts` (ingredient line without a missing quantity or unit, servings left out when `null`, the source label wording, the YouTube link) with Vitest tests in `recipe-text.test.ts`; verify `pnpm test` passes

## 2. The panel

- [ ] 2.1 Add `src/app/feed/RecipePanel.tsx` and its CSS module: an `<aside>` named "Recipe" with servings, an `ol` of steps, a `ul` of ingredients, the source label and the link (`target="_blank"`, `rel="noopener noreferrer"`), `overflow-y: auto` and `overscroll-behavior: contain`; verify `pnpm typecheck` passes
- [ ] 2.2 Add the media query `(min-width: calc(56.25vh + 520px))` (design Decision 2) that shows the panel in the left gutter (`position: fixed`, left offset with `env(safe-area-inset-left)`, width and maximum from Decision 3) and hides it below; verify with a throwaway check on 1280x800, 970x800 and 960x800 that the panel shows only on the first two
- [ ] 2.3 Render the panel from `Feed.tsx`, next to `.feed`, with `slides[activeIndex]` (recipe and YouTube ID), keyed by the ID so the scroll resets, and hidden for a title-only video; verify the E2E tests of group 3 for "The panel is open beside the video when there is room", "The recipe is shown" and "A title-only video" pass on the three projects

## 3. E2E tests

- [ ] 3.1 Add `e2e/recipe-panel/the-panel-is-open-beside-the-video-when-there-is-room.spec.ts` for the scenarios "Desktop window", "Phone in landscape with room", "Exactly 260 px of room" (970x800), "255 px of room" (960x800) and "Widen a window" (starts at 960x800 and widens to 970x800, with the video's state unchanged); verify they pass with `onlyOn` where a scenario applies to one project
- [ ] 3.2 Add `e2e/recipe-panel/the-panel-does-not-cover-the-video-or-the-unmute-button.spec.ts` for "The video stays centered" (the video's bounding box is centered and does not intersect the panel's) and "The unmute button stays visible" (visible, to the right of the video, not overlapping the panel); verify they pass
- [ ] 3.3 Add `e2e/recipe-panel/the-panel-shows-the-recipes-content.spec.ts` for "The recipe is shown", "No extra request" (no request after the video becomes active) and "A missing serving size or quantity"; add `the-panel-names-the-recipes-source.spec.ts` for "The source label" and "The source link" (a popup opens to the video's URL); verify they pass
- [ ] 3.4 Add `e2e/recipe-panel/the-panel-follows-the-active-video.spec.ts` for "Another video becomes active" (the old panel was scrolled; after a swipe the new recipe is shown at the top at the moment `data-active` moves) and "A title-only video" (empty panel area, video centered); verify they pass
- [ ] 3.5 Add `e2e/recipe-panel/scrolling-over-the-panel-never-moves-the-feed.spec.ts` for "A recipe taller than the panel" (mouse wheel over the panel; the feed's scroll position and the active video do not change; the last step is reachable) and "A recipe shorter than the panel"; verify they pass on the `desktop` and `phone-landscape` projects
- [ ] 3.6 Add the `feed` scenarios: `e2e/feed/one-video-per-gesture.spec.ts` gets "Swipe beside the video with the panel open" (a swipe or wheel over the gutter the panel does not cover moves the feed by one video), and `e2e/feed/centered-video-on-wide-screens.spec.ts` gets "With the recipe panel"; verify the existing scenarios of both files still pass

## 4. Documentation

- [ ] 4.1 Update `docs/architecture/c4/03-components-web-app.md`: the "Recipe panel" component's description (always open beside the video where there is room, a sheet where not is REC-022, auto-open is REC-007) and its Notes; verify the Mermaid diagram still renders and run the `doc-checker` on the file

## 5. Manual checks (human, on real devices; E2E rule 13)

- [ ] 5.1 "A swipe that starts on the panel on a phone (manual)": on a real phone in landscape with room (for example 915x412), open the preview or production feed and swipe vertically starting on the panel, with a short and a long recipe; the video must not change. If it does, stop and ask for a design change
- [ ] 5.2 On desktop Chrome, check the panel at exactly 970x800 (244 px wide) and 1280x800 for readability, margins and the 400 px maximum, with the placeholder recipes of production (their label is wrong until draft D-22), and a mouse wheel and trackpad over the panel; tune the values in design Decision 3 and write the result in this task
- [ ] 5.3 On the same phone and on a small phone in landscape (about 667x375, no panel), check that the layout is the one the media query predicts and that a mobile browser bar changing the height near the threshold does not leave the screen without a video; record the result (the band is REC-023's)

## 6. Close-out

- [ ] 6.1 Set REC-006 `Status: done` when every automatable scenario has a passing E2E test and the manual results are on record; sync the deltas into `openspec/specs/` (the new `recipe-panel` capability and the two `feed` requirements) and archive the change
