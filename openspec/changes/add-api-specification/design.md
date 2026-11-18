# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-18:

- **Sources of the contract:**
  - REC-021's acceptance criteria and Technical context (validated
    2026-11-18);
  - `backlog/README.md` Decided 2 (client shuffle), Decided 4
    (title-only videos) and Decided 5 (single-video 404);
  - the data model document `docs/architecture/data-model.md` (REC-020),
    `Status: Proposed`;
  - PRD v0.3 §5.5, §6.4, §6.5 (API-1 to API-3), PERF-4, PERF-6;
  - five details settled in the REC-021 explore session (proposal, "Contract
    details").
- **Stack:** Next.js route handlers on Vercel with CDN caching (ADR 0002).
  No route exists yet. The stack has no OpenAPI tooling, and adding any
  needs approval and an ADR.
- **Consumers:**
  - REC-001's `add-vertical-swipe-feed` change plans
    `src/lib/feed/types.ts` with an item of `youtubeId` and `title`
    (no `id`) and a page of `items` and `nextCursor`.
  - REC-002 adds `channelName` and `recipe`; REC-014 uses the single-video
    route.
  - That change exists only in the working copy and has never been
    committed.
- **README §4** says TBD, lists `GET /api/videos/{id}`, and its API-1 row
  says "`ready` videos, each with its recipe". The README "Backlog" section
  says all 18 stories are unvalidated and that work tickets are TBD.
- **PRD API-3** says "a single video and its recipe by ID".

## Goals / Non-Goals

**Goals:**
- One file that REC-002, REC-014 and the E2E stub data can be checked
  against, field by field and status code by status code.
- Every REC-021 criterion maps to a place in the file or the README that a
  reviewer can point at.

**Non-Goals:**
- Route code, the TypeScript types module, request validation or tests
  (REC-001, REC-002, REC-014).
- How the cursor is encoded inside: the contract says only that it is
  opaque. REC-002 chooses the encoding (feed-entry time plus `id`, per
  REC-002).
- OpenAPI tooling (linter, renderer, mock server, generated client).

## Decisions

### 1. One OpenAPI 3.1 file, with reusable components

`docs/api/openapi.yaml` is laid out in this order:
- `info`, with the version tied to the PRD version and a description that
  names the owner and the data model;
- `paths` for the two endpoints;
- `components`:
  - `schemas`: `FeedPage`, `FeedItem`, `Recipe`, `Ingredient`, `Error`;
  - `responses`: `BadRequest`, `NotFound`, `ServerError`, each with the
    `no-store` header;
  - `headers`: `CacheControlShared` and `CacheControlNoStore`;
  - `parameters`: `Cursor` and `YoutubeId`;
  - `examples`.

Both endpoints point at the shared components with `$ref`, so the item shape
and the error body are each defined once.

- **Why:** REC-021 requires the same item shape on both endpoints and one
  error body for 400, 404 and 5xx; reusable components make that true by
  construction.
- **Alternative:** writing the schemas inline under each response. Rejected:
  the item would be written twice, and the two copies could drift apart.

### 2. Nullable, always-present fields

Every property of `FeedItem`, `Recipe` and `Ingredient` is in its object's
`required` list.
- **Fields that may be empty** use the 3.1 form `type: [string, "null"]`:
  `channelName`, `servings`, `quantity` and `unit`.
- **`recipe`** uses `oneOf: [$ref Recipe, {type: "null"}]`.
- **Objects are closed:** `additionalProperties: false` on each object
  documents that no internal field leaks out.

- **Why:** decided in the explore session (detail 1). The client checks for
  `null` and never for a missing key, and it matches `channelName`'s
  `string | null` in REC-021.
- **Alternative:** leaving empty fields out (an optional key). Rejected:
  every field would have two empty states, missing and `null`, and the
  TypeScript type would need `?:` and `| null`.

### 3. Error codes as an enum

`Error.error.code` is an enum with three values:
- `invalid_cursor` (400);
- `not_found` (404);
- `internal_error` (5xx).

`message` is free text written for maintainers, not shown to the user.

- **Why:** decided in the explore session (detail 2). A closed list makes
  each status code's body testable in REC-002 and REC-014.
- **Alternative:** a free-text `code`. Rejected: nothing in the contract
  could be checked.

### 4. Path and query parameters stay loose

- **`youtubeId`:** `type: string` with no `pattern`. Its description says
  "a YouTube video ID, usually 11 characters; a malformed ID returns 404".
- **`cursor`:** an optional `string`. Leaving it out means the first page;
  any value that cannot be decoded, the empty string included, returns 400
  `invalid_cursor`.

- **Why:** decided in the explore session (details 3 and 4).
  - A `pattern` tells readers and tools that a non-matching request is
    rejected with 400, while REC-021 says 404.
  - YouTube does not guarantee the ID's format.
  - One rule for the cursor ("cannot be decoded") is simpler than a special
    case for the empty string.
- **Alternatives:**
  - A pattern plus 404: the file would contradict itself.
  - A pattern plus 400: this changes an approved criterion.
  - Treating an empty cursor as the first page: one more case to test, for
    no client that needs it.

### 5. Caching headers as response headers

Each 2xx response declares a `Cache-Control` header whose description
depends on the case:
- a page or item with content: `public, s-maxage=3600`;
- an empty feed: `no-store`, shown as a separate 200 example.

The 400, 404 and 5xx responses declare `no-store`.

- **Why:** REC-021's caching criterion. In OpenAPI, headers are part of the
  response, so a reader finds them next to the body.
- **Alternative:** a prose section only. Rejected: it is easier to miss, and
  it is not tied to each response.

### 6. Examples: one per response type

Named examples, kept small:
- `feedPage`: two items, one `ready` and one title-only, with a `nextCursor`;
- `lastPage`: `nextCursor: null`;
- `emptyFeed`;
- `readyItem` and `titleOnlyItem` for the single-video endpoint;
- one error example per code.

- **Why:** decided in the explore session (detail 5). It covers each case
  without growing the file, and keeps the AI estimate at 2.
- **Alternative:** an example for every status code combination. Rejected:
  the estimate notes say that would make it a 3.

### 7. Field mapping and the human-readable view

GitHub does not render OpenAPI files, so the readable view lives in
markdown:
- **README §4** gets:
  - a two-row endpoint table (method and path, purpose, success
    response, errors, caching);
  - the corrected API-1 to API-3 behavior table;
  - a link to the file.
- **The field-to-column table** (public camelCase field → data model column
  and table) goes in the OpenAPI file's `info.description` as a markdown
  table, so it travels with the contract.

- **Why:** REC-021 requires the README table and the mapping. Keeping the
  mapping in the contract file means a change to the shape updates both in
  one place.
- **Alternative:** the mapping in the README. Rejected: it would separate
  the mapping from the schema it explains.

### 8. Linked documents changed in the same PR

- **PRD API-3** becomes: "Returns a single video in the feed (`ready` or
  `needs_recipe`) by its YouTube ID, for deep links; any other ID is not
  found."
