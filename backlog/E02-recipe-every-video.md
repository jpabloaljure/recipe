---
id: E02
title: A written recipe for every video that has one
prd-goal: G2
---

## REC-006 · Recipe panel with servings, ingredients and steps
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:M, layer:frontend
- **PRD:** 5.1, 5.3, PERF-4, API-1
- **Flags:** needs-human-validation
- **AI estimate:** 3
- **Estimate:** 3

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
- **Split by behavior (N5 A):** this story keeps the panel and its wide-screen layout; the "Recipe" button and the sheet where there is no room for the panel moved to REC-022 (`split-from:REC-006`, `blocked-by:REC-006`). REC-006 does not need REC-022, so it has no `blocked-by`. REC-006 alone does not cover a phone in portrait, nor a narrow window with less than room for the panel: until REC-022 ships, those screens have no recipe at all (accepted, 2026-11-25).
- **Layout by space, not device (revised 2026-11-25, see below):** with room for the panel (desktop, a larger phone in landscape) the recipe panel is always open beside the centered video, with no "Recipe" button and no close button, and it follows the active video. Any other screen is REC-022. The first version of this decision reused the unmute button's switch with no new threshold; the explore of 2026-11-25 reversed that part.
- **Scrolling:** scrolling over the panel never moves the feed, also when the recipe is short or at its end.
- **Label and link:** the link opens in a new tab and the app tab's video pauses by the hidden-tab rule (`playback` spec). Label wording: "Recipe from the description / top comment / captions" (confirmed 2026-11-24).
- **Missing fields:** a missing serving size or quantity is left out; long lists scroll (confirmed 2026-11-24).
- **Title-only videos:** the panel area is empty and the video stays centered (confirmed 2026-11-24). The app shows no title of its own: the embed's own overlay shows the title and channel (seen on the owner's real-device screenshots).
- **Playback:** the panel does not depend on playback state, and hiding the tab changes nothing in it. Opening or closing it never changes playback or sound, and a pause made with the player's own control stays.
- **Feed spec and PRD:** PRD 5.1 and 5.3 are updated (2026-11-24 and 2026-11-25). The panel and the sheet are requirements of a new `recipe-panel` capability; REC-006's change amends the `feed` requirements "One video per gesture" (the panel is an exception) and "Centered video on wide screens" (the panel beside it), and REC-022's amends "Taps reach the video player" (the Recipe button, over or beside the video, and the sheet). The `playback` spec does not change (third re-check F6 A).
- **Related, none blocking:** REC-002 and REC-021 (the `recipe` data shape), REC-007 (auto-open applies only where the sheet is used, because with room for the panel it is always open; `blocked-by:REC-022`), REC-014 (a deep link lands on a video with its recipe available), REC-012 (favorites). A `ready` video always has a complete recipe (EXT-5), so there is no error path here. Accessibility beyond the "Recipe" button's accessible name (REC-022) goes to the draft backlog.

