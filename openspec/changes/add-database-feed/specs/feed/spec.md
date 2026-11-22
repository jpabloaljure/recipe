## MODIFIED Requirements

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

## ADDED Requirements

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
