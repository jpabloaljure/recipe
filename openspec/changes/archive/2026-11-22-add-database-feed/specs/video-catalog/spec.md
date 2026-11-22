## ADDED Requirements

### Requirement: Curated list loading
The catalog SHALL be able to load a curated list of Shorts, each with its
title, channel and the candidate facts (channel ID, duration, embeddable flag
and language). A listed Short that passes the candidate checks (Shorts
length, embeddable, English) SHALL be stored as `needs_recipe` with the
values from the list. One that fails them SHALL be stored as `rejected` and
SHALL NOT appear in the feed.

#### Scenario: Short that passes the checks
- **GIVEN** a curated list of Shorts that pass the candidate checks
- **WHEN** the loader runs
- **THEN** each is stored as `needs_recipe` with its title, channel and facts from the list

#### Scenario: Short that fails the checks
- **GIVEN** a listed Short that fails the candidate checks
- **WHEN** the loader runs
- **THEN** it is stored as `rejected`
- **AND** it does not appear in the feed

### Requirement: Invalid list input is not loaded
The loader SHALL write nothing when the list file is missing or is not valid
JSON. It SHALL skip a list entry that lacks a title, a channel or one of the
candidate facts, log the entry's YouTube ID and the reason, and load the
other entries. When the same YouTube ID appears twice in the list, it SHALL
load the first entry and log the later one as skipped.

#### Scenario: List file missing or not valid JSON
- **GIVEN** a list file that is missing or is not valid JSON
- **WHEN** the loader runs
- **THEN** it fails before writing anything

#### Scenario: Entry with a missing field
- **GIVEN** a list entry without a title, a channel or one of the candidate facts
- **WHEN** the loader runs
- **THEN** that entry is not written and is logged with its YouTube ID and the reason
- **AND** the other entries are loaded

#### Scenario: Same YouTube ID twice
- **GIVEN** a list that holds the same YouTube ID twice
- **WHEN** the loader runs
- **THEN** the first entry is loaded
- **AND** the later one is logged as skipped

### Requirement: Loading is repeatable
Running the loader again SHALL NOT change or duplicate a video already in the
database, including after a run that failed partway.

#### Scenario: Loader runs again
- **GIVEN** videos from the list are already in the database
- **WHEN** the loader runs again
- **THEN** none of them is changed or duplicated

#### Scenario: Run failed partway
- **GIVEN** an earlier run failed after writing some entries
- **WHEN** the loader runs again
- **THEN** the entries already written are left as they are
- **AND** the remaining entries are loaded
