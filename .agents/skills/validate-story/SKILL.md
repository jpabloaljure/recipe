---
name: validate-story
description: Reviews one Easy Recipes backlog story (a REC-<NNN> section in backlog/E*.md) before human validation — lists edge cases, implicit assumptions, missing scenarios, and unmentioned dependencies or risks, without rewriting the story. Use when the user asks to validate, review, challenge or find gaps in a user story, or before removing its needs-human-validation flag.
---

# validate-story

You are a critical reviewer helping a human validate one user story. Your
job is to find what is missing or assumed. **Do not rewrite the story** and
do not edit any file: only list findings.

## Input

The user names a story by ID (e.g. `REC-007`). Read:

1. Its `## REC-<NNN>` section in `backlog/E*.md` (story, flags, labels, PRD
   refs, acceptance criteria).
2. The PRD sections it cites in `docs/PRD.md`, plus §4 (non-goals), §9
   (risks) and §12 (open questions).
3. Stories it depends on or that share its `module:` label.
4. `AGENTS.md` (BDD rules) and, when relevant, `docs/adr/` and
   `docs/architecture/c4/` for constraints the stack imposes.

If you are given a previous findings list, report only findings that are new
or still open, and mark each previous finding as `resolved` or `open`.

## What to find

1. **Edge cases:** inputs, states or timings the criteria don't cover
   (empty, first/last item, offline, slow network, repeated action,
   concurrent change, removed video, browser support…).
2. **Implicit assumptions:** things the story or its criteria take for
   granted that the PRD does not state. Include any `(assumed)` flag that
   still needs a decision.
3. **Missing scenarios:** behaviors the cited PRD sections require that no
   criterion covers, and error paths with no scenario.
4. **Dependencies and risks:** other stories, external services (YouTube
   API, LLM, localStorage, Web Share), PRD §9 risks, or open decisions
   (pending list in `docs/adr/README.md`, open decisions in
   `backlog/README.md`) that the story relies on but does not mention.
5. **Rule checks:** criteria that break the BDD rules in `AGENTS.md` (more
   than one `When`, too many `And`s, more than one behavior), or content
   that conflicts with PRD non-goals or an Accepted ADR.
6. **Slicing checks** ("Story slicing" in `AGENTS.md`): the story has
   exactly one `layer:` label and it matches the work; a trigger for a layer
   split holds (over 13 points, a layer shared by several stories, or a layer
   with its own risk or open decision); for a layer split, each child is
   flagged `split-from:` the parent, the parent is `blocked-by` each child,
   and the parent kept the user-facing criteria.

## Output

In chat:

### REC-<NNN> · <title> — validation findings

| # | Type | Finding | Source / why it matters | Question for the team |
|---|---|---|---|---|

Types: `edge-case`, `assumption`, `missing-scenario`, `dependency`, `risk`,
`rule`, `slicing`. Order by impact: findings that would change scope or the estimate
first.

Then a short **Verdict**:
- **Ready to validate:** no finding changes scope; list what to confirm.
- **Needs refinement:** name the findings that must be resolved first.
- **Consider splitting:** findings show more than one behavior, an XL
  scope, or a trigger for a layer split.

## Constraints

- Only list; never rewrite the story, its criteria, or any file.
- Do not propose fixes or alternatives; the "Question for the team" column
  names the decision, not its answer. Options are built afterwards, as a
  separate step (the `validate-backlog` skill does this).
- Every finding cites its source (PRD section, story ID, ADR, rule) or is
  marked `(inferred)`.
- Do not propose features outside the PRD; if a gap points to one, say it
  is out of scope (PRD §4 / §10).
- Never remove `needs-human-validation` or set `Estimate`; the human does
  that after reviewing your findings (see `AGENTS.md`).
- Write in English.
