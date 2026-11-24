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
The feed MUST NOT change the active video on its own. Only a user gesture
moves the feed.

#### Scenario: Video ends with no interaction
- **GIVEN** a video is playing
- **WHEN** it reaches the end
- **THEN** the same video stays active

### Requirement: One video per gesture
Each swipe or scroll gesture SHALL move the feed by exactly one video,
forward or backward, however hard the gesture is. Gestures made over the
video itself SHALL move the feed.

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
vertical shape, fill the screen height and be centered horizontally.

#### Scenario: Desktop
- **GIVEN** I am on desktop
- **WHEN** the feed is shown
- **THEN** the vertical video is centered on the screen

#### Scenario: Phone in landscape
- **GIVEN** I am on a phone in landscape
- **WHEN** the feed is shown
- **THEN** the vertical video is centered on the screen

### Requirement: Wrap to the start after the last video
When the last video of the catalog is active, a forward gesture SHALL make
the first video of this visit's feed order active. The visit's order is the
order in which the feed showed the videos since the page was opened.

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
next videos are there before the home cook reaches them.

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
