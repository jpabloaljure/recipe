# video-catalog Specification

## Purpose
The video catalog's database rules: the tables that hold videos and their
recipes, and the rules the database enforces for every writer, so the feed,
the ingestion job and a maintainer's console edits all see the same data.

## Requirements

### Requirement: Catalog tables
The database SHALL hold a video table and a recipe table with the fields,
types and keys of the data model document, and a video status limited to
`ready`, `needs_recipe`, `not_easy`, `unavailable` and `rejected`.

#### Scenario: Migrations create the tables
- **GIVEN** an empty database
- **WHEN** the migrations run
- **THEN** the video and recipe tables exist with the data model's fields, types and keys
- **AND** the video status accepts only the five statuses

### Requirement: Feed-entry time is set by the database
The database SHALL set the time a video entered the feed when the video is
inserted as, or its status changes into, `ready` or `needs_recipe` from a
status outside the feed. A time sent by the writer SHALL be ignored.

#### Scenario: Video inserted into the feed
- **GIVEN** a video that is not in the database
- **WHEN** it is inserted as `ready` or `needs_recipe`
- **THEN** the time it entered the feed is the current time

#### Scenario: Video inserted outside the feed
- **GIVEN** a video that is not in the database
- **WHEN** it is inserted as `not_easy`, `unavailable` or `rejected`
- **THEN** it has no time it entered the feed

#### Scenario: Video moves into the feed
- **GIVEN** a video whose status is outside the feed
- **WHEN** its status changes to `ready` or `needs_recipe`
- **THEN** the time it entered the feed is the current time

#### Scenario: Writer sends a time on insert
- **GIVEN** a writer sends a time the video entered the feed
- **WHEN** the video is inserted
- **THEN** the database sets the time by its own rule and ignores the sent time

#### Scenario: Writer sends a time with a status change into the feed
- **GIVEN** a video whose status is outside the feed
- **WHEN** its status changes into the feed and the update carries a time
- **THEN** the time it entered the feed is the current time

### Requirement: Feed-entry time is protected
The database MUST reject any change to the time a video entered the feed that
does not come with the video moving into the feed, and MUST reject clearing
it for a video in the feed.

#### Scenario: Time changed on its own
- **GIVEN** a video in the database
- **WHEN** the time it entered the feed is changed without its status moving into the feed
- **THEN** the database rejects the change

#### Scenario: Time cleared for a feed video
- **GIVEN** a video in the feed
- **WHEN** the time it entered the feed is cleared
- **THEN** the database rejects the change

### Requirement: Feed-entry time is kept otherwise
The database SHALL keep the time a video entered the feed when its status
changes between `ready` and `needs_recipe`, when it leaves the feed, and
when any other field is updated.

#### Scenario: Status changes between ready and needs_recipe
- **GIVEN** a video in the feed
- **WHEN** its status changes between `ready` and `needs_recipe`
- **THEN** the time it entered the feed is kept

#### Scenario: Video leaves the feed
- **GIVEN** a video in the feed
- **WHEN** its status changes to `not_easy` or `unavailable`
- **THEN** the time it entered the feed is kept

#### Scenario: Another field is updated
- **GIVEN** a video in the feed
- **WHEN** another of its fields is updated
- **THEN** the time it entered the feed is unchanged

### Requirement: Rejected is only for first-time candidates
The database MUST reject any status change into or out of `rejected`.

#### Scenario: Status changes to or from rejected
- **GIVEN** a video in the database
- **WHEN** its status changes to or from `rejected`
- **THEN** the database rejects the change

### Requirement: Unique YouTube ID
The database MUST NOT hold two videos with the same YouTube ID.

#### Scenario: Duplicate YouTube ID
- **GIVEN** a video with a YouTube ID already in the database
- **WHEN** another video with that YouTube ID is inserted
- **THEN** the database rejects it

### Requirement: Required video fields
The database MUST reject a video without a field the data model requires. A
duration, embeddable flag and language are required unless the video is
`rejected`.

#### Scenario: Video missing a required field
- **GIVEN** a video that is not `rejected` is missing its duration, embeddable flag or language
- **WHEN** it is saved
- **THEN** the database rejects it

### Requirement: Recipe rules
The database MUST reject a recipe that is missing a required column or whose
source is not `description`, `comment` or `captions`.

#### Scenario: Recipe missing a required column
- **GIVEN** a recipe is missing a required column
- **WHEN** it is saved
- **THEN** the database rejects it

#### Scenario: Recipe with an unknown source
- **GIVEN** a recipe with a source other than `description`, `comment` or `captions`
- **WHEN** it is saved
- **THEN** the database rejects it

### Requirement: Recipe is deleted with its video
The database SHALL delete a video's recipe when the video is deleted.

#### Scenario: Video deleted
- **GIVEN** a video with a recipe
- **WHEN** the video is deleted
- **THEN** its recipe is deleted

### Requirement: Updated time is kept by the database
The database SHALL set the `updated_at` of a video or recipe to the current
time on every update, however the update is made.

#### Scenario: Video or recipe updated
- **GIVEN** a video or a recipe
- **WHEN** it is updated
- **THEN** its `updated_at` is the current time

### Requirement: Read-only access for the app
The app's read-only user SHALL be able to read every table of the app, and
the database MUST reject any write by that user.

#### Scenario: Read-only user reads
- **GIVEN** the migrations have run
- **WHEN** the app's read-only user reads any of the app's tables
- **THEN** the read succeeds

#### Scenario: Read-only user writes
- **GIVEN** the app's read-only user
- **WHEN** it writes to any of the app's tables
- **THEN** the database rejects it

### Requirement: Migrations are repeatable
Running the migrations again on a database they have already run on SHALL
leave the schema unchanged.

#### Scenario: Migrations run twice
- **GIVEN** the migrations have already run
- **WHEN** they run again
- **THEN** the schema is unchanged

### Requirement: Merged migrations reach production
A migration merged to `main` SHALL be applied to the production database by
an automatic workflow, one run at a time.

#### Scenario: Migration merged to main
- **GIVEN** a new migration is merged to `main`
- **WHEN** the migration workflow runs
- **THEN** the migration is applied to the production database
