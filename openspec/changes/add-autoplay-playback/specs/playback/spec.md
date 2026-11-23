# Spec Delta

## Purpose

How the active video plays in the feed: it starts by itself, the home cook
turns sound on once per tab, it loops, and it is paused and resumed as the
video leaves the screen or the tab is hidden.

## ADDED Requirements

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
Only the active video SHALL play. The videos next to it SHALL stay paused and
muted until they become active.

#### Scenario: Neighbour videos are idle
- **GIVEN** a video is active and playing
- **WHEN** I look at the videos before and after it
- **THEN** they are paused
- **AND** they are muted

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
