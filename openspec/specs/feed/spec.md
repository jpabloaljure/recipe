# feed Specification

## Purpose
The vertical video feed the home cook browses: one full-screen video at a
time, moved by the user's own swipes or scrolls, with predictable behavior at
the start and end of the catalog and on every screen shape.

## Requirements

### Requirement: One full-screen video at a time
The feed SHALL show exactly one video as the active video, filling the
viewport height, with the previous and next videos out of view.

#### Scenario: Feed loads on a phone in portrait
- **GIVEN** I open the app on a phone in portrait
- **WHEN** the feed loads
- **THEN** one full-screen vertical video is shown
- **AND** no other video is visible

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

### Requirement: No backward wrap on the first video
A backward gesture on the first video of the visit SHALL leave it active.

#### Scenario: Swipe back on the first video
- **GIVEN** the first video of the visit is active
- **WHEN** I swipe or scroll backward
- **THEN** the first video stays active

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

### Requirement: Supported browsers
The feed behavior in this spec SHALL hold in Chrome on Android and Chrome on
desktop. Other browsers are not supported in the MVP.

#### Scenario: Chrome on Android
- **GIVEN** I use Chrome on an Android phone
- **WHEN** I browse the feed
- **THEN** every scenario in this spec holds

### Requirement: Feed contains ready and title-only videos
The feed SHALL contain only videos whose status is `ready` or
`needs_recipe`. A `ready` video SHALL come with its recipe; a `needs_recipe`
video SHALL come with its title and no recipe.

#### Scenario: Mixed statuses
- **GIVEN** videos with the statuses `ready`, `needs_recipe`, `not_easy`, `unavailable` and `rejected`
- **WHEN** the feed is requested
- **THEN** only the `ready` and `needs_recipe` videos are returned
- **AND** each `ready` video includes its recipe and each `needs_recipe` video has no recipe

### Requirement: Feed pages are newest first
The feed SHALL return videos in pages of at most 10, newest first by the
time they entered the feed. A page requested after another SHALL hold only
videos that entered the feed at the same time as or earlier than those on the
previous page, and SHALL NOT repeat any video of it. Walking every page SHALL
return each video of the feed exactly once, also when several videos entered
at the same time.

#### Scenario: Second page
- **GIVEN** the first page of the feed has been returned
- **WHEN** the second page is requested
- **THEN** every video on it entered the feed at the same time as or earlier than those on the first page
- **AND** none of them appears on the first page

#### Scenario: Videos entering mid-visit
- **GIVEN** the first page of the feed has been returned
- **AND** a new video enters the feed
- **WHEN** the second page is requested
- **THEN** no video is repeated and no video that was already in the feed is skipped

### Requirement: The last page says there are no more pages
The feed SHALL report that there are no more pages on the last page,
including when the last videos fill a page exactly, and SHALL return an empty
last page, with no error, for a request that points past the end of the feed
or when the feed has no videos.

#### Scenario: Last page
- **GIVEN** the last videos of the feed are on the requested page
- **WHEN** the page is returned
- **THEN** it reports that there are no more pages

#### Scenario: Last videos fill a page exactly
- **GIVEN** the last videos of the feed exactly fill a page
- **WHEN** that page is returned
- **THEN** it reports that there are no more pages

#### Scenario: No videos in the feed
- **GIVEN** there are no `ready` or `needs_recipe` videos
- **WHEN** the first page is requested
- **THEN** an empty list is returned that reports no more pages

#### Scenario: Request past the end of the feed
- **GIVEN** a valid request for videos after a position where no videos remain
- **WHEN** the page is requested
- **THEN** an empty list is returned that reports no more pages

### Requirement: Invalid page requests are rejected
The feed SHALL reject a page request whose position cannot be understood
with a client error, and SHALL answer with a server error, not a made-up
page, when the catalog cannot be read.

#### Scenario: Position that cannot be understood
- **GIVEN** a page request whose cursor cannot be decoded
- **WHEN** it is served
- **THEN** the response is a client error with the `invalid_cursor` code

#### Scenario: Catalog cannot be read
- **GIVEN** the database cannot be read
- **WHEN** a page is requested
- **THEN** the response is a server error with the `internal_error` code

### Requirement: Feed pages are cacheable, errors and empty pages are not
The feed SHALL let a CDN cache a page that has at least one video, first or
later, for 1 hour. An empty page and every client or server error response
SHALL NOT be cached.

#### Scenario: First page with videos
- **GIVEN** the first page has at least one video
- **WHEN** it is served
- **THEN** it can be cached for 1 hour

#### Scenario: Later page with videos
- **GIVEN** a later page has at least one video
- **WHEN** it is served
- **THEN** it can be cached for 1 hour

#### Scenario: Empty page
- **GIVEN** a page has no videos
- **WHEN** it is served
- **THEN** it is not cached

#### Scenario: Error response
- **GIVEN** a feed request fails with a client or server error
- **WHEN** the response is served
- **THEN** it is not cached

### Requirement: Fresh order within each page
The feed SHALL show the videos of each page in an order chosen once per
visit, and SHALL keep the order of pages already shown when a later page
loads. The server response does not depend on the visit, so it stays cacheable.

#### Scenario: Page shown
- **GIVEN** a page of the feed is loaded
- **WHEN** the feed shows it
- **THEN** its videos appear in the order chosen for this visit

#### Scenario: Later page loads
- **GIVEN** the first and second pages have been shown
- **WHEN** the third page loads
- **THEN** the first and second pages keep their order

### Requirement: Real data reaches the deployed feed build
The production build SHALL show a video in the feed when it runs against a
migrated database that holds seed videos.

#### Scenario: Smoke test against a seeded database
- **GIVEN** the production build runs against a migrated database with seed videos
- **WHEN** the app is opened
- **THEN** the feed shows a video

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
