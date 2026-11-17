# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-16:

- **Labels:** `AGENTS.md` requires one each of `module:*`, `type:*`,
  `size:*`. `backlog/README.md` repeats it. `decompose-prd` writes the
  three; `validate-story` and `estimate-story` read them. The hook
  `.claude/hooks/validate-ac.sh` checks acceptance criteria, the
  `needs-human-validation` flag and estimate values, not labels.
- **Roles:** `AGENTS.md` and `decompose-prd` define home cook (§3) and
  maintainer (§6.4, "operations only"); `decompose-prd` forbids "As a
  developer" and already routes backend work with a felt benefit to the home
  cook. REC-019, REC-020 and REC-021 use maintainer for technical work.
- **Splits so far:** REC-018 was split from REC-001 and REC-019 from REC-002
  during validation. Each child says "Split from REC-NNN" in its Technical
  context; REC-002 carries `blocked-by:REC-019`. There is no flag for it.
- **Splitting guidance:** "more than 13 points → `needs-splitting`" in
  `AGENTS.md`; `estimate-story` proposes a tentative 2–3 story split;
  `validate-story` has a "Consider splitting" verdict. None says how to cut.
- **Tests:** E2E rule 12 already limits E2E tests to stories that change
  what the user sees; the DoD lists unit tests and E2E tests.
- **Uncommitted work:** the human has uncommitted edits in the backlog
  files, `validate-story`, `validate-backlog` and `story-validator.md`.

Decisions below were made with the human in an explore session on
2026-11-16.

## Goals / Non-Goals

**Goals:**
- One written slicing rule that agents and humans follow when writing,
  validating and estimating stories.
- Every story shows its layer, so the backlog can be read per layer
  (checklist item 10).
- Splits keep the user's benefit traceable to one story.

**Non-Goals:**
- Splitting any story now.
- Enforcing the label in the hook (a later change if labels drift).
- Changing estimation scales or the validation flow.

## Decisions

### 1. Full-stack by default; split by layer only on a trigger

A story is one slice through every layer it needs (`layer:fullstack`),
unless one of these holds, in which case it is split by layer:

1. it is over 13 points or flagged `needs-splitting`;
2. one layer is shared by several stories (the REC-019 case);
3. one layer carries its own risk or open decision that should be settled
   or estimated on its own.

Touching several layers is not a trigger. A story that naturally lives in
one layer (REC-001, built on stub data) is labeled with that layer without
being a split.

- **Why:** full-stack slices deliver user value each time; layer splits are
  the exception, used where they reduce risk or duplication.
- **Alternative: split by user workflow or data variation** (the usual
  agile advice). Still allowed when it fits, but the human chose layer
  splitting as the project's default way to cut a story that is too big.

### 2. `layer:*` label on every story

Values: `layer:fullstack`, `layer:db`, `layer:backend`, `layer:frontend`.
It becomes the fourth "one of each" label. Spikes and docs stories take the
layer they investigate or document. Initial assignment (confirmed with the
human at apply time):

| Layer | Stories |
|---|---|
| `fullstack` | REC-002 (API route + client shuffle), REC-014 (single-video endpoint + deep-link view) |
| `db` | REC-019 (schema), REC-020 (data model document) |
| `backend` | REC-005, REC-008, REC-009 (spike), REC-010, REC-016 (spike), REC-017, REC-021 (API document) |
| `frontend` | REC-001, REC-003, REC-004, REC-006, REC-007, REC-011, REC-012, REC-013, REC-015 (spike), REC-018 |

- **Why on every story:** item 10 and the backlog README can count work per
  layer; a label only on split stories would leave most stories unlabeled.
- **Alternative: label only split stories.** Fewer edits, but no per-layer
  view.

### 3. Split shape: the parent keeps the user-facing slice

```
REC-0XX db       split-from:REC-0NN --+
REC-0XX backend  split-from:REC-0NN --+--> REC-0NN parent: user story,
                                            user-facing AC, UI slice, E2E;
                                            blocked-by each child
```

