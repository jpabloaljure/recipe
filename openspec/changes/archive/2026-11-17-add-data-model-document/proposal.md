# Proposal

## Why

The project has no written data model: the README's "Data model" section
says TBD, and Entrega 1 checklist item 7 is open. REC-019 (schema and
migration) and REC-021 (API specification) are both blocked by it, and the
feed, the recipe panel and the ingestion job need to agree on the same
entities, statuses and fields before any of them is built. This change
implements **REC-020 · Data model document (no implementation)**, validated
on 2026-11-17 (not flagged `needs-human-validation`; AI estimate 2, team
estimate 2).

## What Changes

- **New document `docs/architecture/data-model.md`** (`Status: Proposed`):
  the logical model of the server data, with a Mermaid `erDiagram` and
  field tables.
  - **Video:** internal integer `id` (primary key), `youtube_id` (unique),
    title, channel ID and name, the candidate facts (duration, embeddable,
    language), a status limited to `ready`, `needs_recipe`, `not_easy`,
    `unavailable` and `rejected`, and the time the video entered the feed.
  - **Recipe:** 0 or 1 per video, keyed by `video_id`; servings, ingredients
    `{name, quantity, unit}` and numbered steps as typed lists, the source
    (`description`, `comment` or `captions`), and the raw "easy" facts
    (EXT-4).
  - **Rules:** which statuses are in the feed (`ready` with its recipe,
    `needs_recipe` with its title only); when the database sets the
    feed-entry time; which videos have a recipe; required and optional
    fields; a video is written only after it is fully processed (no pending
    status).
  - **Notes:** "Built now" (REC-019 stores the recipe as one JSON value
    until E02 is built), the completeness rule EXT-5 (an extraction rule,
    not a database constraint), and what is out of scope (favorites,
    seed channels and queries).
- **Links:** the README "Data model" section and
  `docs/architecture/README.md` link to the document; the architecture
  README lists it as a non-C4 diagram.
- **Pending decision:** "Is an ingestion run stored?" is added to "Pending
  decisions" in `docs/adr/README.md`.
- **Checklist:** item 7 points at the document.

No code, migration or route is written; REC-019 builds the schema from this
document and sets its status to `Current`.

## Capabilities

### New Capabilities

None. The change is documentation only, so `.openspec.yaml` sets
`skip_specs: true`.

### Modified Capabilities

None.

## Impact

- **Files:** `docs/architecture/data-model.md` (new),
  `docs/architecture/README.md`, `README.md`, `docs/adr/README.md`,
  `docs/checklist.md`, and REC-020's status in `backlog/E01-browse-feed.md`.
- **Stories unblocked:** REC-019 (schema) and REC-021 (API specification)
  are `blocked-by:REC-020`; they can start once this change is done.
- **No** code, dependency, ADR or C4 diagram change (the data model is not a
  C4 level; the decisions it records were made during validation).
