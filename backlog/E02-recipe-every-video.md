---
id: E02
title: A written recipe for every video that has one
prd-goal: G2
---

## REC-006 · Recipe panel with servings, ingredients and steps
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:M, layer:frontend
- **PRD:** 5.1, 5.3, PERF-4, API-1
- **Flags:** —
- **AI estimate:** 5
- **Estimate:** 5

As a home cook, I want to open a written recipe next to the video, so that I can cook without pausing and rewinding.

### Acceptance criteria
- Given there is room for the panel beside the video (at least 260 px on each side) and the active video has a recipe, when the video becomes active, then the recipe panel is open to the left of the centered video.
- Given the room beside the video is exactly 260 px on each side and the active video has a recipe, when the video becomes active, then the recipe panel is open to the left of the video.
- Given the recipe panel is open, when the video becomes active, then the video stays exactly centered and the panel does not cover it.
- Given sound is off and the recipe panel is open, when the video becomes active, then the unmute button is visible to the right of the video and the panel does not overlap it.
- Given the screen has room for the panel and the active video has a recipe, when the video becomes active, then there is no "Recipe" button and no close button.
- Given the screen has room for the panel and the active video has a recipe, when the video becomes active, then its recipe is shown with no extra network request (PERF-4).
- Given the screen has room for the panel and the active video has a recipe, when the video becomes active, then the panel shows servings, ingredients with their quantities and numbered steps.
- Given the screen has room for the panel and the active video has a recipe, when the video becomes active, then a label shows the source (description, comment or captions).
- Given the recipe panel shows a recipe, when I select the source link, then the original YouTube video opens in a new tab.
- Given the recipe panel is open to the left of the video, when the active video changes, then the panel shows the new video's recipe, scrolled to the top, at the moment the new video becomes active.
- Given the recipe panel is open to the left of the video and the recipe is taller than the panel, when I scroll over it with the wheel, trackpad or touch, then only the recipe scrolls, the feed does not move, and I can reach the last step.
- Given the recipe panel is open to the left of the video and the recipe is shorter than the panel, when I scroll over it with the wheel, trackpad or touch, then the feed does not move.
- Given the recipe panel is open on a phone in landscape, when I swipe vertically starting on the panel, then the active video does not change (manual check).
- Given the screen has room for the panel, when I swipe or scroll over the area beside the video that the panel does not cover, then the feed moves by one video.
- Given a window with no room for the panel, when I widen it until there is room for the panel, then the recipe panel opens to the left of the video, and playback and sound do not change.
- Given the screen has room for the panel and the active video's recipe has a missing serving size or quantity, when the video becomes active, then the missing item is left out with no empty label (confirmed 2026-11-24).
- Given the screen has room for the panel, when a `needs_recipe` video becomes active, then the panel area is empty and the video stays centered.

### Technical context
`needs_recipe` videos are in the feed with their title only (decided 2026-11-17, `backlog/README.md` Decided 4; PRD 5.3, PERF-4).

Decisions 2026-11-24 (validation, first check 16 findings, re-check N1 to N8, "All A"):
- **Split by behavior (N5 A):** this story keeps the panel and its wide-screen layout; the "Recipe" button and the sheet where there is no room for the panel moved to REC-022 (`split-from:REC-006`, `blocked-by:REC-006`). REC-006 does not need REC-022, so it has no `blocked-by`. REC-006 alone does not cover a phone in portrait, nor a narrow window with less than room for the panel (REC-023): until REC-022 and REC-023 ship, those screens have no recipe at all (accepted, 2026-11-25).
- **Layout by space, not device (revised 2026-11-25, see below):** with room for the panel (desktop, a larger phone in landscape) the recipe panel is always open beside the centered video, with no "Recipe" button and no close button, and it follows the active video. Any other screen is REC-022 (the sheet) or REC-023 (the band, where the unmute button is beside the video). The first version of this decision reused the unmute button's switch with no new threshold; the explore of 2026-11-25 reversed that part.
- **Scrolling:** scrolling over the panel never moves the feed, also when the recipe is short or at its end.
- **Label and link:** the link opens in a new tab and the app tab's video pauses by the hidden-tab rule (`playback` spec). Label wording: "Recipe from the description / top comment / captions" (confirmed 2026-11-24).
- **Missing fields:** a missing serving size or quantity is left out; long lists scroll (confirmed 2026-11-24).
- **Title-only videos:** the panel area is empty and the video stays centered (confirmed 2026-11-24). The app shows no title of its own: the embed's own overlay shows the title and channel (seen on the owner's real-device screenshots).
- **Playback:** the panel does not depend on playback state, and hiding the tab changes nothing in it. Opening or closing it never changes playback or sound, and a pause made with the player's own control stays.
- **Feed spec and PRD:** PRD 5.1 and 5.3 are updated (2026-11-24 and 2026-11-25). The panel and the sheet are requirements of a new `recipe-panel` capability; REC-006's change amends the `feed` requirements "One video per gesture" (the panel is an exception) and "Centered video on wide screens" (the panel beside it), and REC-022's amends "Taps reach the video player" (the Recipe button over the video, and the sheet), (REC-023 needs no amendment of its own). The `playback` spec does not change (third re-check F6 A).
- **Related, none blocking:** REC-002 and REC-021 (the `recipe` data shape), REC-007 (auto-open applies only where the sheet is used, because with room for the panel it is always open; `blocked-by:REC-022`), REC-014 (a deep link lands on a video with its recipe available), REC-012 (favorites). A `ready` video always has a complete recipe (EXT-5), so there is no error path here. Accessibility beyond the "Recipe" button's accessible name (REC-022) goes to the draft backlog.

