## MODIFIED Requirements

### Requirement: One video per gesture
Each swipe or scroll gesture SHALL move the feed by exactly one video,
forward or backward, however hard the gesture is. Gestures made over the
video itself, or over the area beside it that the recipe panel does not cover,
SHALL move the feed; a gesture that starts on the recipe panel or on the recipe sheet scrolls only
the recipe and SHALL NOT move the feed. Skipping a video that cannot play is not a
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

### Requirement: Taps reach the video player
The feed MUST NOT place any layer above the video that catches taps, so taps
on the video reach the embedded YouTube player. The exceptions are the small
unmute icon (shown only while sound is off) and the small "Recipe" button on a tall phone screen (see
`playback` and `recipe-panel`), placed above the player's control bar, and the
open recipe sheet, which covers only the video's area and leaves the player's
control zones at the top and at the bottom free.

#### Scenario: Tap on the video
- **GIVEN** a video is active
- **WHEN** I tap a control of the YouTube player
- **THEN** the YouTube player handles the tap
- **AND** the active video does not change

#### Scenario: Swipe that starts on the unmute icon
- **GIVEN** a video is active on a tall phone screen and the unmute icon is shown
- **WHEN** I swipe starting on the unmute icon
- **THEN** the feed moves by one video
