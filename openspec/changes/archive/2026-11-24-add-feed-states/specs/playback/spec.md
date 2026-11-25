## ADDED Requirements

### Requirement: The player reports videos that cannot play
The app SHALL treat the YouTube player errors 100 (removed or private), 101 and
150 (embedding not allowed) of any video it holds a player for, active or
neighbour, as "this video cannot play", and report it to the feed. Any other
error code SHALL NOT be reported as such and SHALL leave the video as it is.

#### Scenario: Removed video
- **GIVEN** a video's player exists
- **WHEN** the player reports error 100
- **THEN** the video is reported as one that cannot play

#### Scenario: Embedding not allowed
- **GIVEN** a video's player exists
- **WHEN** the player reports error 101 or 150
- **THEN** the video is reported as one that cannot play

#### Scenario: Another error code
- **GIVEN** a video's player exists
- **WHEN** the player reports an error code other than 100, 101 or 150
- **THEN** the video is not reported as one that cannot play

#### Scenario: Neighbour error on load (manual)
- **GIVEN** the next video was removed
- **WHEN** its player is created as a neighbour of the active video
- **THEN** its error is reported before I swipe to it