- **Parent:** keeps its ID, role and user-facing criteria; keeps the slice
  the user sees (usually `layer:frontend`); gets `blocked-by:` for each
  child; is re-sized, re-checked (`validate-story`) and re-estimated.
- **Child:** a new story (next free ID) with `split-from:REC-<NNN>` in
  Flags, its own layer label, its own criteria and estimate, and starts
  flagged `needs-human-validation`.
- Record the existing splits the same way: REC-018 and REC-019 get
  `split-from:` flags. Found at apply time: REC-018 was split from REC-001 by
  behavior (error states), not by layer, and REC-001 does not need it, so a
  behavior split flags the child `split-from:` but the parent is `blocked-by`
  it only if it needs it.
- **Why:** it matches the splits already made; every story has real work
  and an estimate, so the hook's rules hold (no estimate-less story that
  must be validated); the parent finishes last, so "parent done" means the
  user value shipped.
- **Alternative A, umbrella parent:** a parent with no work of its own
  cannot get an estimate, and the hook will not remove
  `needs-human-validation` without one, so it could never close.
- **Alternative B, replace the parent:** needs a new status (no "closed
  without done" exists) and scatters the user-level criteria.

### 4. Roles: maintainer widened, no developer role

- Maintainer: "operates and builds the app (PRD §6.4): operations, plus
  technical and layer stories whose value is internal (schema, contract,
  migration)".
- A layer story whose value reaches the user keeps the home cook role
  ("As a home cook, I want the feed API to return only ready videos, so
  that I never land on a broken one").
- "As a developer" stays forbidden.
- **Why:** on a one-person project a developer role changes no criteria or
  priorities; maintainer is already used this way; no PRD change.

### 5. Tests and done for layer stories

- A `layer:db` or `layer:backend` story that changes nothing the user sees
  is done with unit tests or contract tests (an API route checked against
  the API specification, REC-021) in Vitest; it needs no E2E test. This
  follows E2E rule 12, which already applies only to stories that change
  what the user sees; the DoD says it explicitly.
- The user-facing slice (the parent, or any `fullstack`/`frontend` story)
  carries the E2E tests.

### 6. Where the rules live

- `AGENTS.md`: a "Story slicing" subsection under Backlog (Decisions 1 and
  3), `layer:*` in "Labels", `split-from:` in the Flags list, the widened
  maintainer role (Decision 4).
- `backlog/README.md`: labels, flags and a short "Splitting" note.
- DoR: "full-stack story, or a layer story with `split-from:` whose parent
  is `blocked-by` it". DoD: Decision 5.
- Skills: `decompose-prd` writes the layer label and full-stack stories,
  widens the maintainer role; `validate-story` checks the layer label,
  suggests a layer split when a trigger holds, and checks a split's links;
  `estimate-story` proposes layer splits in its "over 13 points" step.
  `validate-backlog` and `story-validator` follow these skills and need no
  edit.
- `docs/checklist.md` item 10: the rule, and the stories per layer.

### 7. No ADR, no C4 change

Backlog process is not an architecture decision under ADR 0001, and no
system, container or component changes.

## Risks / Trade-offs

- [Layer splits leave the user value only in the last story] → the parent
  keeps the user-facing criteria and finishes last; the API specification
  (REC-021) is the contract both sides test against.
- [Layer labels drift because the hook does not check them] →
  `validate-story` checks them on every validation; the hook can enforce it
  later.
- [Backfilling labels conflicts with the human's uncommitted backlog and
  skill edits] → commit or set aside that work before applying; apply edits
  only add a label line, a flag or a paragraph, and the commit stages only
  this change's hunks.
- [Calling REC-002 `fullstack` and REC-001 `frontend` is a judgment call]
  → the table is confirmed with the human before the backfill.

## Migration Plan

Edit the docs and skills, then backfill labels with the Write/Edit tools
(so the backlog hook runs on each edit). Rollback: revert the commit.

## Open Questions

None.
