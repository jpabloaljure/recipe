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

## MODIFIED Requirements

### Requirement: Only the active video plays
Only the active video SHALL play for the home cook. The videos next to it SHALL
be muted and paused, with one exception: the next video MAY play muted, out of
sight, for about one second right after it becomes the neighbour, to load its
data (the warm-up), and SHALL then be paused at the start again. A warm-up
SHALL NOT make a sound, SHALL NOT report the video as ended and SHALL NOT run
while the tab is hidden.

#### Scenario: Neighbour videos are idle
- **GIVEN** a video is active and playing and its next video has finished its warm-up
- **WHEN** I look at the videos before and after it
- **THEN** they are paused
- **AND** they are muted

#### Scenario: The next video is warmed up
- **GIVEN** a video has just become active
- **WHEN** the player of its next video is ready
- **THEN** that video plays muted for about one second
- **AND** it is then paused at the start again

#### Scenario: No warm-up in a hidden tab
- **GIVEN** the tab is hidden
- **WHEN** the player of the next video is ready
- **THEN** that video is not played
