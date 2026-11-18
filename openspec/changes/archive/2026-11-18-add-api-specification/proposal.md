# Proposal

## Why

The feed API has no written contract. README §4 says TBD, and Entrega 1
checklist item 8 is the only item still marked missing. REC-002 (feed) and
REC-014 (deep link) are blocked until the request and response shapes are
agreed. This change implements **REC-021 · API specification document (no
implementation)**, validated on 2026-11-18. It is not flagged
`needs-human-validation`; the AI estimate and team estimate are both 2. Its
blocker, REC-020, is done.

## What Changes

- **New file `docs/api/openapi.yaml`** (OpenAPI 3.1, written by hand, no new
  library) for two endpoints.
  - **`GET /api/feed?cursor=`:**
    - Returns `{ items, nextCursor }`, up to 10 items per page, newest
      first by feed-entry time.
    - The cursor is opaque; `nextCursor` is `null` on the last page, and an
      empty feed is `{ "items": [], "nextCursor": null }`.
    - A cursor that cannot be decoded returns 400.
    - Shuffling is left to the client.
  - **`GET /api/videos/{youtubeId}`:** returns 200 with one item for a
    `ready` or `needs_recipe` video, and 404 for any other ID: unknown,
    malformed, or a video outside the feed.
  - **Item:** `youtubeId`, `title`, `channelName` (nullable) and `recipe`.
    `recipe` is `null` for a title-only (`needs_recipe`) video; otherwise it
    holds `servings`, `ingredients[{name, quantity, unit}]`, `steps[]` and
    `source`. Internal fields are not exposed.
  - **Errors:** one body for 400, 404 and app-produced 5xx,
    `{ "error": { "code", "message" } }`.
  - **Caching:** responses with content send `s-maxage=3600`; empty, 404
    and error responses send `no-store`.
  - **Field mapping:** a table maps each public camelCase field to its
    column in `docs/architecture/data-model.md`.
- **Contract details settled in the REC-021 explore (2026-11-18):**
  - optional fields with no value are always sent as `null`, never left
    out;
  - error codes are `invalid_cursor` (400), `not_found` (404) and
    `internal_error` (5xx);
  - `{youtubeId}` declares no format pattern, and its description notes
    that a malformed ID returns 404;
  - `cursor` is optional: leaving it out means the first page, and an
    empty string returns 400;
  - each response type has one example.
- **README §4 "API specification":** the TBD is replaced by a table of the
  two endpoints and a link to the file, and the API-1 row is fixed: `ready`
  videos come with their recipe and `needs_recipe` videos with their title
  only.
- **README "Backlog" section:** the stale text (all stories unvalidated,
  labeled by module only, work tickets TBD) is replaced with the current
  counts and the layer labels.
- **PRD API-3:** says the ID is the YouTube ID and that a video outside the
  feed returns 404 (`backlog/README.md` Decided 5).
- **`add-vertical-swipe-feed` proposal (REC-001's planned change):** the
  line that names REC-002 as the feed contract's owner now names this
  specification. That change has never been committed, so its folder is
  committed in this change's PR as an open change (0 of 13 tasks done).
- **Checklist:** row 8 links to README §4; rows 1, 9 and 10 are brought up
  to date.

No route, type or test is written; REC-002 and REC-014 implement the
contract.

## Capabilities

### New Capabilities

None. The change is documentation only, so `.openspec.yaml` sets
`skip_specs: true`. The API's behavior becomes spec requirements when
REC-002 and REC-014 build the routes.

### Modified Capabilities

None.

## Impact

- **Files:**
  - `docs/api/openapi.yaml` (new);
  - `README.md`, `docs/PRD.md`, `docs/checklist.md`;
  - `openspec/changes/add-vertical-swipe-feed/` (committed for the first
    time, with one line changed);
  - REC-021's status in `backlog/E01-browse-feed.md`.
- **Stories unblocked:** REC-002 and REC-014 are `blocked-by:REC-021`.
  REC-002 is still in review, and its finding #40 (how a title-only item is
  marked) is answered by this contract.
- **No** code, dependency, ADR or C4 change. ADR 0002 already names both
  routes, and its `{id}` placeholder means the YouTube ID (REC-021
  Technical context). The C4 level 3 Feed route was already aligned on
  2026-11-18.
