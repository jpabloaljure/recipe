## ADDED Requirements

### Requirement: The first page shows its state
Until the first page has arrived, the feed SHALL show a loading indicator. If
the catalog has no video, it SHALL show a "No recipes yet" message. If the first
page request fails, does not answer within 10 seconds, or the home cook is
offline, it SHALL show an "Oops, something went wrong" message with a Retry
button. These messages replace the video area: no slide is shown while one of
them is.

#### Scenario: First page is loading
- **GIVEN** the first page has been requested and has not arrived
- **WHEN** the feed loads
- **THEN** a loading indicator is shown until the page arrives

#### Scenario: Empty catalog
- **GIVEN** the catalog has no video (`ready` or `needs_recipe`)
- **WHEN** the feed loads
- **THEN** a "No recipes yet" message is shown

#### Scenario: First page request fails
- **GIVEN** the first page request fails
- **WHEN** the feed loads
- **THEN** an "Oops, something went wrong" message and a Retry button are shown

#### Scenario: First page does not answer
- **GIVEN** the first page request does not answer within 10 seconds
- **WHEN** the feed loads
- **THEN** the same "Oops, something went wrong" message and Retry button are shown

#### Scenario: Offline
- **GIVEN** I am offline
- **WHEN** the feed loads
- **THEN** the same "Oops, something went wrong" message and Retry button are shown

#### Scenario: Retry the first page
- **GIVEN** the "Oops, something went wrong" message is shown
- **WHEN** I tap Retry
- **THEN** the feed requests the first page again and shows the loading indicator

#### Scenario: Retry is ignored while a request runs
- **GIVEN** the first page is being requested after a Retry
- **WHEN** I tap Retry again
- **THEN** no second request is made

### Requirement: An end slide while more pages remain
While more pages remain, the feed SHALL end with an ordinary slide after the
last loaded video, shown only when I reach it. It SHALL show a loading
indicator while the next page loads, and a retry row when the next page request
failed or did not answer within 10 seconds. Tapping the retry row SHALL request
the page again and show the loading indicator. A gesture past the end slide
SHALL leave it active.

#### Scenario: Next page is loading at the end
- **GIVEN** I am on the last loaded video and the next page is still loading
- **WHEN** I reach the end of the list
- **THEN** an end slide with a loading indicator is shown until the page arrives

#### Scenario: Next page failed at the end
- **GIVEN** I am on the last loaded video and the request for the next page failed
- **WHEN** I reach the end of the list
- **THEN** an end slide with a retry row is shown and the video above stays

#### Scenario: Next page did not answer
- **GIVEN** the request for the next page did not answer within 10 seconds
- **WHEN** I reach the end of the list
- **THEN** the same end slide with a retry row is shown

#### Scenario: Retry the next page
- **GIVEN** the end slide with the retry row is shown
- **WHEN** I tap the retry row
- **THEN** the feed requests the page again and the end slide shows a loading indicator

#### Scenario: Swipe past the end slide
- **GIVEN** the end slide is shown
- **WHEN** I swipe past it
- **THEN** the feed stays on the end slide and does not wrap

### Requirement: A video that cannot play is skipped
When a video is reported as removed, private or not embeddable (see `playback`),
the feed SHALL drop it from the visit's list, in every repeat of the list, and
the next video SHALL take its place. A neighbour that is reported before I reach
it SHALL be dropped before I reach it, and a video dropped after I have swiped
away SHALL be dropped silently. A dropped video comes back on the next visit.

#### Scenario: The active video cannot play
- **GIVEN** the active video was removed or is no longer embeddable
- **WHEN** it fails to load in the player
- **THEN** it is removed from the list and the next video takes its place

#### Scenario: The next video cannot play
- **GIVEN** the next video was removed or is no longer embeddable
- **WHEN** its player reports the error
- **THEN** it is removed from the list before I reach it

#### Scenario: A removed video on real YouTube (manual)
- **GIVEN** a feed that holds a removed video, a private video and a video with embedding off
- **WHEN** I swipe to each one on a real phone and on desktop
- **THEN** each is skipped and the next video takes its place

### Requirement: The watched video stays on screen when others are dropped
The video I am watching SHALL stay on screen whenever a video in an earlier
position of the list is dropped, also when I am in a later repeat of the list.

#### Scenario: An earlier video is removed
- **GIVEN** I am on a video in the second cycle of the list
- **WHEN** a video in an earlier position is removed
- **THEN** the video I am watching stays on screen

### Requirement: Repeated skips end in the error message
After 3 videos in a row were dropped, or when no video is left and no next page
exists, the feed SHALL show the "Oops, something went wrong" message with a
Retry button. A video that becomes active and plays, or a gesture that moves to another
video, ends the count of videos dropped in a row. Retry after such a message SHALL forget the videos dropped in
this visit and request the first page again.

#### Scenario: Three in a row
- **GIVEN** three videos in a row failed to load
- **WHEN** the third one fails
- **THEN** the "Oops, something went wrong" message and a Retry button are shown

#### Scenario: None left
- **GIVEN** every loaded video failed to load and no next page exists
- **WHEN** the last one fails
- **THEN** the "Oops, something went wrong" message and a Retry button are shown

#### Scenario: Retry after skipped videos
- **GIVEN** the "Oops, something went wrong" message is shown after skipped videos
- **WHEN** I tap Retry
- **THEN** the feed requests the first page again and videos skipped earlier in this visit are tried again

## MODIFIED Requirements

### Requirement: No autoscroll
The feed MUST NOT change the active video on its own, with one exception: a
video that cannot play is skipped and the next video takes its place (see "A
video that cannot play is skipped"). Otherwise only a user gesture moves the
feed.

#### Scenario: Video ends with no interaction
- **GIVEN** a video is playing
- **WHEN** it reaches the end
- **THEN** the same video stays active

#### Scenario: Active video cannot play
- **GIVEN** a video is active
- **WHEN** it is reported as removed or not embeddable
- **THEN** it is skipped and the next video becomes active

### Requirement: One video per gesture
Each swipe or scroll gesture SHALL move the feed by exactly one video,
forward or backward, however hard the gesture is. Gestures made over the
video itself SHALL move the feed. Skipping a video that cannot play is not a
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

### Requirement: Wrap to the start after the last video
When the last video of the catalog is active, a forward gesture SHALL make
the first video of this visit's feed order active. The visit's order is the
order in which the feed showed the videos since the page was opened. The feed
SHALL NOT wrap while more pages remain: it ends with the end slide until the
last page has arrived.

#### Scenario: Swipe past the last video
- **GIVEN** the last video in the catalog is active
- **WHEN** I swipe to the next video
- **THEN** the first video of this visit's feed order becomes active

#### Scenario: Catalog spans several pages
- **GIVEN** the catalog was loaded over more than one page
- **AND** the last video of the last page is active
- **WHEN** I swipe to the next video
- **THEN** the first video of this visit's feed order becomes active

#### Scenario: Keep swiping after the wrap
- **GIVEN** the feed has wrapped to the first video
- **WHEN** I swipe forward again
- **THEN** the second video of this visit's feed order becomes active

### Requirement: Next page loads ahead
The feed SHALL request the next page of the catalog when the active video is
within two slides of the last loaded video and more pages remain, so the
next videos are there before the home cook reaches them. A request that fails
or does not answer within 10 seconds SHALL be tried again silently on the next
trigger, and SHALL be shown at the end slide only when I reach the end.

#### Scenario: Approach the last loaded video
- **GIVEN** more pages remain
- **WHEN** the active video is within two slides of the last loaded video
- **THEN** the next page is requested
