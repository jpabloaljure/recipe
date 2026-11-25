# Design

## Context

The feed (`src/app/feed/Feed.tsx`, `Feed.module.css`) is one full-viewport
scroll container, `.feed` (`100dvh`, `overflow-y: scroll`, scroll-snap, `overscroll-behavior-y: contain`), with one
`.slide` per video. A slide centers its `.frame` (height 100%, aspect ratio 9/16),
and the unmute button sits in the right gutter, `left: calc(100% + 16px)` of the
frame (`playback` spec, "Unmute button placement"). The left gutter is free.
Each feed item already carries its recipe (`FeedItem.recipe`, `Recipe` in
`src/lib/feed/types.ts`, API-1), and `activeIndex` in `Feed` changes at the
same moment as `data-active`. Production has 21 placeholder recipes (draft
D-22); the E2E helper `videos()` gives every item `recipe: null`.
The decisions behind this change are in REC-006's Technical context
(2026-11-24 and 2026-11-25) and in `backlog/README.md` Decided 6.

## Goals / Non-Goals

**Goals:**
- Show the active video's recipe in a panel to the left of the video when there
  are at least 260 px on each side, with the video centered and uncovered.
- Keep the panel's scrolling apart from the feed's, and switch the layout
  without a flash of the wrong one.

**Non-Goals:**
- The "Recipe" button, the sheet, rotation and window narrowing (REC-022), and
  the band where the unmute button is beside the video (REC-023).
- Auto-open (REC-007), deep links (REC-014), favorites, keyboard and
  screen-reader support beyond a labelled landmark (draft D-21).

## Decisions

### Decision 1: One panel, a sibling of the feed's scroll container

A single `RecipePanel` is rendered next to `.feed`, not inside each slide, and
positioned over the left gutter (`position: fixed`, left offset
`env(safe-area-inset-left)` plus 16 px). Because it is not a descendant of the
scroll-snap container, a wheel, trackpad or touch over it can only scroll the
panel (`overflow-y: auto`, `overscroll-behavior: contain`) and never the feed,
also when the recipe is short. Alternatives: one panel per slide inside the
scroller (a wheel over it can chain to the snap container, and 3 copies are
alive at once); a column in a grid around the feed (it would shrink the feed's
width and move the video off-center).

### Decision 2: The switch is a CSS media query

The panel is shown when `(min-width: calc(56.25vh + 520px))` matches: the room
per side is (width minus 9/16 of the height) divided by two, so at least 260 px
on each side is `width >= 56.25vh + 520px`, an inclusive boundary. Chrome 156
parses and matches this query (checked on 2026-11-25). Below it the panel is
`display: none`, so REC-022 can show its own controls. Alternatives: a
`ResizeObserver` in JavaScript (a first paint with the wrong layout, then a
re-render); reusing the unmute switch (`max-aspect-ratio: 3/4`), which was
reversed on 2026-11-25. Known limits, accepted: media queries use `vh` while the
feed uses `100dvh`, so a mobile browser bar that changes the height near the
threshold may flip the panel; the safe-area insets of a phone in landscape are
not part of the formula.

### Decision 3: Width, margins and maximum

The panel's width is the room on one side minus a 16 px margin on each side
(228 px at exactly 260 px of room), at most 400 px, centered vertically in the
left gutter, with its own scroll when the recipe is taller than the screen.
Alternative: a fixed width (it would overlap the video below 260 px of room).
The 16 px and the 400 px are `(assumed)` and tuned in the manual check.

### Decision 4: The content follows `activeIndex`, and the scroll resets by remount

`Feed` passes `slides[activeIndex]?.item.recipe` and the video's YouTube ID to
the panel. The panel's scrollable body is keyed by the YouTube ID, so a new
active video mounts a new body, scrolled to the top, in the same render as
`data-active`. A title-only video passes `null` and the panel is `hidden`, so
its area is empty. Alternative: reset `scrollTop` in an effect (a frame where
the old scroll position shows).

### Decision 5: Text rules are pure functions

`src/lib/feed/recipe-text.ts` holds the rules a unit test can check: an
ingredient line leaves out a missing quantity or unit (`[quantity] [unit]
name`), servings are left out when `null`, and the source label wording is
"Recipe from the description", "Recipe from the top comment" or "Recipe from
the captions" (confirmed 2026-11-24). The label links to
`https://www.youtube.com/watch?v=<id>` with `target="_blank"` and
`rel="noopener noreferrer"`; the app tab's video pauses by the existing
hidden-tab rule when the new tab takes focus.

### Decision 6: Markup and testing hooks

The panel is an `<aside>` with the accessible name "Recipe", with `ul` for the
ingredients and `ol` for the steps, and `data-testid="recipe-panel"`. Nothing
more for accessibility (draft D-21). E2E tests stub recipes through a new
helper next to `videos()`, and use custom viewports for the boundary on the
`desktop` project: 970x800 is exactly 260 px of room (panel), 960x800 is 255 px
(no panel). `phone-landscape` (915x412, 342 px) and `desktop` (1280x800,
415 px) have the panel; `phone-portrait` (412x915) does not.

### Decision 7: No ADR and no C4 diagram change

No external system, container or major component is added. The "Recipe panel"
component is already in C4 level 3 for the web app; its description (it says
"auto-open") is updated in this change.

## Risks / Trade-offs

- A swipe that starts on the panel might still move the feed on a real phone
  in landscape. The sibling placement should prevent it, but only a real device
  shows it (E2E rule 13): it is a manual check, and the first thing to look at
  after the code exists.
- The 260 px threshold, the 16 px margin and the 400 px maximum are `(assumed)`
  and tuned on real windows and a real phone (the panel's width at exactly 260
  px is 228 px: check that it reads well).
- Until REC-022 and REC-023 ship, screens without room for the panel (a phone
  in portrait, a narrow window, small phones in landscape) show no recipe at
  all. Accepted on 2026-11-25.
- The placeholder recipes in production carry source `description`, so the
  label is wrong for them until draft D-22 replaces them.
- The E2E projects cannot show every aspect ratio; the boundary uses custom
  viewports, and the band is REC-023's.
