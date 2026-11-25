# Tasks

Scenario names below are the exact ones in `specs/recipe-panel/spec.md`; E2E
tests are named `recipe-panel › <Requirement> › <Scenario>` and live in
`e2e/recipe-panel/` (E2E rules 2 and 4). The `feed` amendments add no scenario,
so the existing `feed` E2E tests cover them and must still pass.

## 1. Shared pieces

- [ ] 1.1 Extract `RecipeContent` (servings, ingredients, steps, source label and link) from `src/app/feed/RecipePanel.tsx` into its own component and use it from the panel; verify the existing `e2e/recipe-panel/` tests still pass with `pnpm test:e2e`
- [ ] 1.2 Add `src/app/feed/panel-room.ts` with the exported `PANEL_MEDIA_QUERY` constant and a hook that reports changes of `window.matchMedia(PANEL_MEDIA_QUERY)`; add a Vitest test that the constant equals the query written in `RecipePanel.module.css`; verify `pnpm test` passes

## 2. Sheet state, button and sheet

- [ ] 2.1 In `Feed.tsx` add `sheetOpen` with `openSheet` and `closeSheet`, closed when `activeKey` changes and when the panel's query changes (design Decisions 3 and 4); verify `pnpm typecheck` passes
- [ ] 2.2 Add the "Recipe" button in the active slide's frame (design Decision 7): above the unmute button's place, shown only where `(max-aspect-ratio: 3/4) and not (min-width: calc(56.25vh + 520px))`, for a video with a recipe and a closed sheet, `aria-label="Recipe"`; verify the E2E tests for "Tap the Recipe button", "The button's place with sound on", "The button's name", "The button while the sheet is open" and "A title-only video on a screen without room" pass
- [ ] 2.3 Add `RecipeSheet` next to `.feed` (design Decisions 1, 2, 5 and 6): fixed over the video's column between `--sheet-top` and `--sheet-bottom`, semi-transparent black, `RecipeContent`, close button with `aria-label="Close recipe"`, `overscroll-behavior: contain`, `z-index` below the unmute button, `display: none` where the panel is shown; verify the E2E tests of group 3 pass

## 3. E2E tests

- [ ] 3.1 Add `e2e/recipe-panel/the-recipe-button-opens-the-sheet-where-the-unmute-button-is-over-the-video.spec.ts` for "Tap the Recipe button" (no extra request), "The button's place with sound on" (the button's box is the same before and after sound is turned on, and sits above the unmute button's place), "The button's name", "The button while the sheet is open" and "A title-only video on a screen without room"; "The button's place with sound off" is a manual check (task 5.2); verify they pass on `phone-portrait`
- [ ] 3.2 Add `the-sheet-shows-the-recipe.spec.ts` for "The sheet shows the recipe's content", "The sheet names the source", "A missing serving size or quantity in the sheet" and "Open the sheet again" (scrolled to the top after scrolling and closing); verify they pass
- [ ] 3.3 Add `the-sheet-covers-only-the-video-and-leaves-the-players-controls-free.spec.ts` for "A translucent sheet" (the background colour has an alpha between 0 and 1), "The sheet covers only the video's area" (the sheet's box is inside the video frame's box) and "Tap the unmute button with the sheet open" (the click reaches the button, sound turns on, the sheet stays open); "The player's control zones stay free (manual)" and "A tap on a player control with the sheet open (manual)" are manual checks (task 5.3); verify they pass
- [ ] 3.4 Add `the-sheet-closes-with-its-button-and-when-the-video-changes.spec.ts` for "Close the sheet", "The close button's name", "The video keeps playing" (the player's state stays `playing`) and "Another video becomes active with the sheet open"; verify they pass
- [ ] 3.5 Add `scrolling-on-the-sheet-never-moves-the-feed.spec.ts` for "A recipe taller than the sheet" and "A recipe shorter than the sheet", with touch swipes that start on the sheet (`swipeNext` with the sheet as target); verify they pass
- [ ] 3.6 Add `a-turn-or-resize-across-the-panels-switch-swaps-the-sheet-and-the-panel.spec.ts` for "Turn a phone from landscape to portrait", "Turn a phone with the button from portrait to landscape" and "Turn a phone with the sheet open from portrait to landscape", with `page.setViewportSize` between 915x412 and 412x915, checking that the active video's player state and mute state do not change; verify they pass

## 4. Documentation

- [ ] 4.1 Update `docs/architecture/c4/03-components-web-app.md`: the "Recipe panel" component's description and Notes mention the sheet and the "Recipe" button (REC-022); verify the Mermaid diagram still renders and run the `doc-checker` on the file

## 5. Manual checks (human, on real devices; E2E rule 13)

- [ ] 5.1 On a real phone in portrait (the Honor), open the preview, tap "Recipe", and swipe on the sheet with a short and a long recipe: only the recipe scrolls and the video never changes; then turn the phone to landscape and back with the sheet open and closed: the panel and the button swap and playback and sound do not change. If a swipe moves the feed, stop and ask for a design change
- [ ] 5.2 "The button's place with sound off (manual)": the "Recipe" button sits above the unmute button, which sits above the player's control bar, on that phone and on desktop Chrome with a 412x915 and a 600x800 phone simulation; tune the button's offset in design Decision 7 and write the result in this task
- [ ] 5.3 "The player's control zones stay free" and "A tap on a player control with the sheet open": with the sheet open, the YouTube controls at the top and the bottom receive taps, and a swipe that starts in a free zone moves the feed and closes the sheet; tune `--sheet-top` and `--sheet-bottom` (design Decision 2) and write the values in this task

## 6. Close-out

- [ ] 6.1 Set REC-022 `Status: done` when every automatable scenario has a passing E2E test and the manual results are on record; sync the deltas into `openspec/specs/` (the `recipe-panel` requirements and the two `feed` requirements) and archive the change
