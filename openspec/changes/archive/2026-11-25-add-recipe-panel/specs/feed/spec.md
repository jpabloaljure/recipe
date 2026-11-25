## MODIFIED Requirements

### Requirement: One video per gesture
Each swipe or scroll gesture SHALL move the feed by exactly one video,
forward or backward, however hard the gesture is. Gestures made over the
video itself, or over the area beside it that the recipe panel does not cover,
SHALL move the feed; a gesture that starts on the recipe panel scrolls only the
recipe and SHALL NOT move the feed. Skipping a video that cannot play is not a
gesture and SHALL NOT move the feed by more than the one slot the skipped
video held.

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

#### Scenario: Swipe beside the video with the panel open
- **GIVEN** the screen has room for the recipe panel and a video that is not the last one is active
- **WHEN** I swipe forward over the area beside the video that the panel does not cover
- **THEN** the next video becomes active

### Requirement: Centered video on wide screens
When the screen is wider than the vertical video, the video SHALL keep its
vertical shape, fill the screen height and be centered horizontally. When the recipe panel is shown beside it, the video
SHALL stay centered and uncovered.

#### Scenario: Desktop
- **GIVEN** I am on desktop
- **WHEN** the feed is shown
- **THEN** the vertical video is centered on the screen

#### Scenario: Phone in landscape
- **GIVEN** I am on a phone in landscape
- **WHEN** the feed is shown
- **THEN** the vertical video is centered on the screen

#### Scenario: With the recipe panel
- **GIVEN** the screen has room for the recipe panel
- **WHEN** the feed is shown
- **THEN** the vertical video is centered on the screen
- **AND** the recipe panel is to its left and does not cover it
