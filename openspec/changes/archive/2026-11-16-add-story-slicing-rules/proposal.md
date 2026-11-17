# Proposal

## Why

The Entrega 1 checklist (item 10) asks for work tickets per layer (database,
backend, frontend), but the backlog has no layer dimension: labels are by
module, type and size, and nothing written says how stories are sliced. In
practice stories are full-stack slices, and two splits made during
validation already followed a pattern no rule describes: REC-019 (schema)
was split out of REC-002, and REC-018 out of REC-001, with the parent
keeping its ID and waiting on the child. The maintainer role is defined as
"operations only", yet REC-019, REC-020 and REC-021 already use it for
technical work. Writing the rule down now, before more stories are validated
and REC-001 is built, keeps new and split stories consistent.

## What Changes

- **Slicing rule:** a story is a full-stack slice (database, API and UI
  together) by default. It is split by layer only when it is over 13 points
  or flagged `needs-splitting`, when one layer is shared by several stories,
  or when one layer carries its own risk or open decision.
- **New label `layer:*`** on every story, one of `layer:fullstack`,
  `layer:db`, `layer:backend`, `layer:frontend`. It joins module, type and
  size as the fourth "one of each" label. Every existing story (REC-001 to
  REC-021) gets one.
- **How a split works:** the parent keeps its ID, its role, its user-facing
  criteria and the user-facing slice (usually `layer:frontend`), and gets
  `blocked-by:` for each child; each child is a new story with the new flag
  `split-from:REC-<NNN>` and its own layer. The parent is re-sized,
  re-checked and re-estimated for what it keeps.
- **Roles:** "maintainer" widens from "operations only" to "operates and
  builds the app" (operations, plus technical and layer stories whose value
  is internal). A layer story keeps the home cook role when its value
  reaches the user. No "developer" role.
- **Tests for layer stories:** a `layer:db` or `layer:backend` story that
  changes nothing the user sees is done with unit or contract tests (no E2E
  test); the user-facing slice carries the E2E tests.
- Updated: `AGENTS.md` (Backlog, labels, roles, a "Story slicing" section),
  `backlog/README.md`, the DoR and DoD, the skills `decompose-prd`,
  `validate-story` and `estimate-story`, and the Entrega 1 checklist
  (item 10).

This change implements no backlog story (`REC-*`): it is backlog process.
No story's scope or acceptance criteria change; existing stories only gain a
`layer:` label (and, for REC-018 and REC-019, the `split-from:` flag that
records how they were made). The `needs-human-validation` restriction does
not apply.

Out of scope: changing the hook to enforce the new label, splitting any
story now, a "developer" role, and changing how stories are estimated.

## Capabilities

### New Capabilities
None. Backlog rules, labels and skill instructions add no product behavior,
so the change sets `skip_specs: true`.

### Modified Capabilities
None.

## Impact

- **Docs:** `AGENTS.md`, `backlog/README.md`,
  `docs/process/definition-of-ready.md`,
  `docs/process/definition-of-done.md`, `docs/checklist.md`; `README.md` if
  it lists the labels.
- **Skills:** `.agents/skills/decompose-prd/SKILL.md`,
  `.agents/skills/validate-story/SKILL.md`,
  `.agents/skills/estimate-story/SKILL.md`.
- **Backlog:** `backlog/E01`–`E04`: a `layer:` label on all 21 stories;
  `split-from:` on REC-018 and REC-019. Edited with the Write/Edit tools so
  the backlog hook runs.
- **Code, systems, architecture:** none. No ADR and no C4 change (backlog
  process is not architecture).