- **The README "Backlog" section:**
  - 21 stories (REC-001 to REC-021);
  - REC-001, REC-020 and REC-021 validated; REC-002 and REC-003 in review;
    the rest flagged `needs-human-validation`;
  - every story labeled by layer, with a link to the checklist's row 10
    breakdown in place of "work tickets: TBD".
- **The `add-vertical-swipe-feed` proposal:** "in the shape REC-002's feed
  API is expected to return" becomes "in the shape of the feed API
  specification (`docs/api/openapi.yaml`, REC-021)". The whole untracked
  change folder is committed as it is, apart from that line, and the PR
  description says so.
- **The checklist:**
  - row 8 becomes ✅ and links to README §4;
  - row 10 becomes ✅ (one validated story per layer: DB REC-020, backend
    REC-021, frontend REC-001);
  - row 9's text and row 1's "API spec TBD" note are updated.

- **Why:** the scope agreed in the explore session ("all three").
- **Alternative:** leaving the swipe-feed proposal for REC-001's own PR.
  Rejected by the user, so all three linked fixes land with the contract.

## Risks / Trade-offs

- [The file is written by hand and nothing checks it: a broken `$ref` or a
  wrong 3.1 nullable form would go unnoticed] → Check each `$ref` against
  `components` by hand, and check that the YAML parses with a one-off
  script that uses only Node's standard library. A one-off run of an
  OpenAPI linter such as `@redocly/cli` through `npx`, never added to
  `package.json`, happens only if the human approves it at apply time.
- [REC-002 is still in review, and its open findings may change the
  response] → This file owns the contract (REC-021), so REC-002 adapts to
  it. If its validation needs a change, it updates this file in the same
  change.
- [The data model is `Proposed`; REC-019 may rename columns] → The mapping
  table points at the data model document, and REC-019 updates both if a
  column changes (data model "Keeping it current").
- [Committing the untracked `add-vertical-swipe-feed` folder puts a second
  story's planning on `main`] → It is planning only (0 of 13 tasks done),
  REC-001 is validated, and the PR description lists it on its own line.
- [Spec and types drift once code exists] → REC-021 sets
  `src/lib/feed/types.ts` as the one TypeScript module, kept in sync in
  review. No validator library.

## Open Questions

None. Every contract detail was settled in REC-021's validation or the
explore session.
