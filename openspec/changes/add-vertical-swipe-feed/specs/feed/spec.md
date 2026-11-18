# Spec Delta

## Purpose

The vertical video feed the home cook browses: one full-screen video at a
time, moved by the user's own swipes or scrolls, with predictable behavior at
the start and end of the catalog and on every screen shape.

## ADDED Requirements

### Requirement: One full-screen video at a time
The feed SHALL show exactly one video as the active video, filling the
viewport height, with the previous and next videos out of view.

#### Scenario: Feed loads on a phone in portrait
- **GIVEN** I open the app on a phone in portrait
- **WHEN** the feed loads
- **THEN** one full-screen vertical video is shown
- **AND** no other video is visible

### Requirement: No autoscroll
The feed MUST NOT change the active video on its own. Only a user gesture
moves the feed.

#### Scenario: Video ends with no interaction
- **GIVEN** a video is active and I do not interact
- **WHEN** it reaches the end
- **THEN** the same video stays active

### Requirement: One video per gesture
Each swipe or scroll gesture SHALL move the feed by exactly one video,
forward or backward, however hard the gesture is. Gestures made over the
video itself SHALL move the feed.

#### Scenario: Swipe to the next video
- **GIVEN** a video that is not the last one is active
- **WHEN** I swipe or scroll forward
- **THEN** the next video becomes active

#### Scenario: Swipe to the previous video
- **GIVEN** a video that is not the first one is active
- **WHEN** I swipe or scroll backward
- **THEN** the previous video becomes active

#### Scenario: Hard flick
- **GIVEN** a video is active
- **WHEN** I flick hard forward
- **THEN** only the next video becomes active, with no video skipped

#### Scenario: Swipe that starts on the video
- **GIVEN** a video is active
- **WHEN** I swipe forward starting on the video picture
- **THEN** the next video becomes active

### Requirement: Taps reach the video player
The feed MUST NOT place any layer above the video that catches taps, so taps
on the video reach the embedded YouTube player.

#### Scenario: Tap on the video
- **GIVEN** a video is active
- **WHEN** I tap a control of the YouTube player
- **THEN** the YouTube player handles the tap
- **AND** the active video does not change

### Requirement: Centered video on wide screens
When the screen is wider than the vertical video, the video SHALL keep its
vertical shape, fill the screen height and be centered horizontally.

#### Scenario: Desktop
- **GIVEN** I am on desktop
- **WHEN** the feed is shown
- **THEN** the vertical video is centered on the screen

#### Scenario: Phone in landscape
- **GIVEN** I am on a phone in landscape
- **WHEN** the feed is shown
- **THEN** the vertical video is centered on the screen

### Requirement: Wrap to the start after the last video
When the last video of the catalog is active, a forward gesture SHALL make
the first video of this visit's feed order active. The visit's order is the
order in which the feed showed the videos since the page was opened.

#### Scenario: Swipe past the last video
- **GIVEN** the last video in the catalog is active
- **WHEN** I swipe to the next video
- **THEN** the first video of this visit's feed order becomes active

#### Scenario: Catalog spans several pages
- **GIVEN** the catalog was loaded over more than one page
- **AND** the last video of the last page is active
- **WHEN** I swipe to the next video
- **THEN** the first video of the first page becomes active

#### Scenario: Keep swiping after the wrap
- **GIVEN** the feed has wrapped to the first video
- **WHEN** I swipe forward again
- **THEN** the second video of this visit's feed order becomes active

### Requirement: No backward wrap on the first video
A backward gesture on the first video of the visit SHALL leave it active.

#### Scenario: Swipe back on the first video
- **GIVEN** the first video of the visit is active
- **WHEN** I swipe or scroll backward
- **THEN** the first video stays active

### Requirement: Supported browsers
The feed behavior in this spec SHALL hold in Chrome on Android and Chrome on
desktop. Other browsers are not supported in the MVP.

#### Scenario: Chrome on Android
- **GIVEN** I use Chrome on an Android phone
- **WHEN** I browse the feed
- **THEN** every scenario in this spec holds
