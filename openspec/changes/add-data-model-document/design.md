# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-17:

- **Source of the model:** REC-020's acceptance criteria and Technical
  context, `backlog/README.md` Decided 4 (title-only `needs_recipe` videos,
  `rejected` status, no manual recipes), and PRD v0.3 (§5.3, §6.1–§6.5,
  EXT-2 to EXT-6, API-1, PERF-4). Decisions from the REC-020 explore session
  (write only after processing; internal integer key) are in REC-020's
  Technical context.
- **Stack:** Postgres on Neon with Drizzle ORM (ADR 0003). No schema exists
  yet; REC-019 builds it and is blocked by this story.
- **Architecture docs:** `docs/architecture/` holds only C4 diagrams, each
  with a `Status:` line (Proposed / Current). There is no place yet for a
  non-C4 diagram.
- **README:** the "Data model" section says TBD and lists four statuses
  (updated to five on 2026-11-17).
- **Pending decisions:** `docs/adr/README.md` lists three (LLM provider,
  captions, favorites copy); "is an ingestion run stored?" is not there.

## Goals / Non-Goals

**Goals:**
- One document that REC-019 (schema), REC-021 (API spec), the ingestion
  stories (REC-005, REC-008, REC-010) and the feed (REC-002) can read as the
  agreed data shape.
- Every rule in REC-020's criteria is stated once, in the document, in words
  a reviewer can check against the criteria.

**Non-Goals:**
- Choosing how the database enforces the feed-entry time (for example a
  trigger): REC-019 owns that, possibly with an ADR.
- API response shapes: REC-021 owns them; it reads this document.
- Browser data (favorites in localStorage) and ingestion configuration
  (seed channels and queries).

## Decisions

### 1. Location and format

`docs/architecture/data-model.md`, starting with `Status: Proposed`, then:
a short purpose paragraph, the Mermaid `erDiagram`, one field table per
entity, the status table, the rules, and the notes. `docs/architecture/README.md`
gets a small "Other diagrams" table listing it next to the C4 levels.

- **Why:** it sits with the other architecture diagrams and follows their
  Status convention, as REC-020 requires.
- **Alternative:** `docs/data-model.md` at the top level: rejected in
  validation (#11), it would sit apart from the other diagrams.

### 2. Logical model with a "Built now" note

The document draws two entities, VIDEO and RECIPE, with a 1 to 0..1
relationship. A "Built now" note says REC-019 stores the recipe as one JSON
column on the videos table until E02 is built; the document stays the
target design and owns the recipe's logical structure.

- **Why:** decided in validation (#2, #26): one target design, with the gap
  from what is built made visible.
- **Alternative:** describe only REC-019's one-table shape: rejected, it
  would not give the recipe typed fields and keys (checklist item 7).

### 3. Keys

VIDEO: `id` integer primary key; `youtube_id` text unique. RECIPE:
`video_id` primary key and foreign key to VIDEO, so a video has at most one
recipe. No other relationships.

- **Why:** decided in the explore session. A short opaque integer suits
  REC-002's cursor (feed-entry time, id); the YouTube ID stays unique for
  ING-3 deduplication and deep links.
- **Alternative:** `youtube_id` as the primary key: one field fewer, but
  the cursor and every foreign key would carry an 11-character text key.

### 4. Field types and names

Postgres type names (ADR 0003): `integer`, `text`, `boolean`,
`timestamptz`, `jsonb`, `text[]`, and an enum for status and source. Field
names are `snake_case` (database column names). Optional fields are marked
in the field tables, not in the diagram.

Ingredients and steps are drawn as `jsonb` in the diagram, with their shape
in an attribute comment, and spelled out in the field table:
ingredients `[{name: text, quantity: text?, unit: text?}]`, steps
`[text]` in order (the position is the step number).

- **Why:** GitHub's Mermaid `erDiagram` may reject list types such as
  `Ingredient[]`; a comment plus a table keeps the diagram rendering and
  the shape exact. Quantity and unit are text (validation #31).
- **Alternative:** separate INGREDIENT and STEP entities: rejected in
  validation (#17), lists inside the recipe were chosen.

### 5. Statuses and the feed-entry time

A status table lists the five statuses with: meaning, in the feed or not,
and whether the video has a recipe (`ready` and `not_easy` always;
`needs_recipe` and `rejected` never; `unavailable` keeps what it had). The
rules section states that the database sets `entered_feed_at` when a video
is inserted as, or changes to, `ready` or `needs_recipe` from a status
outside the feed, and keeps it when the status moves between those two.

- **Why:** REC-020 criteria 4, 5 and 7; REC-002's cursor relies on the time
  only growing for videos newly entering the feed.

### 6. Write only after processing

The rules section states that the ingestion job writes a video only with
its final status (and, for `ready` and `not_easy`, its recipe in the same
write). There is no pending status; a failure before the write stores
nothing, and the video is retried the next day.

- **Why:** decided in the explore session (option A); keeps the five
  approved statuses. Recorded in REC-005 and REC-008 too.
- **Alternative:** a sixth `pending` status: rejected, it changes the PRD,
  REC-019 and REC-020 for a retry the daily job already gets.

### 7. No ADR, no C4 update

The document records decisions already made in validation and the explore
session; none is a new architecture decision (framework, service, database,
hosting, external API or structural pattern). No container or external
system changes, so the C4 diagrams are not updated. "Is an ingestion run
stored?" goes to Pending decisions, not to an ADR.

## Risks / Trade-offs

- [Mermaid `erDiagram` comments or `jsonb` types do not render on GitHub]
  → check the rendered file on the PR (or mermaid.live) before merging; if
  comments fail, drop them and rely on the field table.
- [REC-002 is reopened for validation and may change what the feed reads]
  → the document is updated in the same change as any story that changes
  the model (REC-020 Technical context).
- [The document drifts from REC-019's schema] → REC-019 implements from it
  and sets its status to `Current` only when they match.

## Open Questions

- Is an ingestion run stored (for monitoring)? Recorded as a pending
  decision; it does not change this document's two entities.
