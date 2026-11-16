# Backlog

File-based backlog for Easy Recipes from YouTube. The source of truth for
product scope is `docs/PRD.md`; full conventions live in `AGENTS.md`.

## Files

| Epic | File | PRD goal |
|---|---|---|
| E01 Browse a curated feed with no waiting | `E01-browse-feed.md` | G1 |
| E02 A written recipe for every video | `E02-recipe-every-video.md` | G2 |
| E03 Save and share without an account | `E03-save-and-share.md` | G3 |
| E04 Launch readiness | `E04-launch-readiness.md` | §8 |

Next free story ID: **REC-019**.

Ideas found during validation that are outside the MVP are parked in
[draft-backlog-list.md](draft-backlog-list.md) (not stories yet).

## Story shape

Each story is a `## REC-<NNN> · <title>` section with:

- **Status:** `todo` | `in-progress` | `blocked` | `done`
- **Labels:** one each of `module:*`, `type:*`, `size:*`
- **PRD:** the PRD sections/IDs it comes from
- **Flags:** `needs-human-validation`, `needs-splitting`,
  `blocked-by:REC-<NNN>`, `(assumed) ...`, or `—`
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

## Open decisions

1. Seed channels and search queries (REC-005).
2. Whether favorites save a copy of the recipe (REC-012).
3. Meaning of "light shuffling" and availability-check frequency (REC-002).
4. What counts as one "view" for auto-opening the panel (REC-007).
5. Whether the unmute "session" means the tab or the visit (REC-003).
6. Deep link behavior for unknown or non-ready videos (REC-014).
7. Whether to add a `type:docs` story for maintainers rescuing `needs_recipe`
   videos by editing the database (§6.4).