Decisions 2026-11-25 (explore of REC-006 against the code, "All three", reopened for validation):
- **Room for the panel (reverses "no new threshold"):** the panel has its own switch: the room beside the video on each side must be at least 260 px `(assumed)`; the value is tuned in the manual check. The room per side is (screen width minus the video's width) divided by two, the video being as tall as the screen and 9/16 as wide. Examples: 1280x800 has 415 px, a phone at 915x412 has 342, 1024x768 has 296, 900x800 has 225 (no panel), 700x800 has 125 (no panel). Below 260 px the screen takes REC-022's path. The unmute button keeps its own switch (`playback` spec), so there is a band of screens where it sits beside the video but the recipe uses the button and the sheet (see REC-022).
- **Left gutter:** the panel sits to the left of the video, because the unmute button lives in the right gutter (about 125 px above the bottom).
- **One panel, outside the feed:** a single panel that is a sibling of the feed's scroll container, not one per slide, so a wheel or touch over it cannot move the feed's scroll-snap container; it changes its content when the active video changes. A swipe that starts on the panel's area does not move the feed (a manual check on a landscape phone).
- **Seeing it:** production has only title-only videos until REC-008, so the E2E tests use stubbed recipes and the manual check uses a preview or a local database seeded with recipes (`scripts/db/seed.mts` supports them).

Decisions 2026-11-25 (re-check of the reopening, 15 findings, "all A"):
- **Boundary and resize (#1, #2 A):** the threshold is inclusive (260 px per side counts); E2E tests it with custom viewports, 260 px with the panel and 255 px without (the other side is REC-022). A window widened across the threshold shows the panel with no change to playback or sound; the narrower side (a window narrowed across it, and the 255 px case) is REC-022's, which has criteria for both since the second re-check.
- **Layout (#3, #4 A):** the video stays centered and uncovered; the panel's width is the room beside the video minus a 16 px margin on each side `(assumed)`; the unmute button stays visible to the right of the video.
- **Gestures (#5, #6 A):** a wheel or swipe over the panel only scrolls the recipe (the swipe on a real landscape phone is a manual check, E2E rule 13). Over the rest of the screen, including the left gutter of a title-only video and the right gutter, a gesture moves the feed as today.
- **Content swap (#7 A):** the panel's content changes at the moment the new video becomes active (the same moment as `data-active`), scrolls to the top, and clears for a `needs_recipe` video.
- **Stale text (#8 A):** cleaned in this pass; the screens with room depend on the 260 px, not the device (second re-check N1 A: criterion 1 now gives the number and drops the device examples).
- **Spec deltas (#10 A):** REC-006's change amends the `feed` requirements "One video per gesture" (the panel is an exception) and "Centered video on wide screens" (the panel beside it); REC-022 amends "Taps reach the video player".
- **Related stories (#11, #12 A):** REC-007 and the PRD move to "where the sheet is used" (auto-open also covers a narrow window), and REC-022's wording follows "no room for the panel"; REC-007 is reopened for a short re-check.
- **Notes (#13, #14, #15 A):** the right gutter is reserved for the unmute button; the reversal of "no new threshold" is logged as Decided 6 in `backlog/README.md`; the panel's focus order and the source link's accessible name are added to draft D-21.

Decisions 2026-11-25 (second re-check, 9 findings, "all A"):
- **Width (N8 A):** the panel is at most 400 px wide `(assumed)`, so it stays readable on an ultra-wide window; a note, with no criterion. The PRD keeps "about 260 px" (N9 A): it is hedged, and the value is tuned in the manual check.
- **Third re-check (F3 to F11, "all A"):** small phones in landscape (about 667x375, 228 px per side) get the sheet, and the manual check includes such a phone and the panel's readability at exactly 260 px (244 px wide). A mobile browser bar changing the visible height near the threshold may flip panel and button; accepted for the MVP, no criterion. The switch is preferably a CSS rule, so there is no flash of the wrong layout on first paint (no criterion). The estimates of REC-006, REC-022 and REC-007 are kept, marked as predating the reopening, and re-run after each story's criteria are approved; a split of REC-022's band case is decided after its estimate. REC-003 (the `videoended` event) is done, and REC-007 needs REC-006's panel through `blocked-by:REC-022`.
- **Neighbour stories (N2 to N7 A):** REC-022 now uses "no room for the panel" in every criterion and has criteria for a window narrowed across the threshold, 255 px per side and the button's place in the band; REC-007's criteria use the same wording and have a resize criterion. The AI estimates of all three are re-run after each one's criteria are approved.

### Estimation notes
M: one component with the wide-screen layout. After the 2026-11-24 split the story is the panel, its content and the wide-screen behavior; the button and sheet used where there is no room for the panel are REC-022. After the reopening of 2026-11-25 it has 17 criteria, its own 260 px switch, one panel outside the feed's scroll container, and stubbed recipes for the E2E tests; the estimates of 3 predate that and are re-run after the criteria are approved.
Data already arrives with the feed, so no loading states are needed.

AI estimate (2026-11-24, predates the reopening of 2026-11-25, its counts are stale (17 criteria now) and it is re-run after the criteria are approved): 3. Calibration: REC-004 (team 3, AI 3) is the nearest in effort: a frontend story on the feed whose logic mostly exists, with a handful of E2E tests. REC-018 (team 5) and REC-003 (team 5) are the upper bound: both carry real state logic (error states, the player controller), which this story does not. What is here is one presentational component (servings, ingredients, steps, a source label and link), a layout switch (at the time of this estimate `(assumed)` to reuse the unmute button's; since 2026-11-25 the panel has its own 260 px switch), 11 criteria (17 now) that each need a short E2E test on the three projects, and recipe-bearing stub data for those tests (the production fixture has `recipe: null` everywhere). Risks that move it: keeping the video exactly centered with the panel beside it, and containing wheel, trackpad and touch scrolling over the panel inside the feed's scroll-snap container (REC-001 showed that gestures near the feed can misbehave on a real device); if either fights the existing feed CSS it goes to 5. I have no information about the panel's visual design (typography, spacing), which is `(assumed)` to be plain. Size check: 3 matches `size:M` (3-5), no warning. This is one voice; the team's estimate comes from your discussion, not from averaging.

## REC-022 · Recipe button and sheet when there is no room for the panel
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:M, layer:frontend
- **PRD:** 5.1, 5.3, PERF-4
- **Flags:** needs-human-validation; split-from:REC-006; blocked-by:REC-006
- **AI estimate:** 5
- **Estimate:** 5

As a home cook whose screen has no room beside the video (a phone in portrait, or a narrow window), I want to open the recipe from a button that does not cover the video's controls, so that I can read it while the video keeps playing.

### Acceptance criteria
- Given a video with a recipe is active and there is no room for the panel beside the video (less than 260 px on each side), when I tap the "Recipe" button, then the recipe panel opens instantly with no extra network request (PERF-4).
- Given the unmute button sits beside the video and there is less than 260 px of room on each side of the video (for example a 700x800 window), when a video with a recipe becomes active, then the "Recipe" button is shown and there is no panel beside the video.
- Given the room beside the video is 255 px on each side, when a video with a recipe becomes active, then the "Recipe" button is shown and there is no panel beside the video.
- Given there is no room for the panel and a video with a recipe is active, when I open the recipe panel, then it shows servings, ingredients with their quantities and numbered steps.
- Given there is no room for the panel and a video with a recipe is active, when I open the recipe panel, then it is a sheet with a semi-transparent black background that lets the video show dimly behind it.
- Given there is no room for the panel and a video with a recipe is active, when I open the recipe panel, then it leaves the player's control zones at the top and at the bottom free (manual check).
- Given the recipe panel is open and there is no room for the panel, when I tap its close button, then the panel closes and the "Recipe" button is shown.
- Given the recipe panel is open and there is no room for the panel, when I close it, then the video is still visible and playing.
- Given the recipe panel is open and there is no room for the panel, when I tap a player control in the top or bottom zone, then the player handles the tap (manual check).
- Given the sheet is open, there is no room for the panel and sound is off, when I tap the unmute button, then sound turns on and the sheet stays open.
- Given sound is off, there is no room for the panel and the unmute button is over the video, when a video with a recipe becomes active, then the "Recipe" button sits in the bottom-right corner directly above the unmute button, above the player's control bar.
- Given sound is on, so the unmute button is hidden, there is no room for the panel and the unmute button would be over the video, when a video with a recipe becomes active, then the "Recipe" button sits in the same place, directly above where the unmute button would be.
- Given sound is on, so the unmute button is hidden, there is no room for the panel and the unmute button would be beside the video, when a video with a recipe becomes active, then the "Recipe" button sits in the same place beside the video, directly above where the unmute button would be `(assumed)`.
- Given there is no room for the panel but the unmute button sits beside the video (for example a 700x800 window) and sound is off, when a video with a recipe becomes active, then the "Recipe" button sits directly above the unmute button beside the video, not over it `(assumed)`.
- Given there is no room for the panel, when a video with a recipe becomes active, then the "Recipe" button has the accessible name "Recipe".
- Given the recipe panel is open, there is no room for the panel and the recipe is taller than the sheet, when I swipe vertically on it, then only the recipe scrolls, the active video does not change, and I can reach the last step.
- Given the recipe panel is open, there is no room for the panel and the recipe is shorter than the sheet, when I swipe vertically on it, then the active video does not change.
- Given the recipe panel is open and there is no room for the panel, when I swipe in a free control zone to the next video, then the active video changes, the panel is closed and the "Recipe" button is shown (confirmed 2026-11-24).
- Given a phone shows the recipe panel beside the video in landscape, when I turn it to portrait (no room for the panel), then the panel is closed and the "Recipe" button is shown, and playback and sound do not change.
- Given a phone shows the "Recipe" button in portrait, when I turn it to landscape (room for the panel beside the video), then the recipe panel is open beside the video and the "Recipe" button is gone, and playback and sound do not change.
- Given a phone shows the open sheet in portrait, when I turn it to landscape (room for the panel beside the video), then the recipe panel is open beside the video and the sheet and the "Recipe" button are gone, and playback and sound do not change.
- Given the recipe panel is open beside the video, when I narrow the window until there is no room for the panel, then the panel is closed and the "Recipe" button is shown, and playback and sound do not change.
- Given there is no room for the panel, when a `needs_recipe` video becomes active, then there is no "Recipe" button and no sheet.

### Technical context
Split from REC-006 on 2026-11-24 (its validation, N5 A). Decisions from that validation:
- **Placement:** the "Recipe" button sits directly above the unmute button's place and stays there when the unmute button is hidden (the owner's choice). A small transparent icon over the video where the unmute button is over the video, like the unmute icon (`playback` spec, "Unmute button placement"), and, in the band of windows where the unmute button sits beside the video, a button beside the video directly above the unmute button (see Decisions 2026-11-25). The owner first asked for a button on wide screens too and then said wide screens have the panel always open with no button: this story follows the later statement (confirmed 2026-11-24, "All A"). Revised 2026-11-25: this story applies when there is less than room for the panel beside the video (REC-006's switch, at least 260 px per side `(assumed)`), not when the unmute button's aspect switch says so; the two switches are named by where the unmute button is, "over the video" or "beside the video", and a desktop window resize across the panel's switch behaves like a rotation.
- **Sheet:** a full-height sheet with a semi-transparent black background that shows the video dimly behind it and leaves the player's top and bottom control zones free; the video keeps playing. The exact size of the free zones is tuned and checked only in the manual check on a real phone (the player's own behavior, E2E rule 13), not as a number in the criteria (confirmed 2026-11-24); the change's tasks list it as a manual check.
- **Closing:** a close button is the only way to close. "Tap outside" is not used because what is left outside the sheet is the player's own control zones, which must receive taps. Browser Back is not intercepted in the MVP.
- **Feed spec:** the change amends the `feed` spec "Taps reach the video player": it allows the small Recipe button over the video where the unmute button is over it (or beside the video, above the unmute button, in the band between the two switches) and the open sheet, which leaves the player's control zones free. The sheet is a layer above the video that catches taps outside the free zones, so the amendment must say so.
- **Changing the video with the sheet open:** a swipe that starts in a free control zone moves the feed, as swipes over the player do (REC-001); a swipe on the sheet only scrolls the recipe. The feed is not locked while the sheet is open (confirmed 2026-11-24).
- **Manual checks (E2E rule 13):** the player handling taps in the free zones, and the free zones' size, on a real phone.
- **Accessibility:** beyond the button's accessible name, keyboard and screen-reader support is out of this story (draft backlog D-21).
- **Playback:** opening or closing the sheet never changes playback or sound, and the sheet does not depend on playback state; hiding the tab changes nothing in it.
- **Related:** REC-007 (the auto-open applies wherever this sheet is used: it opens it), REC-003 (the unmute button's place).

Decisions 2026-11-25 (explore of REC-006, "All three", reopened for validation):
- **A band of windows between the two switches:** the unmute button goes over the video only when the screen is tall by aspect (3/4 or narrower); the recipe panel needs 260 px per side. A window such as 700x800 has the unmute button beside the video and the Recipe button and sheet (this story), because only 125 px remain per side. There the "Recipe" button sits directly above the unmute button in the right gutter, beside the video, not over it `(assumed)`. The sheet still covers the video's area, with the player's control zones free.
- **Left gutter for the panel:** REC-006 puts the always-open panel on the left, so the unmute button's right gutter stays free.
- **Fourth re-check (N1 to N8, "all A"):** the band placement stays `(assumed)` until the manual check, and the "Recipe" button's place is fixed whatever the sound state; the `playback` spec does not change. The unmute button stays visible and tappable above the sheet (a criterion was added; the player's free control zones still need the phone check). Thens with three results are accepted as at the limit. A resize with a title-only video active is covered by the existing criteria. REC-007 needs REC-006's panel through `blocked-by:REC-022` (REC-022 is `blocked-by:REC-006`), so it gets no flag of its own.
- **Second re-check (N2 to N5 A, "all A"):** "tall screen" is no longer used as a definition: every criterion says "no room for the panel" (less than 260 px per side, the same switch as REC-006, value `(assumed)`); criteria were added for a window narrowed across the threshold, the 255 px case, and the button's place beside the video in the band. The band placement stays `(assumed)` until checked on a real window. The `feed` amendment covers both placements of the button. Resize across the threshold behaves like a rotation.

### Estimation notes
M: a button placed relative to another control, a translucent sheet with free control zones (a layout risk tuned on a real phone), a feed spec amendment and the rotation change. Split from REC-006 by behavior. After the reopening of 2026-11-25 it has 23 criteria and a new layout case (the band of windows where the unmute button sits beside the video); the estimates of 5 predate that and are re-run after the criteria are approved.

AI estimate (2026-11-24, predates the reopening of 2026-11-25, its counts are stale (23 criteria now) and it is re-run after the criteria are approved): 5. Calibration: REC-006 (AI 3, team 3) is the base this story reuses (the panel and its content); REC-003 (team 5, AI 5) is the nearest for the hard part, because its unmute button placement needed several rounds of calibration on a real Android phone and desktop Chrome, and this story places a second button relative to that one. REC-018 (team 5) has a similar count of criteria (16 then, 23 now), though with more state logic. What is here: a button positioned above another control, a translucent sheet with free control zones for the player, 14 automatable criteria at the time (about 18 now) with E2E tests on the three projects, two manual checks, the rotation in both directions, and the `feed` spec amendment (a layer over the video that catches taps outside the free zones). Risks that move it: the placement and the free-zone sizes can only be settled on a real phone (REC-003 needed repeated passes, `(inferred)` from its history); and a swipe that starts in a free zone must move the feed while a swipe on the sheet must not (the same scroll-snap gesture area that REC-001 found sensitive); if either fights the existing feed it could go to 8. I have no information about the sheet's visual design, `(assumed)` plain. Size check: 5 matches `size:M` (3-5), no warning. This is one voice; the team's estimate comes from your discussion, not from averaging.

## REC-007 · Panel opens automatically after the first play-through
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:S, layer:frontend
- **PRD:** 5.3
- **Flags:** needs-human-validation; blocked-by:REC-022
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
- Given a phone in landscape showed the panel at the video's first end and I turned it to portrait, when the video reaches its next end, then the sheet does not open.
- Given a window showed the panel at the video's first end and I narrowed it until there is no room for the panel, when the video reaches its next end, then the sheet does not open.

### Technical context
A `needs_recipe` video has no recipe panel (decided 2026-11-17, `backlog/README.md` Decided 4; PRD 5.3).

Decisions 2026-11-24 (validation, first check 12 findings, "All A"):
- **Where the sheet is used (#1, #2, #12 A, reworded 2026-11-25):** with room for the panel beside the video the panel is always open (REC-006), so there is no auto-open there. Where there is no room for the panel the auto-open opens REC-022's sheet, so the story is `blocked-by:REC-022` (REC-006 is not needed). PRD 5.3 already says so.
- **What a view is (#5, #8 A):** a view starts when a video becomes the active one and ends when I swipe away; coming back is a new view (consistent with REC-003, which plays it from the beginning). The state is per tab and in memory only, like the sound state: a reload resets it. A view belongs to a slide (cycle plus YouTube ID, as the feed keys its slides), so a later cycle's slide of the same video is a new view, and an end event counts only for the slide that is active (re-check #13 A, 2026-11-25). The used state resets when the view ends, however the sheet was opened (#14 A).
- **At most once per view (#3, #4, #9 A):** the auto-open happens at most once per view and counts as used when the panel was already shown at the first end (a wide screen, or a sheet opened with the button). Closing by hand never makes it reopen, and opening the sheet by hand earlier in the view skips the auto-open. Rotation keeps the view's state; REC-022 still closes the sheet and shows the button when the phone turns to portrait. The auto-open applies only to the video that ended.
- **The count (#6, #7, #10 A):** it lives in the feed, per view and per YouTube ID, in memory, and uses the `videoended` event of the `playback` spec (every end, including each loop, with the video ID). Only an end of the active video counts; events of other videos, or late events after a swipe, are ignored. The first end counts however the first play went: a pause with the player's own control or a seek to the end that produces an end event counts, and a hidden tab produces no event, so the count does not advance. A video without a recipe never opens the sheet; only `needs_recipe` has none, because a `ready` video always has one (EXT-5).
- **Related:** REC-003 (the `videoended` event), REC-006 (the always-open panel), REC-022 (the sheet, its close button and the rotation).

Note 2026-11-25 (from the REC-006 re-check #11, reopened for a short re-check): "tall screen" in this story now means no room for the panel, REC-006's 260 px per side switch (`(assumed)` value), not the unmute button's aspect switch. The auto-open therefore also covers a narrow window where the recipe uses the button and the sheet. The criteria now say "no room for the panel" instead of "the screen is tall" and have one more criterion for a window narrowed after the panel was shown (second re-check of REC-006, N6 A, 2026-11-25).

### Estimation notes
S: small state machine on top of REC-003 (the `videoended` event) and REC-022 (the sheet). The meaning of "view" is decided (2026-11-24). With 10 criteria (after 2026-11-25) and the screen conditions the size S is re-checked at the estimate; the estimate of 3 is re-run after the criteria are approved.

AI estimate (2026-11-25, before the reopening's rewording; re-run after the criteria are approved; 10 criteria now): 3. Calibration: REC-006 (team 3) and REC-004 (team 3) are the nearest frontend stories on the feed with mostly existing pieces; REC-022 (team 5) is the story whose sheet this one opens, so this one is smaller. What is here: a per-slide, per-view state in the feed (a small state machine, which Vitest can cover without a browser), the `videoended` event that REC-003 already emits, and 9 criteria at the time (10 now) whose E2E tests reuse the fake player's `emitEnded` and a viewport change for rotation. Risks that move it: it depends on REC-022's way to open and close the sheet, which does not exist yet (`(assumed)` a simple open and close call), and the interplay with rotation and a hand-opened sheet is where bugs are likely; if REC-022's sheet state is awkward to drive from outside, it goes to 5. Size check: warning, 3 does not match `size:S` (1-2); the label is not changed, and the team may want to re-size it to M. This is one voice; the team's estimate comes from your discussion, not from averaging.

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
