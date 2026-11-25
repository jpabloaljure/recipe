# Proposal

## Why

REC-006 put the recipe in a panel beside the video where there are at least
260 px on each side, so a phone in portrait still shows no recipe (PRD 5.3,
goal G2). REC-022 is validated (`Flags: split-from:REC-006; blocked-by:REC-006`,
`Estimate: 8`, re-validated 2026-11-25) and REC-006, the story it waited for,
is done. REC-022 is the same recipe as a sheet the home cook opens from a
"Recipe" button, for screens with no room beside the video.

## What Changes

- Where there is no room for the panel and the unmute button is over the video
  (a phone in portrait), a small transparent **"Recipe" button** sits directly
  above where the unmute button sits, and keeps its place when the unmute button
  is hidden. It has the accessible name "Recipe". It is not shown while the
  sheet is open, for a title-only video, or where the panel is shown.
- Tapping it opens a **sheet**: a full-height, semi-transparent black layer that
  covers only the video's area and lets the video show dimly behind it. It shows
  the same content as the panel (servings, ingredients with quantities, numbered
  steps, the source label and link, missing items left out), always opened
  scrolled to the top, with no extra request.
- The sheet leaves the player's control zones at the top and at the bottom free,
  so the YouTube controls stay tappable and a swipe that starts in a free zone
  still moves the feed. The unmute button stays visible and tappable above the
  sheet.
- A **close button** ("Close recipe") is the only way to close the sheet; the
  video stays visible and playing and the "Recipe" button comes back. The sheet
  also closes when the active video changes.
- A swipe on the sheet scrolls only the recipe (also when it is short), never
  the feed.
- Turning the phone, or resizing a window, across the panel's 260 px switch swaps
  the sheet for the panel (the panel closes the sheet; the button and the sheet
  give way), and playback and sound never change.
- Whether the sheet is open is feed-level state with open and close calls, so
  REC-007 can open it at a video's first end.
- Tests: E2E for every automatable scenario on the three projects, with a shared
  recipe content component between the panel and the sheet.

This change implements **REC-022** only. REC-022 is not flagged
`needs-human-validation` (checked 2026-11-26: `Flags: split-from:REC-006;
blocked-by:REC-006`, `Estimate: 8`).

Out of scope (owned by other stories): where the button sits beside the video,
in the band of windows between the unmute button's switch and the panel's switch
(REC-023, which is `blocked-by:REC-022`); the auto-open at the first end
(REC-007); keyboard and screen-reader support beyond the two accessible names
(draft D-21); real recipes in place of the placeholders (draft D-22).

## Capabilities

### New Capabilities

None.

### Modified Capabilities
- `recipe-panel`: adds the requirements of the Recipe button, the sheet and the
  swap between the panel and the sheet.
- `feed`: "Taps reach the video player" allows the "Recipe" button over the
  video and the open sheet (which leaves the player's control zones free), and
  "One video per gesture" says a gesture that starts on the sheet scrolls only
  the recipe.
