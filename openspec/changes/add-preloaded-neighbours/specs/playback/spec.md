## ADDED Requirements

### Requirement: Few players stay alive
The app SHALL keep at most three video players alive at once: the active
video's, the previous video's and the next video's. A video without a
neighbour on one side (the first video) has fewer.

#### Scenario: Swipe through the feed
- **GIVEN** I am on a video in the middle of the feed
- **WHEN** I swipe to the next video
- **THEN** at most three players are alive once the swipe has settled

#### Scenario: First video
- **GIVEN** the feed has just opened on its first video
- **WHEN** I look at the players that are alive
- **THEN** there are two: the first video's and the next video's

### Requirement: The next video starts from its ready player
The video I swipe to SHALL be played by the player its slide already had while
it was a neighbour, so it does not need to create or load a player at the
moment of the swipe. It SHALL be playing within 500 ms of the end of the
gesture on a mid-range phone (PERF-3).

#### Scenario: Swipe to the next video
- **GIVEN** the next video has a player that is ready and paused
- **WHEN** I swipe to it
- **THEN** that same player becomes the playing one

#### Scenario: The next video starts within 500 ms (manual)
- **GIVEN** I am on a video on a real mid-range phone
- **WHEN** I swipe to the next video
- **THEN** it is playing within 500 ms of the end of the gesture
