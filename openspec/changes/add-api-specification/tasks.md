# Tasks

## 0. Before starting

- [x] 0.1 Create a branch from an up-to-date `main` and check `git status`. Only this change's files and the `add-vertical-swipe-feed` folder may be part of the PR; leave the root `prompts.md` and `readme-template.md` untracked and out of it. Verify `git status` on the new branch
- [x] 0.2 Set REC-021 to `Status: in-progress` with the Edit tool (the story is validated, so the `validate-ac` hook allows it); verify the hook does not block

## 1. The OpenAPI file

- [x] 1.1 Create `docs/api/openapi.yaml` (`openapi: 3.1.0`) with `info` (title, version tied to PRD v0.3, a description naming REC-021 as the contract owner and linking the data model) and the reusable `components` (design Decision 1): the schemas `FeedPage`, `FeedItem`, `Recipe`, `Ingredient` and `Error`, and the parameters `Cursor` and `YoutubeId`. Verify every property is `required`, `channelName`, `servings`, `quantity` and `unit` use `type: [string, "null"]`, `recipe` is `oneOf` `Recipe` or `null`, objects set `additionalProperties: false`, and `Error.error.code` is the enum `invalid_cursor`, `not_found`, `internal_error` (Decisions 2 and 3)
- [x] 1.2 Add `GET /api/feed`: the optional `cursor` query parameter (first page when left out; the empty string and anything that cannot be decoded return 400), a 200 `FeedPage` with up to 10 items newest first by feed-entry time and the shuffle left to the client (API-2), and the 400 and 5xx responses (Decision 4). Verify against REC-021 criteria 1 to 4
- [x] 1.3 Add `GET /api/videos/{youtubeId}`: the path parameter has no `pattern` and its description notes that a malformed ID returns 404; a 200 `FeedItem` for `ready` and `needs_recipe` videos; 404 for unknown, malformed and out-of-feed IDs; and 5xx (Decision 4). Verify against REC-021 criteria 4, 6 and 7
- [x] 1.4 Add the `Cache-Control` headers to each response: `public, s-maxage=3600` for content, `no-store` for an empty feed, 400, 404 and 5xx (Decision 5). Verify against REC-021 criterion 5
- [x] 1.5 Add the named examples (Decision 6): `feedPage` with one `ready` and one title-only item, `lastPage`, `emptyFeed`, `readyItem`, `titleOnlyItem`, and one error per code. Verify each example matches its schema by reading it field by field, including `null` values and no extra keys
- [x] 1.6 Add the field-to-column table to `info.description` (Decision 7): each public camelCase field mapped to its table and column in `docs/architecture/data-model.md`, with `recipe: null` explained as no recipe row (`needs_recipe`). Verify every schema property is in the table, the reverse, and that each column exists in the data model
- [x] 1.7 Check the file: confirm it parses as YAML with a one-off script that uses only Node's standard library, or ask the human to approve a one-off `npx @redocly/cli lint` that is never added to `package.json` (design Risks); resolve every `$ref` against `components` by hand. Verify there are no parse errors and no unresolved `$ref`

## 2. README, PRD and checklist

- [x] 2.1 `README.md` §4 "API specification": replace "TBD" with the endpoint table (method and path, purpose, success response, errors, caching), fix the API-1 row (`ready` videos with their recipe, `needs_recipe` videos with their title only), update the API-3 row to the YouTube ID, and link to `docs/api/openapi.yaml`. Verify against REC-021 criterion 9 and that the link resolves
- [x] 2.2 `README.md` "Backlog" section: 21 stories (REC-001 to REC-021) and each epic's story list; REC-001, REC-020 and REC-021 validated, REC-002 and REC-003 in review, the rest flagged `needs-human-validation`; stories labeled by layer, with "work tickets: TBD" replaced by a pointer to the layer labels and checklist row 10 (Decision 8). Verify the counts against `backlog/E*.md` and `backlog/validation-log.md`
- [x] 2.3 `docs/PRD.md` API-3: "Returns a single video in the feed (`ready` or `needs_recipe`) by its YouTube ID, for deep links; any other ID is not found." Also check that §5.5 and API-1 agree. Verify the wording matches `backlog/README.md` Decided 5
- [x] 2.4 `docs/checklist.md`:
  - row 8: ✅, linking to README §4 and the file;
  - row 10: ✅ (validated DB REC-020, backend REC-021, frontend REC-001);
  - row 9: the story text;
  - row 1: the API note;
  - the "Last updated" date.

  Verify against REC-021 criterion 10

## 3. The swipe-feed proposal

- [x] 3.1 In `openspec/changes/add-vertical-swipe-feed/proposal.md`, change "in the shape REC-002's feed API is expected to return" to "in the shape of the feed API specification (`docs/api/openapi.yaml`, REC-021)"; leave the rest of the folder as it is. Verify with `git diff` (once staged) that this is the folder's only edit from its working-copy state, and that `openspec list` still shows the change with 0 of 13 tasks done

## 4. Check and close-out

- [x] 4.1 Walk REC-021's ten acceptance criteria against the file, README §4 and the checklist, one by one, and fix any gap; record the check in the PR description. This is docs only, so there are no E2E or unit tests (E2E rule 12)
- [ ] 4.2 Open the PR. It is docs only, so the AI review is not required. The description lists the `add-vertical-swipe-feed` folder on its own line, as REC-001's planning committed for the first time. Merge once CI `check` passes, then set REC-021 to `Status: done` with the Edit tool (Definition of Done)

## Workflow follow-up

- Archive the change with `openspec-archive-change` after the PR is merged.
- REC-014 is then unblocked (`blocked-by:REC-021`). REC-002 is unblocked too
  once its own validation finishes.
