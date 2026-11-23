# Spec Delta

## MODIFIED Requirements

### Requirement: Taps reach the video player
The feed MUST NOT place any layer above the video that catches taps, so taps
on the video reach the embedded YouTube player. The only exception is the small
unmute icon on a tall phone screen (see `playback`), shown only while sound is
off and placed above the player's control bar.

#### Scenario: Tap on the video
- **GIVEN** a video is active
- **WHEN** I tap a control of the YouTube player
- **THEN** the YouTube player handles the tap
- **AND** the active video does not change

#### Scenario: Swipe that starts on the unmute icon
- **GIVEN** a video is active on a tall phone screen and the unmute icon is shown
- **WHEN** I swipe starting on the unmute icon
- **THEN** the feed moves by one video
