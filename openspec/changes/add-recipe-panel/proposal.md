# Proposal

## Why

The feed shows videos and, since 2026-11-25, production holds recipes for 21 of
them (placeholders, draft D-22), but nothing shows a recipe: the home cook can
only watch (PRD 5.3, goal G2). REC-006 is validated (`Flags: —`, `Estimate: 5`,
re-validated 2026-11-25) and is the first story of the recipe panel. On a
screen with room beside the video the panel is simply open, with no button;
the screens without that room are REC-022 (the sheet) and REC-023 (the band).

## What Changes

- A **recipe panel** appears to the left of the centered video whenever there
  are at least 260 px of room on each side of it (a desktop window, a larger
  phone in landscape). It shows the active video's servings, ingredients with
  their quantities, numbered steps, a label with the recipe's source and a link
  that opens the original video in a new tab. It has no button and no close
  control.
- The panel follows the active video: its content changes, scrolled to the top,
  at the moment the new video becomes active. For a title-only (`needs_recipe`)
  video its area is empty and the video stays centered.
- A wheel, trackpad or touch gesture over the panel scrolls only the recipe and
  never moves the feed; a gesture over the rest of the screen still moves the
  feed by one video.
- The video stays exactly centered and uncovered, and the unmute button stays
  visible in the right gutter.
- The recipe arrives with each feed item (API-1), so there is no extra request
  (PERF-4).
- The switch is a CSS rule, so there is no flash of the wrong layout on first
  paint, and a window widened across the threshold shows the panel with no
  change to playback or sound.
- Tests: recipe stubs for the E2E feed helper, unit tests of the text rules
  (a missing quantity or serving size is left out, the label wording) and E2E
  tests on the three projects, with the boundary tested at 260 px and 255 px.

This change implements **REC-006** only. REC-006 is not flagged
`needs-human-validation` (checked 2026-11-25: `Flags: —`, `Estimate: 5`).

Out of scope (owned by other stories): the "Recipe" button and the sheet where
there is no room for the panel, rotation and window narrowing (REC-022); the
band of windows where the unmute button is beside the video but there is no
room for the panel (REC-023); the auto-open at the first end (REC-007); a
deep link that lands on a recipe (REC-014); favorites (REC-011, REC-012);
keyboard and screen-reader support beyond a labelled landmark (draft D-21);
real recipes in place of the placeholders (draft D-22).

## Capabilities

### New Capabilities
- `recipe-panel`: the recipe panel shown beside the video when there is room:
  when it appears, what it shows, how it follows the active video and how its
  scrolling stays apart from the feed's.

### Modified Capabilities
- `feed`: "One video per gesture" gets one exception (a gesture that starts on
  the recipe panel does not move the feed; gestures over the rest of the screen
  still do), and "Centered video on wide screens" says the video stays centered
  and uncovered when the panel is beside it.
