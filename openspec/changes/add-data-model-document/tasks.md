# Tasks

## 0. Before starting

- [ ] 0.1 Ship or set aside the uncommitted backlog edits on `main` (the explore-session notes in REC-005, REC-008 and REC-020, and the REC-002 row in `backlog/validation-log.md` written outside this session), so this change's commits hold only its own files; verify `git status` on a new branch before the first edit
- [ ] 0.2 Set REC-020 to `Status: in-progress` with the Edit tool (the `validate-ac` hook allows it, since the story is validated); verify the hook does not block

## 1. The data model document

- [ ] 1.1 Create `docs/architecture/data-model.md` with `Status: Proposed`, a purpose paragraph and the Mermaid `erDiagram` for VIDEO and RECIPE (1 to 0..1), with typed fields, `PK`/`FK`/`UK` markers and `jsonb` lists commented (design Decisions 1–4); verify it renders on mermaid.live
- [ ] 1.2 Add one field table per entity: name, type, required or optional, and meaning, including the ingredient `{name, quantity?, unit?}` and step shapes, the required video fields, and the candidate facts that may be empty only for `rejected` (Decision 4); verify every field in the diagram is in a table and the reverse
- [ ] 1.3 Add the status table (meaning, in the feed, has a recipe) and the rules: feed-entry time set on insert or entry from outside the feed and kept between `ready` and `needs_recipe`; `needs_recipe` shown with its title only; a video is written only after it is fully processed, with no pending status (Decisions 5 and 6); verify against REC-020 criteria 3 to 9 one by one
- [ ] 1.4 Add the notes: "Built now" (REC-019 stores the recipe as one JSON value until E02), EXT-5 as an extraction rule owned by REC-008, the link to the original video built from the YouTube ID, out of scope (favorites in the browser, seed channels and queries, manual recipes in `draft-backlog-list.md` D-7), and who updates the document (REC-019 sets `Current`; a story that changes the model updates it in the same change); verify against REC-020's Technical context

## 2. Links and the pending decision

- [ ] 2.1 `docs/architecture/README.md`: add an "Other diagrams" table listing the data model document and its status; verify the link resolves
- [ ] 2.2 `README.md` "Data model" section: replace "TBD" with a short summary and a link to the document; verify it agrees with the document's statuses and fields
- [ ] 2.3 `docs/adr/README.md` "Pending decisions": add "Is an ingestion run stored (for monitoring)?" with what it affects (ingestion job, data model); verify the table still renders
- [ ] 2.4 `docs/checklist.md` item 7: point at the document and set its status; verify the row matches the delivered document

## 3. Check and close-out

- [ ] 3.1 Walk REC-020's ten acceptance criteria against the document and the links, one by one, and fix any gap; record the check in the PR description (docs only, so no E2E or unit tests: E2E rule 12)
- [ ] 3.2 Open the PR (docs only, so the AI review is not required), check the Mermaid diagram on GitHub's rendered view of the PR, merge once CI `check` passes, and set REC-020 to `Status: done` with the Edit tool (Definition of Done)

## Workflow follow-up

- Archive the change with `openspec-archive-change` after the PR is merged.
- REC-019 and REC-021 are then unblocked (`blocked-by:REC-020`).