Decisions 2026-11-25 (explore of REC-006 against the code, "All three", reopened for validation):
- **Room for the panel (reverses "no new threshold"):** the panel has its own switch: the room beside the video on each side must be at least 260 px `(assumed)`; the value is tuned in the manual check. The room per side is (screen width minus the video's width) divided by two, the video being as tall as the screen and 9/16 as wide. Examples: 1280x800 has 415 px, a phone at 915x412 has 342, 1024x768 has 296, 900x800 has 225 (no panel), 700x800 has 125 (no panel). Below 260 px the screen takes REC-022's path (the button and the sheet) or REC-023's (the band). The unmute button keeps its own switch (`playback` spec), so there is a band of screens where it sits beside the video but the recipe uses the button and the sheet (see REC-023).
- **Left gutter:** the panel sits to the left of the video, because the unmute button lives in the right gutter (about 125 px above the bottom).
- **One panel, outside the feed:** a single panel that is a sibling of the feed's scroll container, not one per slide, so a wheel or touch over it cannot move the feed's scroll-snap container; it changes its content when the active video changes. A swipe that starts on the panel's area does not move the feed (a manual check on a landscape phone).
- **Seeing it (updated 2026-11-25):** production has 21 placeholder recipes since the one-time load of 2026-11-25 (`scripts/db/curated-recipes.json`, `pnpm db:load-recipes`, `docs/development.md`), written from each video's title and stored with source `description`, so the label "Recipe from the description" is wrong for them until draft D-22 replaces them. The E2E tests use stubbed recipes (the `videos()` helper has `recipe: null`, so they need a recipe stub); the manual check uses the production feed, or a local database loaded with `pnpm db:load-curated` and `pnpm db:load-recipes`.

Decisions 2026-11-25 (re-check of the reopening, 15 findings, "all A"):
- **Boundary and resize (#1, #2 A):** the threshold is inclusive (260 px per side counts); E2E tests it with custom viewports, 260 px with the panel and 255 px without (the other side is REC-023). A window widened across the threshold shows the panel with no change to playback or sound; the narrower side (a window narrowed across it, and the 255 px case) is REC-023's, split out of REC-022 on 2026-11-25.
- **Layout (#3, #4 A):** the video stays centered and uncovered; the panel's width is the room beside the video minus a 16 px margin on each side `(assumed)`; the unmute button stays visible to the right of the video.
- **Gestures (#5, #6 A):** a wheel or swipe over the panel only scrolls the recipe (the swipe on a real landscape phone is a manual check, E2E rule 13). Over the rest of the screen, including the left gutter of a title-only video and the right gutter, a gesture moves the feed as today.
- **Content swap (#7 A):** the panel's content changes at the moment the new video becomes active (the same moment as `data-active`), scrolls to the top, and clears for a `needs_recipe` video.
- **Stale text (#8 A):** cleaned in this pass; the screens with room depend on the 260 px, not the device (second re-check N1 A: criterion 1 now gives the number and drops the device examples).
- **Spec deltas (#10 A):** REC-006's change amends the `feed` requirements "One video per gesture" (the panel is an exception) and "Centered video on wide screens" (the panel beside it); REC-022 amends "Taps reach the video player".
- **Related stories (#11, #12 A):** REC-007 and the PRD move to "where the sheet is used" (auto-open also covers a narrow window), and REC-022's wording follows "no room for the panel" (and the band is REC-023's); REC-007 is reopened for a short re-check.
- **Notes (#13, #14, #15 A):** the right gutter is reserved for the unmute button; the reversal of "no new threshold" is logged as Decided 6 in `backlog/README.md`; the panel's focus order and the source link's accessible name are added to draft D-21.

Decisions 2026-11-25 (second re-check, 9 findings, "all A"):
- **Width (N8 A):** the panel is at most 400 px wide `(assumed)`, so it stays readable on an ultra-wide window; a note, with no criterion. The PRD keeps "about 260 px" (N9 A): it is hedged, and the value is tuned in the manual check.
- **Third re-check (F3 to F11, "all A"):** small phones in landscape (about 667x375, 228 px per side) get the sheet, and the manual check includes such a phone and the panel's readability at exactly 260 px (244 px wide). A mobile browser bar changing the visible height near the threshold may flip panel and button; accepted for the MVP, no criterion. The switch is preferably a CSS rule, so there is no flash of the wrong layout on first paint (no criterion). The estimates of REC-006, REC-022 and REC-007 are kept, marked as predating the reopening, and re-run after each story's criteria are approved; the band case was split out of REC-022 as REC-023 on 2026-11-25. REC-003 (the `videoended` event) is done, and REC-007 needs REC-006's panel through `blocked-by:REC-022`.
- **Neighbour stories (N2 to N7 A):** REC-022 now uses "no room for the panel" in every criterion; the criteria for a window narrowed across the threshold, 255 px per side and the button's place in the band moved to REC-023 on 2026-11-25; REC-007's criteria use the same wording and have a resize criterion. The AI estimates of all three are re-run after each one's criteria are approved.

### Estimation notes
M: one component with the wide-screen layout. After the 2026-11-24 split the story is the panel, its content and the wide-screen behavior; the button and sheet used where there is no room for the panel are REC-022 (and REC-023 for the band). After the reopening of 2026-11-25 it has 17 criteria, its own 260 px switch, one panel outside the feed's scroll container, and stubbed recipes for the E2E tests; the AI estimate was re-run after the criteria were approved (5); the earlier team Estimate of 3 predates the reopening and is replaced by the team's new value when the story is validated.
Data already arrives with the feed, so no loading states are needed.

AI estimate (2026-11-24, predates the reopening of 2026-11-25, its counts are stale (17 criteria now) and it is re-run after the criteria are approved): 3. Calibration: REC-004 (team 3, AI 3) is the nearest in effort: a frontend story on the feed whose logic mostly exists, with a handful of E2E tests. REC-018 (team 5) and REC-003 (team 5) are the upper bound: both carry real state logic (error states, the player controller), which this story does not. What is here is one presentational component (servings, ingredients, steps, a source label and link), a layout switch (at the time of this estimate `(assumed)` to reuse the unmute button's; since 2026-11-25 the panel has its own 260 px switch), 11 criteria (17 now) that each need a short E2E test on the three projects, and recipe-bearing stub data for those tests (the production fixture has `recipe: null` everywhere). Risks that move it: keeping the video exactly centered with the panel beside it, and containing wheel, trackpad and touch scrolling over the panel inside the feed's scroll-snap container (REC-001 showed that gestures near the feed can misbehave on a real device); if either fights the existing feed CSS it goes to 5. I have no information about the panel's visual design (typography, spacing), which is `(assumed)` to be plain. Size check: 3 matches `size:M` (3-5), no warning. This is one voice; the team's estimate comes from your discussion, not from averaging.

AI estimate (2026-11-25, after the reopening): 5. Calibration: REC-018 (team 5, 16 criteria) and REC-003 (team 5) are the nearest in effort, though both carry more state logic; REC-004 (team 3) is the lower bound and is what the first estimate of 3 was based on. What changed since that estimate: the story went from 11 to 17 criteria, the panel has its own 260 px switch (with its boundary tested at 260 and 255 px through custom viewports on the three projects), it is one component outside the feed's scroll container (a restructure of the feed's layout, not an addition beside it), its content swaps at the moment the active video changes, a new `recipe-panel` capability spec is created and two `feed` requirements are amended, and the E2E tests need recipe-bearing stub data. It stays presentational (no state logic), which keeps it below 8. Risks that move it: keeping the video exactly centered with the panel beside it, and keeping wheel, trackpad and touch scrolling over the panel from moving the feed (REC-001 showed that gestures near the feed can misbehave on a real device); if either fights the feed CSS it goes to 8. The manual checks (a real landscape phone, a small landscape phone, readability at 260 px) can add rounds that I cannot size `(assumed)`. Size check: 5 matches `size:M` (3-5), no warning. This is one voice; the team's estimate comes from your discussion, not from averaging.

## REC-022 · Recipe button and sheet when there is no room for the panel
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:M, layer:frontend
- **PRD:** 5.1, 5.3, PERF-4
- **Flags:** split-from:REC-006; blocked-by:REC-006
- **AI estimate:** 8
- **Estimate:** 8

As a home cook whose screen has no room beside the video (a phone in portrait), I want to open the recipe from a button that does not cover the video's controls, so that I can read it while the video keeps playing.

### Acceptance criteria
- Given a video with a recipe is active and there is no room for the panel beside the video (less than 260 px on each side), when I tap the "Recipe" button, then the sheet opens instantly with no extra network request (PERF-4).
- Given a video with a recipe is active and there is no room for the panel, when I open the sheet, then it shows servings, ingredients with their quantities and numbered steps, scrolled to the top.
- Given the sheet is open and there is no room for the panel, when I look at the recipe, then it shows the source label with a link to the original video.
- Given the active video's recipe has a missing serving size or quantity and there is no room for the panel, when I open the sheet, then the missing item is left out with no empty label, as in the panel.
- Given I scrolled the recipe in the sheet and closed it, when I open the sheet again, then the recipe is shown scrolled to the top.
- Given a video with a recipe is active and there is no room for the panel, when I open the sheet, then it has a semi-transparent black background that lets the video show dimly behind it.
- Given a video with a recipe is active and there is no room for the panel, when I open the sheet, then it covers only the video's area.
- Given a video with a recipe is active and there is no room for the panel, when I open the sheet, then it leaves the player's control zones at the top and at the bottom free (manual check).
- Given the sheet is open and there is no room for the panel, when I tap its close button, then the sheet closes and the "Recipe" button is shown.
- Given there is no room for the panel, when I open the sheet, then the "Recipe" button is not shown.
- Given the sheet is open and there is no room for the panel, when I tap its close button, then the video is still visible and playing.
- Given the sheet is open and there is no room for the panel, when I tap a player control in the top or bottom zone, then the player handles the tap (manual check).
- Given the sheet is open, there is no room for the panel and the unmute button is shown over the video, when I tap the unmute button, then sound turns on and the sheet stays open.
- Given sound is off, there is no room for the panel and the unmute button is over the video, when a video with a recipe becomes active, then the "Recipe" button sits in the bottom-right corner directly above the unmute button, above the player's control bar (manual check).
- Given sound is on, so the unmute button is hidden, there is no room for the panel and the unmute button would be over the video, when a video with a recipe becomes active, then the "Recipe" button sits in the same place, directly above where the unmute button would be.
- Given there is no room for the panel, when a video with a recipe becomes active, then the "Recipe" button has the accessible name "Recipe".
- Given there is no room for the panel, when I open the sheet, then its close button has the accessible name "Close recipe".
- Given the sheet is open, there is no room for the panel and the recipe is taller than the sheet, when I swipe vertically on it, then only the recipe scrolls, the active video does not change, and I can reach the last step.
- Given the sheet is open, there is no room for the panel and the recipe is shorter than the sheet, when I swipe vertically on it, then the active video does not change.
- Given the sheet is open and there is no room for the panel, when I swipe in a free control zone to the next video, then the active video changes, the sheet is closed and the "Recipe" button is shown (manual check).
- Given a phone shows the recipe panel beside the video in landscape, when I turn it to portrait (no room for the panel), then the panel is closed and the "Recipe" button is shown.
- Given a phone shows the "Recipe" button in portrait, when I turn it to landscape (room for the panel beside the video), then the recipe panel is open beside the video and the "Recipe" button is gone.
- Given a phone shows the open sheet in portrait, when I turn it to landscape (room for the panel beside the video), then the recipe panel is open beside the video and the sheet and the "Recipe" button are gone.
- Given a video is playing and a phone shows the panel, the "Recipe" button or the sheet, when I turn the phone, then playback and sound do not change.
- Given there is no room for the panel, when a `needs_recipe` video becomes active, then there is no "Recipe" button and no sheet.

### Technical context
Split from REC-006 on 2026-11-24 (its validation, N5 A); the band case was split out to REC-023 on 2026-11-25. Decisions:
- **Placement:** the "Recipe" button sits directly above the unmute button's place and stays there when the unmute button is hidden (the owner's choice). In this story it is a small transparent icon over the video, where the unmute button is over the video (`playback` spec, "Unmute button placement"). Where the unmute button sits beside the video (the band of windows between the two switches), REC-023 owns the button's place. The owner first asked for a button on wide screens too and then said wide screens have the panel always open with no button: this story follows the later statement (confirmed 2026-11-24, "All A"). "No room for the panel" is REC-006's switch (less than 260 px per side `(assumed)`), not the unmute button's aspect switch; a rotation across it is covered here when it ends with the unmute button over the video, and a rotation or resize that ends with the unmute button beside the video (the band) is REC-023's.
- **Scope (third check, P2 A):** the criteria are placement-independent: they hold wherever the sheet exists, in the band as well. Only the button's place beside the video is REC-023's, so in the band the sheet's behavior here applies once REC-023 ships; the title and role stay.
- **Terms (2026-11-25):** "panel" is the wide recipe panel beside the video (REC-006); "sheet" is the overlay opened from the button (this story).
- **Sheet:** a full-height sheet with a semi-transparent black background that shows the video dimly behind it, covers only the video's area, and leaves the player's top and bottom control zones free; the video keeps playing; it shows the same content as the panel (label, link, missing fields left out) and opens scrolled to the top. The exact size of the free zones is tuned and checked only in the manual check on a real phone (the player's own behavior, E2E rule 13), not as a number in the criteria (confirmed 2026-11-24); the change's tasks list it as a manual check.
- **Closing:** a close button is the only way to close. "Tap outside" is not used because what is left outside the sheet is the player's own control zones, which must receive taps. Browser Back is not intercepted in the MVP.
- **Feed spec:** the change amends the `feed` spec "Taps reach the video player": it allows the small Recipe button over the video where the unmute button is over it and the open sheet, which leaves the player's control zones free. The sheet is a layer above the video that catches taps outside the free zones, so the amendment must say so; the button beside the video (REC-023) needs no amendment, since it is outside the video. The panel and the sheet are requirements of the new `recipe-panel` capability.
- **Changing the video with the sheet open:** a swipe that starts in a free control zone moves the feed, as swipes over the player do (REC-001); a swipe on the sheet only scrolls the recipe. The feed is not locked while the sheet is open (confirmed 2026-11-24). Manual-only for the free zone itself, because its size is the player's own, as is the control bar's height for the "Recipe" button above it.
- **Manual checks (E2E rule 13):** the player handling taps in the free zones, the free zones' size, the "Recipe" button above the player's control bar, and a swipe starting in a free zone, on a real phone.
- **Accessibility:** the "Recipe" button and the close button have accessible names ("Recipe" and "Close recipe"); focus handling, an Escape key and screen-reader announcements are out of this story (draft backlog D-21).
- **Playback:** opening or closing the sheet never changes playback or sound, and the sheet does not depend on playback state; hiding the tab changes nothing in it.
- **Sheet state:** whether the sheet is open is feed-level state with open and close calls, so that REC-007 can open it at a video's first end `(assumed)`.
- **Related:** REC-007 (the auto-open applies wherever this sheet is used: it opens it), REC-003 (the unmute button's place), REC-023 (the band: the same button and sheet where the unmute button is beside the video).

Decisions 2026-11-25, in order:
- **Explore of REC-006 ("All three"):** the panel has its own 260 px switch, so a band of windows appears where the unmute button is beside the video but there is no room for the panel; the always-open panel sits in the left gutter, so the right gutter stays free for the unmute button.
- **REC-006's second re-check (N2 to N5 A):** every criterion says "no room for the panel", not "tall screen"; criteria were added for a window narrowed across the threshold, the 255 px case, and the button's place beside the video in the band.
- **REC-006's fourth re-check (N1 to N8 A):** the band placement stays `(assumed)` until the manual check; the unmute button stays visible and tappable above the sheet; the `playback` spec does not change.
- **REC-022's first re-check (14 findings, "all A"):** the sheet shows the same content as the panel and opens scrolled to the top; the "Recipe" button is hidden while the sheet is open; both buttons have accessible names; criteria that depend on the player's own control zones are manual checks.
- **REC-006's third re-check (F1 to F11 A) and its fourth (N1 to N8 A) are one entry in REC-006's own blocks; REC-022 logs them as above.**
- **REC-022's second re-check (10 findings, "all A"):** the band is split out now, not after the estimate (N1 A): REC-023 takes the criteria about the unmute button beside the video, the 255 px boundary, a window narrowed or widened, and the title-only band case; non-action Whens reworded, criteria split, a criterion for the sheet's extent added, "sheet" and "panel" used consistently (N2 to N4 A); Decisions blocks put in date order, README's next free ID fixed, REC-006's estimate line reworded (N5, N7, N10 A); the old estimates stay, marked stale, and the AI estimate is re-run after approval (N6 A).

- **REC-022's third check (P1 to P10, "all A"):** Givens limited to three preconditions; notes and long Thens moved to the Technical context; one criterion for playback and sound unchanged on any turn; a scope note that the criteria hold wherever the sheet exists; REC-023 gained two criteria (the unmute button moving from over to beside the video); pointers to REC-023 in REC-006 and REC-007, the checklist and README Decided 6.
- **REC-022's fourth check (9 findings, "all A"):** counts corrected (REC-022 25, REC-023 12); rotations and resizes that end in the band are REC-023's, with one criterion added for the reverse move (beside to over); one `feed` amendment per change ("Taps reach the video player": REC-022 for the button over the video and the sheet, REC-023 for the button beside the video); REC-007 stays `blocked-by:REC-022` and its narrowed-window criterion waits for REC-023; the checklist points the narrow window to REC-023; the borderline Givens and the sound-on title-only case are accepted.

### Estimation notes
M: a button placed relative to another control, a translucent sheet with free control zones (a layout risk tuned on a real phone), a feed spec amendment and the rotation change. Split from REC-006 by behavior. After the reopening of 2026-11-25 and the split of the band case to REC-023 it has 25 criteria; the AI estimate was re-run after the criteria were approved (8) and the team Estimate is 8.

AI estimate (2026-11-24, predates the reopening of 2026-11-25, its counts are stale (25 criteria now, after REC-023 was split out) and it is re-run after the criteria are approved): 5. Calibration: REC-006 (AI 3, team 3) is the base this story reuses (the panel and its content); REC-003 (team 5, AI 5) is the nearest for the hard part, because its unmute button placement needed several rounds of calibration on a real Android phone and desktop Chrome, and this story places a second button relative to that one. REC-018 (team 5) has a similar count of criteria (16 then, 25 now), though with more state logic. What is here: a button positioned above another control, a translucent sheet with free control zones for the player, 14 automatable criteria at the time (about 20 now, of 25) with E2E tests on the three projects, two manual checks, the rotation in both directions, and the `feed` spec amendment (a layer over the video that catches taps outside the free zones). Risks that move it: the placement and the free-zone sizes can only be settled on a real phone (REC-003 needed repeated passes, `(inferred)` from its history); and a swipe that starts in a free zone must move the feed while a swipe on the sheet must not (the same scroll-snap gesture area that REC-001 found sensitive); if either fights the existing feed it could go to 8. I have no information about the sheet's visual design, `(assumed)` plain. Size check: 5 matches `size:M` (3-5), no warning. This is one voice; the team's estimate comes from your discussion, not from averaging.

AI estimate (2026-11-25, after the criteria were approved): 8. Calibration: REC-006 (team 5, 17 criteria) is the base this story reuses (the content and the `recipe-panel` capability it seeds); REC-003 (team 5) is the nearest for the hard part, because its unmute button placement needed repeated passes on a real Android phone and desktop Chrome, and this story places a second button relative to that one; REC-018 (team 5, 16 criteria) has fewer criteria and more state logic. What is here: 25 criteria (about 20 automatable, each an E2E test on the three projects, and 4 manual checks), a button above the unmute button's place, a translucent sheet that covers only the video's area and leaves the player's control zones free, a swipe rule that differs between the sheet and the free zones, three rotation criteria, and the `feed` amendment "Taps reach the video player" (a layer over the video that catches taps outside the free zones). Risks that would keep it at 5: the sheet and button land in one pass; risks that would push it to 13: the free zones and the button's height above the control bar need several rounds on a real phone (`(inferred)` from REC-003's history). Size check: warning, 8 does not match `size:M` (3-5); the label is not changed, and the team may want to re-size it to L. This is one voice; the team's estimate comes from your discussion, not from averaging.

## REC-023 · Recipe button and sheet beside the video, in windows without room for the panel
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:M, layer:frontend
- **PRD:** 5.1, 5.3, PERF-4
- **Flags:** split-from:REC-022; blocked-by:REC-022
- **AI estimate:** 5
- **Estimate:** 5

As a home cook in a narrow desktop window or on a small phone in landscape, I want the "Recipe" button and the sheet to work where the unmute button sits beside the video, so that I can read the recipe there too.

### Acceptance criteria
- Given the unmute button sits beside the video and there is less than 260 px of room on each side of the video (for example a 700x800 window), when a video with a recipe becomes active, then the "Recipe" button is shown and there is no panel beside the video.
- Given there is no room for the panel and the window is just wider than aspect ratio 3/4, when a video with a recipe becomes active, then the "Recipe" button sits directly above the unmute button beside the video `(assumed; manual check: the gutter is narrowest here)`.
- Given the room beside the video is 255 px on each side and the unmute button sits beside the video, when a video with a recipe becomes active, then the "Recipe" button is shown and there is no panel beside the video.
- Given there is no room for the panel but the unmute button sits beside the video and sound is off, when a video with a recipe becomes active, then the "Recipe" button sits directly above the unmute button beside the video, not over it `(assumed; manual check)`.
- Given sound is on, so the unmute button is hidden, there is no room for the panel and the unmute button would be beside the video, when a video with a recipe becomes active, then the "Recipe" button sits in the same place beside the video, directly above where the unmute button would be `(assumed; manual check)`.
- Given the sheet is open, there is no room for the panel and the unmute button is shown beside the video, when I tap the unmute button, then sound turns on and the sheet stays open.
- Given the sheet is open, there is no room for the panel and the unmute button sits beside the video, when I scroll over a gutter beside the video (wheel, trackpad or touch), then the feed moves by one video, the sheet is closed and the "Recipe" button is shown.
- Given the unmute button sits beside the video, there is no room for the panel and no sheet is open, when I scroll over a gutter beside the video (wheel, trackpad or touch), including a swipe that starts on the "Recipe" or unmute button, then the feed moves by one video.
- Given the sheet is open, there is no room for the panel and the unmute button sits beside the video, when I look at the screen, then the sheet does not cover the gutter, the unmute button or the "Recipe" button's place.
- Given the recipe panel is open beside the video, when I narrow the window until there is no room for the panel and the unmute button sits beside the video, then the panel is closed and the "Recipe" button is shown, and playback and sound do not change.
- Given the sheet is open and there is no room for the panel, when I widen the window until there is room for the panel (the unmute button beside the video), then the recipe panel opens beside the video and the sheet is gone, and playback and sound do not change.
- Given the "Recipe" button is shown over the video where the unmute button is, when I change the window's shape so that the unmute button moves beside the video (no room for the panel), then the "Recipe" button sits directly above the unmute button beside the video `(assumed; manual check)`.
- Given the sheet is open, when I change the window's shape so that the unmute button moves from over to beside the video (no room for the panel), then the sheet stays open and the video keeps playing.
- Given the "Recipe" button is shown beside the video, when I change the window's shape so that the unmute button moves back over the video (no room for the panel), then the "Recipe" button sits directly above the unmute button over the video `(assumed; manual check)`.
- Given the unmute button sits beside the video, sound is off and there is no room for the panel, when a `needs_recipe` video becomes active, then only the unmute button is shown beside the video and there is no "Recipe" button.

### Technical context
Split from REC-022 on 2026-11-25 (its second re-check, N1 A): REC-022 had grown to 31 criteria, and 9 of them moved here at the split, and the story has 15 after its first check; they depended on one open decision, the "band" of windows between the unmute button's switch and the panel's switch. REC-022 keeps the button and sheet where the unmute button is over the video; this story is the same button and sheet where it sits beside the video. It is `blocked-by:REC-022` because it builds on that button and sheet; REC-022 does not need it, so until it ships a window in the band has no recipe, as a narrow window already had none before REC-022.
- **The band:** the unmute button goes over the video only when the screen's aspect ratio is 3/4 or narrower; the recipe panel needs 260 px per side `(assumed)`. A 700x800 window has only 125 px per side but its unmute button is beside the video. Small phones in landscape (about 667x375, 228 px per side) are in the band too. Room per side is (screen width minus the video's width) divided by two; the video is as tall as the screen and 9/16 as wide.
- **Placement `(assumed)`:** the "Recipe" button sits directly above the unmute button, beside the video in the right gutter, and keeps its place when the unmute button is hidden. Near the unmute switch the right gutter shrinks (about 80 px at aspect 0.76 on an 800 px high window): if a button does not fit there, the button sits over the video's corner like on a tall phone, `(assumed)`. This is decided only by the manual check on a real window and on a small landscape phone, which is a gate for this story.
- **Sheet:** the same sheet as REC-022; it covers only the video's area, so the gutters, the unmute button and the player's free zones stay usable. A wheel, trackpad or touch scroll over a gutter moves the feed and closes the sheet, as a swipe in a free zone does; the rule that the sheet closes when the active video changes lives in the `recipe-panel` capability.
- **First check (11 findings, "all A", 2026-11-25):** the fallback stays a note decided by the real-window check, with no criterion and no invented fit number; the placement criteria are labelled `(assumed; manual check)`, the gate blocks `done` and not the approval of the criteria, and the AI estimate assumes the placement as written and states the risk; criteria were added for the window just wider than 3/4 (the narrowest gutter), the sheet leaving the gutter and the unmute button uncovered, and a gutter swipe with no sheet (including one that starts on a button); "swipe" replaces "swipe or scroll" and one action, "I change the window's shape", replaces "a resize or a rotation"; the sound cases are accepted as in REC-022; REC-007's dependency stays in prose; the flicker near 260 px and the mobile bar edge are inherited from REC-006 and accepted. The exact 3/4 aspect value stays with the unmute button's own tests (REC-003).
- **Feed spec:** this change needs no `feed` amendment (third check of REC-023, N3 A): a button beside the video is not a layer above it, so "Taps reach the video player" (amended by REC-022 for the button over the video and the sheet) does not cover it, and a gesture over a gutter follows the existing rule that it moves the feed. The `playback` spec does not change.
- **Resize:** a window resize across the panel's switch behaves like a rotation (REC-022): narrowing closes the panel and shows the button, widening with the sheet open shows the panel. This story covers the resizes and rotations that end with the unmute button beside the video; the ones that end with it over the video are REC-022's.
- **Related:** REC-006 (the panel and its switch), REC-022 (the button and sheet), REC-007 (the auto-open also applies in the band), REC-003 (the unmute button).

### Estimation notes
M: the band case split out of REC-022 (15 criteria after the first check of REC-023): a button placed beside the video in a narrow gutter (a layout risk checked on a real window), two resize criteria, three about the unmute button moving between its placements and a gutter gesture rule. The AI estimate and the team Estimate come after the criteria are approved.

AI estimate (2026-11-25, after the criteria were approved): 5. Calibration: REC-022 (team 8, 25 criteria) is the base this story extends: the button and the sheet already exist when this story starts, so what is left is where the button goes beside the video, how it follows the unmute button when the window changes shape, and the gutter gestures. REC-006 (team 5, 17 criteria) is the nearest in size of work, since it also has a layout switch and resize criteria; REC-004 (team 3) is the lower bound. What is here: 15 criteria, about 10 automatable (E2E on the three projects, several needing custom viewports) and 5 labelled `(assumed; manual check)` for a real window and a small landscape phone; no state logic; no `feed` amendment. Stated risk: the placement of the button beside the video, and the narrow gutter near aspect 3/4 (about 80 px at 800 px high), are assumed; if the real-window check says the button does not fit, the fallback (the button over the video's corner) becomes a real second placement and the estimate goes to 8. Size check: 5 matches `size:M` (3-5), no warning. This is one voice; the team's estimate comes from your discussion, not from averaging.


## REC-007 · Panel opens automatically after the first play-through
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:S, layer:frontend
- **PRD:** 5.3
- **Flags:** needs-human-validation; blocked-by:REC-022; blocked-by:REC-023
- **AI estimate:** 3
- **Estimate:** 3

As a home cook, I want the recipe to appear by itself once I've watched the video, so that I don't have to look for it.

### Acceptance criteria
- Given there is no room for the panel and a video with a recipe is playing for the first time in this view, when it reaches the end and starts its first repeat, then the recipe sheet opens automatically.
- Given there is no room for the panel and the sheet opened automatically and I closed it, when the video loops again, then the sheet does not reopen.
- Given there is no room for the panel and I swiped away from a video and came back to it (a new view), when it reaches the end of its first loop, then the sheet opens automatically again.
- Given there is no room for the panel and a video is playing, when the sheet opens automatically, then the video keeps playing.
- Given there is no room for the panel and a `needs_recipe` video is playing, when it reaches the end and starts its first repeat, then no sheet opens.
- Given the screen has room for the panel beside the video, so the recipe panel is always open, when a video reaches the end and starts its first repeat, then nothing changes and the panel stays open.
- Given there is no room for the panel and I opened the sheet with the "Recipe" button and it is still open, when the video reaches its first end, then the sheet stays open.
- Given there is no room for the panel and I opened and closed the sheet by hand earlier in this view, when the video reaches its first end, then the sheet does not open.
- Given a phone in landscape showed the panel at the video's first end and I turned it to portrait, when the video reaches its second end, then the sheet does not open.
- Given a window showed the panel at the video's first end and I narrowed it until there is no room for the panel, when the video reaches its second end, then the sheet does not open.
- Given a window showed the panel earlier in this view and I narrowed it until there is no room for the panel before the video's first end, when the video reaches its first end, then the sheet opens automatically.

### Technical context
A `needs_recipe` video has no recipe panel (decided 2026-11-17, `backlog/README.md` Decided 4; PRD 5.3).

Decisions 2026-11-24 (validation, first check 12 findings, "All A"):
- **Where the sheet is used (#1, #2, #12 A, reworded 2026-11-25):** with room for the panel beside the video the panel is always open (REC-006), so there is no auto-open there. Where there is no room for the panel the auto-open opens REC-022's sheet, so the story is `blocked-by:REC-022` and, because the criteria hold in the band too (the unmute button beside the video), `blocked-by:REC-023` (re-check of REC-007, #1 A, 2026-11-25); REC-006 is not needed. PRD 5.3 already says so.
- **What a view is (#5, #8 A):** a view starts when a video becomes the active one and ends when I swipe away; coming back is a new view (consistent with REC-003, which plays it from the beginning). The state is per tab and in memory only, like the sound state: a reload resets it. A view belongs to a slide (cycle plus YouTube ID, as the feed keys its slides), so a later cycle's slide of the same video is a new view, and an end event counts only for the slide that is active (re-check #13 A, 2026-11-25). The used state resets when the view ends, however the sheet was opened (#14 A).
- **At most once per view (#3, #4, #9 A):** the auto-open happens at most once per view and counts as used when the panel was already shown at the first end (a wide screen, or a sheet opened with the button). Closing by hand never makes it reopen, and opening the sheet by hand earlier in the view skips the auto-open. Rotation keeps the view's state; REC-022 still closes the sheet and shows the button when the phone turns to portrait. The auto-open applies only to the video that ended.
- **The count (#6, #7, #10 A):** it lives in the feed, per view and per YouTube ID, in memory, and uses the `videoended` event of the `playback` spec (every end, including each loop, with the video ID). Only an end of the active video counts; events of other videos, or late events after a swipe, are ignored. The first end counts however the first play went: a pause with the player's own control or a seek to the end that produces an end event counts, and a hidden tab produces no event, so the count does not advance. A video without a recipe never opens the sheet; only `needs_recipe` has none, because a `ready` video always has one (EXT-5).
- **Related:** REC-003 (the `videoended` event), REC-006 (the always-open panel), REC-022 (the sheet, its close button and the rotation), REC-023 (the sheet's button beside the video: in the band the auto-open starts working when it ships, so the story is `blocked-by:REC-023` and every criterion has a real E2E test with no `test.fixme`).

Decisions 2026-11-25 (re-check of the reopening, 10 findings, "all A"):
- **Used state (#6 A):** the auto-open counts as used when the panel or the sheet is shown at the first end, or when the sheet was opened or closed by hand in this view; changing the window's shape alone never sets it. So a window narrowed before the first end still auto-opens the sheet (a criterion was added), and the second end after a narrowing or a rotation never opens it. A later end while the sheet is open changes nothing (implied). A hidden tab produces no end event, and a pause or a seek counts as the first end (unit-test detail, no scenario).
- **Wording (#9 A):** "first end" and "second end" are used, "next end" is not.
- **Sheet state (#5 A):** the sheet's open state is feed-level state with open and close calls that this story uses `(assumed)`; REC-022's Technical context records it.
- **Size and estimates (#4 A):** the size label is re-sized to `size:M` once the criteria are approved, and the AI estimate is re-run then; the stored 3/3 predate the reopening.

Note 2026-11-25 (from the REC-006 re-check #11, reopened for a short re-check): "tall screen" in this story now means no room for the panel, REC-006's 260 px per side switch (`(assumed)` value), not the unmute button's aspect switch. The auto-open therefore also covers a narrow window where the recipe uses the button and the sheet. The criteria now say "no room for the panel" instead of "the screen is tall" and have one more criterion for a window narrowed after the panel was shown (second re-check of REC-006, N6 A, 2026-11-25).

### Estimation notes
S: small state machine on top of REC-003 (the `videoended` event) and REC-022 (the sheet). The meaning of "view" is decided (2026-11-24). With 11 criteria (after 2026-11-25), the screen conditions and the two dependencies the size S no longer fits 3 points: it is re-sized to M when the criteria are approved, and the estimate of 3 is re-run then.

AI estimate (2026-11-25, before the reopening's rewording; re-run after the criteria are approved; 11 criteria now; its calibration text predates REC-006 team 5 and REC-022 team 8): 3. Calibration: REC-006 (team 3) and REC-004 (team 3) are the nearest frontend stories on the feed with mostly existing pieces; REC-022 (team 5) is the story whose sheet this one opens, so this one is smaller. What is here: a per-slide, per-view state in the feed (a small state machine, which Vitest can cover without a browser), the `videoended` event that REC-003 already emits, and 9 criteria at the time (10 now) whose E2E tests reuse the fake player's `emitEnded` and a viewport change for rotation. Risks that move it: it depends on REC-022's way to open and close the sheet, which does not exist yet (`(assumed)` a simple open and close call), and the interplay with rotation and a hand-opened sheet is where bugs are likely; if REC-022's sheet state is awkward to drive from outside, it goes to 5. Size check: warning, 3 does not match `size:S` (1-2); the label is not changed, and the team may want to re-size it to M. This is one voice; the team's estimate comes from your discussion, not from averaging.

## REC-008 · Recipe extracted ahead of time from description or comment
- **Status:** todo
- **Labels:** module:extraction, type:feature, size:L, layer:backend
- **PRD:** 6.2, EXT-1, EXT-3, EXT-5, EXT-6, 6.4, PERF-1, 9 (LLM errors)
- **Flags:** needs-human-validation; blocked-by:REC-019
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want every recipe in the feed to be extracted before I see it, so that I never wait for one to be generated.

### Acceptance criteria
- Given a candidate video whose description contains a full recipe, when extraction runs, then servings, ingredients (name, quantity, unit) and steps are stored, with source `description` (EXT-1, EXT-3, EXT-6).
- Given an extraction result with fewer than 2 ingredients or fewer than 2 steps, when it is checked, then it does not count as complete and the next source is tried (EXT-5).
- Given no source yields a complete recipe, when extraction finishes, then the video is marked `needs_recipe` and enters the feed with its title only.
- Given a user is browsing the feed, when videos load, then no extraction runs (PERF-1).

### Technical context
`needs_recipe` videos are shown in the feed with their title only, and adding a recipe by hand is out of the MVP (decided 2026-11-17, `backlog/README.md` Decided 4; `draft-backlog-list.md` D-7). Re-running extraction later on `needs_recipe` videos is D-8. Recipe fields follow the data model document (REC-020). This story owns recipe presence by status (data model Rule 3: `ready` and `not_easy` videos are written with their recipe, `needs_recipe` and `rejected` without one), since it spans two tables and the database does not enforce it (REC-019 validation, 2026-11-20); a maintainer's console edit that breaks it is an accepted risk. The video and its recipe are written together in one step, with the final status, only after extraction and the easy check finish (from REC-020 exploration, 2026-11-17); an LLM error before that stores nothing, and the video is retried the next day.

### Estimation notes
L: LLM prompt design for structured output, plus the completeness rules and status handling.
Sets up the extraction pipeline that REC-017 and the captions source (REC-009) build on.

## REC-017 · Recipe extracted from the top comment as fallback
- **Status:** todo
- **Labels:** module:extraction, type:feature, size:M, layer:backend
- **PRD:** EXT-1, EXT-2, 9 (pinned comment not identifiable)
- **Flags:** needs-human-validation; blocked-by:REC-008
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want a recipe found in the comments when the description has none, so that more good videos make it into the feed.

### Acceptance criteria
- Given the description does not give a complete recipe, when extraction continues, then the top comment is tried next (EXT-1, EXT-2).
- Given the video's creator has commented, when the comment source is chosen, then the creator's comment is preferred over other top comments (EXT-2).
- Given the chosen comment is not actually a recipe, when it is checked, then it is not used and the next source is tried (§9).

### Technical context
—

### Estimation notes
M: reuses the REC-008 pipeline with a new source.
The pinned comment can't be identified through the API (§9), so the creator-comment heuristic needs care.

## REC-009 · Spike: can captions/transcripts be used for third-party videos?
- **Status:** todo
- **Labels:** module:extraction, type:spike, size:S, layer:backend
- **PRD:** EXT-1, 9 (captions access), 12 (captions legality)
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want recipes recovered from captions when the description and comment fail, so that fewer good videos are left out of the feed.

### Acceptance criteria
- Given the official YouTube Data API only lets owners download captions, when the spike ends, then it documents which caption/transcript options (e.g. auto-generated transcripts) are allowed for third-party videos.
- Given the allowed options, when the spike ends, then it gives a clear go/no-go on captions as the third extraction source.
- Given a no-go, when the spike closes, then it confirms the PRD fallback: videos without a recipe in the description or comment are marked `needs_recipe`.

### Technical context
—

### Estimation notes
Spike, timebox 8 h. Minimum output: a go/no-go decision with the allowed option, if any.
If go, a captions-fallback story is written then (tentative until the spike ends).

## REC-010 · Only easy recipes enter the feed
- **Status:** todo
- **Labels:** module:extraction, type:feature, size:M, layer:backend
- **PRD:** 6.3, EXT-4, 6.4
- **Flags:** needs-human-validation; blocked-by:REC-019
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want every recipe in the feed to be genuinely easy, so that I can cook it today with little time and ordinary equipment.

### Acceptance criteria
- Given an extracted recipe with ≤ 10 ingredients, ≤ 30 minutes of estimated active time, and only common kitchen equipment, when it is classified, then the video becomes `ready`.
- Given an extracted recipe with 11 ingredients, or 31 active minutes, or special equipment (e.g. sous vide, smoker), when it is classified, then the video becomes `not_easy` and never enters the feed.
- Given any classified recipe, when it is stored, then the raw values `ingredient_count`, `estimated_active_minutes` and `special_equipment[]` are kept (EXT-4).
- Given the thresholds are changed later, when classification is re-applied, then it uses the stored raw values without re-running extraction.

### Technical context
—

### Estimation notes
M: simple rules, but the LLM must return reliable facts.
"Common kitchen equipment" is a fuzzy boundary for the LLM.
