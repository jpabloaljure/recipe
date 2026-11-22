---
name: validate-backlog
description: Interactive, resumable validation of Easy Recipes backlog stories, one at a time. For each story still flagged needs-human-validation, runs the story-validator agent (validate-story skill), then builds a recommended option and alternatives for each finding, lets the user choose and review and change the story, re-checks it, waits for the user to approve the acceptance criteria, records the AI estimate (Fibonacci points from estimate-story) and then the team-agreed Estimate, and removes the flag only when the user says the story is validated. Use when the user asks to validate the backlog, continue or resume validation, or validate a given epic or story.
effort: medium
---

# validate-backlog

You run a validation session with the user, one story at a time. The user
decides; you show findings first, then build options for each finding as a
separate step, make only the edits they choose, and keep the log so the
session can stop and resume.

## Start or resume

1. Read `backlog/validation-log.md`. If it is missing, create it with the
   header in "Log format" below.
2. Choose the story:
   - If the user named a story (`REC-008`) or an epic (`E03`), start there
     (within an epic, by REC ID).
   - Else, if a row has status `in review`, resume that story and pass its
     open findings to the validator.
   - Else, the lowest REC ID whose Flags contain `needs-human-validation`
     and that is not logged as `skipped` in this session.
3. Show progress: validated / skipped / remaining (remaining = stories
   still flagged `needs-human-validation`).

## Per story

1. **Check:** run the `story-validator` agent with the story ID (plus the
   previous open findings when resuming). Show the story's current text,
   briefly, and the findings table and verdict it returns. The validator
   only finds problems; it never proposes fixes.
2. **Options:** only after the findings are shown, build the choices as a
   separate step (see "Options format" below): for every open finding, a
   recommended option and at least one real alternative, so the user can
   decide. Findings that hinge on the same decision share one choice.
3. **Review:** wait for the user. They pick options (e.g. `#1 A, #4 B`),
   edit the file themselves, or tell you what to change. Apply only what
   they chose or asked for, with the Edit tool (never shell commands), so
   the `validate-ac` hook checks each change. Never apply an option the user
   did not pick, and never rewrite the story on your own initiative. If they
   confirm an `(assumed)` item, update or remove that flag text only as they
   say.
4. **Re-check (`done`, or after applying choices):** run `story-validator`
   again with the previous findings. Show what is resolved, what is still
   open, and anything new, then build options for the open findings (step
   2). Repeat steps 3–4 until the user moves on.
5. **Approve criteria (`AC approved`):** wait for the user to say the
   acceptance criteria are approved. No estimate is made before this.
6. **AI estimate:** run the `estimate-story` skill. Show its points (1, 2, 3,
   5, 8, 13, or `spike <N>h` for spikes), justification and any size-check
   warning, and record it in the story as the skill describes
   (`**AI estimate:**` plus a paragraph in `### Estimation notes`). It is
   one voice; it never fills the team `**Estimate:**`. If it says the story
   is over 13 points, go back to step 3 to split it.
7. **Team estimate:** ask the user for the team-agreed points (`1` | `2` |
   `3` | `5` | `8` | `13`, or `spike <N>h` for spikes), entered after they
   have seen the AI estimate.
8. **Validate (`validated`):** only when the user says the current story is
   validated and a team estimate is given, make one Edit to that story that
   sets `**Estimate:**` to the team value and removes
   `needs-human-validation` from its Flags (leave the other flags; use `—`
   if none remain). The hook blocks this if the Estimate is missing or not a
   Fibonacci value.
9. **Log** the result, show progress, and go to the next story.

## Options format

Built by you (not the validator), after the findings are on screen. One
block per decision, must-resolve findings (from the verdict) first:

```markdown
**#1, #2 · <the decision in a few words>**
- **A (recommended):** <what to do>. Pros: … Cons: … Story change: <which
  AC / Technical context / flag changes>.
- **B:** <a real alternative>. Pros: … Cons: … Story change: …
- **C:** (only if it is a genuinely different path) …
```

- Every open finding gets a block; if there is truly only one sensible
  path, give it as A and offer "B: leave as is / move to
  `draft-backlog-list.md`" so the user still chooses.
- Options stay inside the PRD and the accepted ADRs. An option that adds a
  library, service or out-of-PRD feature must say it needs an ADR or human
  validation.
- Base trade-offs on the story, the PRD, the ADRs and the stack in
  `AGENTS.md`; mark guesses `(inferred)`.
- End by asking the user to choose (e.g. `#1 A, #4 B`), edit the story, or
  say `skip` / `stop`.

## Commands

| User says | You do |
|---|---|
| choices (e.g. `#1 A, #4 B`) | Apply only those options (step 3), then re-check (step 4) |
| `done` | Re-check the current story (step 4) |
| `AC approved` | Steps 5–6: run and record the AI estimate |
| team points (e.g. `5`), then `validated` | Steps 7–9 |
| `skip` | Log `skipped` with the open findings, keep the flag, go to the next story |
| `stop` | Log `in review` with the open findings and the user's notes, show how to resume, and end |

## Log format

`backlog/validation-log.md`:

```markdown
# Backlog validation log

Maintained by the `validate-backlog` skill. One row per story; update the
row in place when its status changes.

| Story | Status | Date | AI est. | Estimate | Open findings / notes |
|---|---|---|---|---|---|
```

Status: `in review` | `validated` | `skipped`. Date is the date of the last
status change. `AI est.` and `Estimate` are Fibonacci points (or
`spike <N>h`), `—` until set. Keep open findings short (number, type, one
line); note where the story stopped (e.g. "before AC approval").

## Constraints

- Only the user's explicit "validated" for the current story removes its
  flag. Never validate several stories at once, and never infer approval.
- One story at a time: do not start the next until the current one is
  validated, skipped or stopped.
- Never choose the team Estimate; the agreed value comes from the user. The
  AI estimate always comes first, and only after the criteria are approved.
- Never add features outside the PRD while editing; if the user asks for
  one, point out the rule in `AGENTS.md` and ask them to confirm.
- Write in English.
