# playback Specification

## Purpose
How the active video plays in the feed: it starts by itself, the home cook
turns sound on once per tab, it loops, and it is paused and resumed as the
video leaves the screen or the tab is hidden.

## Requirements

### Requirement: Autoplay muted
The active video SHALL start playing by itself, muted, when the home cook has
not turned sound on in this browser tab.

#### Scenario: A video becomes active with sound off
- **GIVEN** I have not turned sound on in this tab
- **WHEN** a video becomes the active one
- **THEN** it starts playing automatically
- **AND** it is muted

### Requirement: Unmute button
The feed SHALL show an unmute button while sound is off. Tapping it SHALL turn
sound on for the active video and remove the button. The button never turns
sound off: muting again is left to the YouTube player's own controls.

#### Scenario: Tap the unmute button
- **GIVEN** a video is playing muted and the unmute button is shown
- **WHEN** I tap the unmute button
- **THEN** the video plays with sound
- **AND** the unmute button is no longer shown

### Requirement: Sound carries over in this tab
Once sound is on in a tab, every video that becomes active in the same tab
SHALL play with sound, whether it is the next, the previous or a returning
one. The state is kept in memory only: a reload SHALL start muted again.

#### Scenario: Another video becomes active after turning sound on
- **GIVEN** I turned sound on in this tab
- **WHEN** another video becomes active
- **THEN** it plays with sound
- **AND** the unmute button is not shown

#### Scenario: Reload after turning sound on
- **GIVEN** I turned sound on in this tab
- **WHEN** I reload the page
- **THEN** the first video plays muted
- **AND** the unmute button is shown

### Requirement: Blocked unmuted autoplay falls back to muted
When sound is on in this tab and the browser does not let the video start with
sound, the video SHALL play muted and the unmute button SHALL be shown again.

#### Scenario: Browser blocks unmuted autoplay
- **GIVEN** I turned sound on in this tab and the browser blocks unmuted autoplay
- **WHEN** another video becomes active
- **THEN** it plays muted
- **AND** the unmute button is shown

### Requirement: Loop and end event
A video that reaches its end SHALL restart by itself, and the app SHALL be
told, with the video's ID, every time a video ends, including each loop.

#### Scenario: Video reaches the end
- **GIVEN** a video is playing
- **WHEN** it reaches the end
- **THEN** it restarts automatically
- **AND** the app is told that this video ended

### Requirement: Pause when swiped out of view
A video that leaves the screen SHALL be paused. When the home cook comes back
to it, it SHALL play again from the beginning.

#### Scenario: Swipe away from a playing video
- **GIVEN** a video is playing
- **WHEN** I swipe it out of view
- **THEN** it is paused

#### Scenario: Swipe back to a video
- **GIVEN** I swiped away from a video
- **WHEN** I swipe back to it
- **THEN** it plays again from the beginning

### Requirement: A pause made with the player's own control is kept
When the home cook pauses the video with the YouTube player's own control, the
video SHALL stay paused until the home cook plays it or leaves it.

#### Scenario: Pause with the player's control
- **GIVEN** I paused the video with the player's own control
- **WHEN** I stay on that video
- **THEN** it stays paused

#### Scenario: Hide and show the tab after pausing
- **GIVEN** I paused the video with the player's own control
- **WHEN** I hide the tab and return to it
- **THEN** the video is still paused

### Requirement: Pause when the tab is hidden
A playing video SHALL be paused when the browser tab is hidden, and SHALL play
again when the tab is visible, if it was playing when the tab was hidden.

#### Scenario: Tab is hidden while a video plays
- **GIVEN** a video is playing
- **WHEN** the browser tab is hidden
- **THEN** the video is paused

#### Scenario: Return to the tab
- **GIVEN** the tab was hidden while a video was playing
- **WHEN** I return to the tab
- **THEN** the video plays again

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

### Requirement: Unmute button placement
When there is room beside the video, the unmute button SHALL sit outside the
video, at its bottom right. When there is not (a tall phone screen), it SHALL
be a small transparent icon over the video's bottom-right corner, above the
YouTube player's control bar.

#### Scenario: Wide screen
- **GIVEN** the screen is wide enough to leave room beside the video
- **WHEN** the unmute button is shown
- **THEN** it is outside the video, at its bottom right

#### Scenario: Tall phone screen
- **GIVEN** the screen leaves no room beside the video
- **WHEN** the unmute button is shown
- **THEN** it is a transparent icon over the video's bottom-right corner

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
