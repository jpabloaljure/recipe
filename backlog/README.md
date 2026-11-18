# Backlog

File-based backlog for Easy Recipes from YouTube. `docs/PRD.md` describes
the product at a high level; full conventions live in `AGENTS.md`.

## Files

| Epic | File | PRD goal |
|---|---|---|
| E01 Browse a curated feed with no waiting | `E01-browse-feed.md` | G1 |
| E02 A written recipe for every video that has one | `E02-recipe-every-video.md` | G2 |
| E03 Save and share without an account | `E03-save-and-share.md` | G3 |
| E04 Launch readiness | `E04-launch-readiness.md` | §8 |

Next free story ID: **REC-022**.

Ideas found during validation that are outside the MVP are parked in
[draft-backlog-list.md](draft-backlog-list.md) (not stories yet).

## Story shape

Each story is a `## REC-<NNN> · <title>` section with:

- **Status:** `todo` | `in-progress` | `blocked` | `done`
- **Labels:** one each of `module:*`, `type:*`, `size:*`, `layer:*`
  (`fullstack` | `db` | `backend` | `frontend`)
- **PRD:** the PRD sections/IDs it comes from
- **Flags:** `needs-human-validation`, `needs-splitting`,
  `blocked-by:REC-<NNN>`, `split-from:REC-<NNN>`, `(assumed) ...`, or `—`
- **AI estimate:** `estimate-story`'s Fibonacci points (`1` | `2` | `3` | `5`
  | `8` | `13`), or `spike <N>h`; `—` until estimated
- **Estimate:** the team-agreed points, same scale; `—` until estimated

Then the user story ("As a ..., I want ..., so that ..."), `### Acceptance
criteria` (Given/When/Then), `### Technical context`, `### Estimation notes`
(size rationale, then the AI estimate's justification).

## Estimation

`size:*` is a rough t-shirt scope; both estimates are Fibonacci story points,
made only after the acceptance criteria are approved: first the AI estimate,
then the team's.

| `size:*` | Story points |
|---|---|
| S | 1–2 |
| M | 3–5 |
| L | 8 |
| XL | 13 |

More than 13 points means the story needs splitting. Spikes are estimated as
a timebox in hours (`spike <N>h`), never in points.

## Splitting

Stories are full-stack slices (`layer:fullstack`) by default. A story is
split by layer only when it is over 13 points, when one layer is shared by
several stories, or when one layer carries its own risk. The parent keeps the
user-facing slice and is `blocked-by` each child; each child is flagged
`split-from:` the parent. Full rule: "Story slicing" in `AGENTS.md`.

## Rules

- A story cannot be set to `done` without Given/When/Then acceptance
  criteria. The hook `.claude/hooks/validate-ac.sh` blocks it.
- Each scenario follows the "Acceptance criteria (BDD) rules" in `AGENTS.md`:
  one behavior, one `Given`/`When`/`Then`, no `And` after `When`, at most two
  `And`/`But` after `Given` and after `Then`.
- Stories flagged `needs-human-validation` cannot move to `in-progress` or
  `done`, and cannot be used for an OpenSpec change. A human removes the flag
  after reviewing the story, and only once the team `**Estimate:**` is set.
  The hook enforces both, and rejects estimates outside `1|2|3|5|8|13` or
  `spike <N>h`.
- Validate stories with the `validate-backlog` skill (one story at a time,
  resumable). Progress is kept in [validation-log.md](validation-log.md).
- Edit these files with the Write/Edit tools, not shell commands, so the hook
  runs.
- Story IDs are global, never reused or renumbered.

## Decided

1. Supported browsers for the MVP: Chrome on Android and desktop. iOS
   (WebKit, including Chrome on iPhone) is out of scope. Decided 2026-11-16
   while validating REC-001; stories that assume other browsers are aligned
   as they are validated (REC-003, REC-015).
2. "Light shuffling" (REC-002): pages come newest first; the client shuffles
   videos within each page once per visit. The periodic availability check
   is out of the MVP (`draft-backlog-list.md` D-5). Decided 2026-11-16.
3. The PRD is not the source of truth: it is the high-level product
   description for stakeholders. When a decision changes the product (for
   example a behavior moved out of the MVP), the PRD is updated in the same
   change so it stays aligned with the backlog, code and documentation.
   Detail stays in the backlog; out-of-MVP items are tracked in
   `draft-backlog-list.md`. Decided 2026-11-16 (REC-002 validation, #22).
4. Videos with no recipe: a `needs_recipe` video enters the feed and shows
   its title only, with no recipe. Adding a recipe by hand (setting a video
   to `ready` by editing the database) is out of the MVP
   (`draft-backlog-list.md` D-7), so the recipe source is only
   `description`, `comment` or `captions`. Recovering a recipe for a
   `needs_recipe` video later is D-8. Candidates that fail ING-2 are stored
   with a fifth status, `rejected`, so they are skipped next time (ING-3).
   PRD §1, G2, §5.3, §5.5, ING-2, §6.4, API-1 and PERF-4, the README, the
   C4 diagrams (the maintainer no longer edits recipes) and AGENTS.md updated
   to match. Stories aligned the same day: REC-002 (reopened for validation),
   REC-005, REC-006, REC-007, REC-008, REC-014, REC-018, REC-019; REC-011,
   REC-012 and REC-013 carry `(assumed)` flags for title-only videos; E02's
   title. Decided 2026-11-17 (REC-020 validation, #16, #20, #23, #24).
5. Deep links to unknown or out-of-feed videos: `GET /api/videos/{youtubeId}`
   returns 200 only for `ready` and `needs_recipe` videos, and 404 for an
   unknown, malformed or out-of-feed (`not_easy`, `unavailable`, `rejected`)
   ID; on a 404 the deep link lands on the regular feed without an error
   (REC-014). The API contract is owned by the API specification (REC-021);
   REC-002 and REC-014 implement it. Decided 2026-11-18 (REC-021 validation,
   #1–#4).

## Open decisions

1. Seed channels and search queries (REC-005).
2. Whether favorites save a copy of the recipe (REC-012).
3. What counts as one "view" for auto-opening the panel (REC-007).
4. Whether the unmute "session" means the tab or the visit (REC-003).
5. ~~Deep link behavior for unknown or non-ready videos (REC-014).~~ Closed
   by Decided 5.
6. ~~Whether to add a `type:docs` story for maintainers rescuing
   `needs_recipe` videos by editing the database (§6.4).~~ Closed by Decided
   4: manual rescue is out of the MVP.
