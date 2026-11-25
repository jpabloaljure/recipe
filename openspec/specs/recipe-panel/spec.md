# recipe-panel Specification

## Purpose
The written recipe of the active video, shown in a panel beside the video on
screens with room for it: when the panel appears, what it shows, how it
follows the active video and how its scrolling stays apart from the feed's.

## Requirements

### Requirement: The panel is open beside the video when there is room
When the room beside the video is at least 260 px on each side, the recipe
panel SHALL be open to the left of the video, with no "Recipe" button and no
close control. The room on each side is the screen width minus the video's
width, divided by two; the video is as tall as the screen and 9/16 as wide.
Where there is less room the panel SHALL NOT be shown (the "Recipe" button and
the sheet are a separate requirement set).

#### Scenario: Desktop window
- **GIVEN** a desktop window with room for the panel and the active video has a recipe
- **WHEN** the video becomes active
- **THEN** the recipe panel is open to the left of the video
- **AND** there is no "Recipe" button and no close control

#### Scenario: Phone in landscape with room
- **GIVEN** a phone in landscape with room for the panel and the active video has a recipe
- **WHEN** the video becomes active
- **THEN** the recipe panel is open to the left of the video

#### Scenario: Exactly 260 px of room
- **GIVEN** the room beside the video is exactly 260 px on each side and the active video has a recipe
- **WHEN** the video becomes active
- **THEN** the recipe panel is open to the left of the video

#### Scenario: 255 px of room
- **GIVEN** the room beside the video is 255 px on each side and the active video has a recipe
- **WHEN** the video becomes active
- **THEN** the recipe panel is not shown

#### Scenario: Widen a window
- **GIVEN** a window with no room for the panel
- **WHEN** I widen it until there is room for the panel
- **THEN** the recipe panel opens to the left of the video
- **AND** playback and sound do not change

### Requirement: The panel does not cover the video or the unmute button
With the panel open, the video SHALL stay exactly centered and uncovered, and
the unmute button SHALL stay visible to the right of the video, not overlapped
by the panel.

#### Scenario: The video stays centered
- **GIVEN** the recipe panel is open
- **WHEN** the video becomes active
- **THEN** the video stays exactly centered
- **AND** the panel does not cover it

#### Scenario: The unmute button stays visible
- **GIVEN** sound is off and the recipe panel is open
- **WHEN** the video becomes active
- **THEN** the unmute button is visible to the right of the video
- **AND** the panel does not overlap it

### Requirement: The panel shows the recipe's content
The panel SHALL show the active video's servings, its ingredients with their
quantities and its numbered steps, with no extra network request (the recipe
arrives with the feed item). A missing serving size, quantity or unit SHALL be
left out, with no empty label.

#### Scenario: The recipe is shown
- **GIVEN** the screen has room for the panel and the active video has a recipe
- **WHEN** the video becomes active
- **THEN** the panel shows servings, ingredients with their quantities and numbered steps

#### Scenario: No extra request
- **GIVEN** the screen has room for the panel and the active video has a recipe
- **WHEN** the video becomes active
- **THEN** its recipe is shown with no extra network request

#### Scenario: A missing serving size or quantity
- **GIVEN** the screen has room for the panel and the active video's recipe has a missing serving size or quantity
- **WHEN** the video becomes active
- **THEN** the missing item is left out, with no empty label

### Requirement: The panel names the recipe's source
A label SHALL name where the recipe came from (description, comment or
captions), and a link SHALL open the original YouTube video in a new tab.

#### Scenario: The source label
- **GIVEN** the screen has room for the panel and the active video has a recipe
- **WHEN** the video becomes active
- **THEN** a label shows the source of the recipe (description, comment or captions)

#### Scenario: The source link
- **GIVEN** the recipe panel shows a recipe
- **WHEN** I select the source link
- **THEN** the original YouTube video opens in a new tab

### Requirement: The panel follows the active video
When the active video changes, the panel SHALL show the new video's recipe,
scrolled to the top, at the moment the new video becomes active. For a
title-only video the panel area SHALL be empty and the video SHALL stay
centered.

#### Scenario: Another video becomes active
- **GIVEN** the recipe panel is open to the left of the video and I scrolled its recipe
- **WHEN** the active video changes
- **THEN** the panel shows the new video's recipe, scrolled to the top, at the moment the new video becomes active

#### Scenario: A title-only video
- **GIVEN** the screen has room for the panel
- **WHEN** a title-only video becomes active
- **THEN** the panel area is empty
- **AND** the video stays centered

### Requirement: Scrolling over the panel never moves the feed
A wheel, trackpad or touch gesture over the recipe panel SHALL scroll only the
recipe, also when the recipe is shorter than the panel or the scroll has
reached its end, and SHALL NOT move the feed.

#### Scenario: A recipe taller than the panel
- **GIVEN** the recipe panel is open to the left of the video and the recipe is taller than the panel
- **WHEN** I scroll over it with the wheel, trackpad or touch
- **THEN** only the recipe scrolls
- **AND** the feed does not move, and I can reach the last step

#### Scenario: A recipe shorter than the panel
- **GIVEN** the recipe panel is open to the left of the video and the recipe is shorter than the panel
- **WHEN** I scroll over it with the wheel, trackpad or touch
- **THEN** the feed does not move

#### Scenario: A swipe that starts on the panel on a phone (manual)
- **GIVEN** the recipe panel is open on a phone in landscape
- **WHEN** I swipe vertically starting on the panel
- **THEN** the active video does not change
