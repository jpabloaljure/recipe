# Design

## Context

REC-006 added the always-open panel (`src/app/feed/RecipePanel.tsx`): one panel
next to the feed's scroll container, shown by the CSS rule
`@media (min-width: calc(56.25vh + 520px))` (at least 260 px per side). The feed
(`Feed.tsx`) is one full-viewport scroll-snap container; the active slide's
`.frame` (full height, 9/16, at most the screen's width) holds the iframe and,
while sound is off, the unmute button, which is over the video's bottom-right
corner (`bottom: 130px`, 44 px wide) when the aspect ratio is 3/4 or narrower
and beside it otherwise (`playback` spec, "Unmute button placement"). The recipe
arrives with each feed item. REC-022's decisions are in its Technical context
(2026-11-24 and 2026-11-25).

## Goals / Non-Goals

**Goals:**
- A "Recipe" button over the video above the unmute button's place, and a sheet
  that shows the panel's content over the video, where there is no room for the
  panel and the unmute button is over the video.
- A sheet that never moves the feed when swiped, leaves the player's control
  zones free, and swaps with the panel when the screen changes shape.

**Non-Goals:**
- The button's place beside the video in the band of windows between the two
  switches (REC-023), the auto-open (REC-007), and accessibility beyond the two
  names (draft D-21).

## Decisions

### Decision 1: The sheet is a sibling of the feed's scroll container

The sheet is rendered next to `.feed` and positioned `fixed` over the video's
column (`left: 50%; transform: translateX(-50%); width: min(56.25dvh, 100vw)`),
with its top and bottom edges at two CSS variables that leave the player's
control zones free. A sheet inside the slide would be a descendant of the
scroll-snap container: a swipe on a short recipe (nothing to scroll) would chain
to the feed and move it. As a sibling it cannot, the same reason as the panel
(REC-006 Decision 1), and `overscroll-behavior: contain` is only a second
guard. Alternative: the sheet inside `.frame` (it would sit in the same stacking
context as the unmute button for free, but the touch chaining above makes
"a swipe on the sheet never moves the feed" unreliable on a short recipe).

### Decision 2: Free zones are two CSS variables, assumed

The sheet's top and bottom edges are `--sheet-top: 72px` and
`--sheet-bottom: 130px` `(assumed)`: the player's title overlay at the top, and
its control bar at the bottom (REC-003 measured about 115 to 120 px on real
phones, and put the unmute icon at 130 px). Both are tuned in the manual check on
a real phone, which is also the only check of the free zones themselves
(E2E rule 13: the player's own layout).

### Decision 3: CSS shows and hides, JavaScript only resets

What is shown is decided by media queries, so there is no flash of the wrong
layout on first paint: the sheet is `display: none` when the panel's query
matches; the "Recipe" button is `display: none` unless
`(max-aspect-ratio: 3/4) and not (min-width: calc(56.25vh + 520px))` (the unmute
button is over the video, and there is no room for the panel; the band is
REC-023's). `window.matchMedia` with the panel's query (one exported constant,
`PANEL_MEDIA_QUERY`, repeated in the CSS and guarded by a unit test) only
closes the sheet when the result changes in either direction, so turning back
does not bring a stale open sheet.

### Decision 4: Sheet state lives in `Feed`, with open and close calls

`Feed` holds `sheetOpen`, with `openSheet` and `closeSheet` callbacks (REC-007
will call `openSheet` at a video's first end). It also closes when `activeKey`
changes and when the panel's query changes. The sheet's content is rendered only
while it is open, so each opening mounts a new body, scrolled to the top.
Alternative: keep it mounted and reset `scrollTop` (a frame where the old
position shows).

### Decision 5: One content component for the panel and the sheet

`RecipeContent` (servings, ingredients, steps, source label and link, with the
text rules of `recipe-text.ts`) is extracted from `RecipePanel` and used by both,
so the two cannot drift apart: the same missing-item rules, label and link.

### Decision 6: The unmute button stays above the sheet

`.unmute` gets `z-index: 2` and the sheet `z-index: 1`, so the unmute button
stays visible and tappable above the sheet (REC-006's fourth re-check). It is in
the root stacking context, because `.feed` does not create one; an E2E click on
the unmute button with the sheet open checks it. The sheet's body has extra
bottom padding so the last lines are never under the button.

### Decision 7: The "Recipe" button and the close button

The button is positioned like the unmute button, absolutely inside the active
frame: `right: 8px; bottom: calc(130px + 44px + 8px)`, 44 px, transparent, with
an inline SVG icon (no new library) and `aria-label="Recipe"`; it is rendered
for the active slide when it has a recipe and the sheet is closed. The sheet's
close button is 44 px, top right of the sheet, `aria-label="Close recipe"`.

### Decision 8: Two feed amendments

"Taps reach the video player" allows the "Recipe" button and the open sheet (the
sheet covers a layer over the video, but leaves the free zones). "One video per
gesture" says a gesture that starts on the sheet scrolls only the recipe. The
story's Technical context lists only the first amendment; the second is needed
for the same reason (the sheet is a layer over the video that catches swipes),
and is flagged here for review.

### Decision 9: No ADR and no C4 diagram change

No external system, container or major component is added. The "Recipe panel"
component's description in C4 level 3 is updated to mention the sheet.

## Risks / Trade-offs

- A swipe on the sheet or in a free zone might behave differently on a real
  phone (the sibling placement should hold, but only a device shows it): manual
  checks on the owner's Honor phone in portrait, with a short and a long recipe.
- The two free-zone values and the button's offset are `(assumed)`; the player's
  own layout can differ by phone and YouTube version.
- Media queries use `vh` while the feed uses `100dvh`, so a mobile browser bar
  that changes the height near a threshold may flip the button or the panel
  (accepted for REC-006, accepted here).
- The sheet is positioned from the viewport, not from the frame: on a phone with
  a display cutout in portrait the slide's safe-area padding could move the
  frame a few pixels from the sheet (not checked).
- Until REC-023 ships, a window in the band has neither the panel nor the button.
- The placeholder recipes in production carry source `description` (draft D-22).
