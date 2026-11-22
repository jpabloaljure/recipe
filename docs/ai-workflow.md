# AI-assisted workflow

This project is planned and built with AI agents. This page explains the
pieces and how they fit together; the rules the agents follow are in
[AGENTS.md](../AGENTS.md) (`CLAUDE.md` links to it).

## From PRD to production

1. **PRD → backlog.** `decompose-prd` turns the [PRD](PRD.md) into epics and
   user stories in [`backlog/`](../backlog/README.md).
2. **Validate stories.** `validate-backlog` takes one story at a time: the
   `story-validator` agent (`validate-story` skill) lists edge cases,
   assumptions, missing scenarios and risks; the human approves the
   acceptance criteria; `estimate-story` gives the AI estimate; the team
   sets the final estimate. Progress is logged in
   [`backlog/validation-log.md`](../backlog/validation-log.md).
3. **Plan the change.** A validated story becomes an OpenSpec change
   (`openspec-propose`: proposal, specs, design, tasks), or a direct PR when
   no spec or design decision changes
   ([CONTRIBUTING.md › Choosing a path](../CONTRIBUTING.md#choosing-a-path-openspec-or-direct-pr)).
4. **Build.** `openspec-apply-change` implements the tasks on a branch.
5. **Review and ship.** An AI code review runs on every code PR before merge
   ([CONTRIBUTING.md › Review](../CONTRIBUTING.md#review)).
6. **Close out.** `openspec-archive-change` archives the change and the
   story is set to `done`.

## Skills

Shared in `.agents/skills/` (Claude Code, Cursor, Codex); `.claude/skills/`
links to them.

| Skill | What it does |
|---|---|
| `decompose-prd` | Turns the PRD into epics and user stories |
| `validate-story` | Lists a story's edge cases, assumptions, missing scenarios and risks, without rewriting it |
| `validate-backlog` | Validates stories one at a time with the human (review, criteria approval, AI estimate, team estimate); resumable |
| `estimate-story` | Gives Fibonacci story points (1, 2, 3, 5, 8, 13) as one voice in planning poker, after the criteria are approved |
| `write-adr` | Records an architecture decision and updates the C4 diagrams |
| `openspec-*` | OpenSpec workflow: explore, propose, update, apply, sync, archive |

Agents in `.claude/agents/`:

| Agent | Model | What it does |
|---|---|---|
| `story-validator` | Sonnet 5.5, effort medium | Runs `validate-story` on one story for `validate-backlog`; read-only |
| `doc-checker` | Haiku 5.5, effort low | Checks links and that docs, ADRs, C4, data model, API spec and backlog agree; reports only |

## Models

**The cap (2026-11-21): no model above Sonnet 5.5 and no effort above
`medium`.** Sonnet 5.5 at `medium` runs every step, including the
`story-validator` agent; Haiku 5.5 at `low` runs the read-only `doc-checker`.
`.claude/settings.json` sets the defaults and an effort ceiling; the rules, and
what the repo can and cannot enforce, are in
[AGENTS.md › Model routing](../AGENTS.md#model-routing).

**History.** From 2026-11-19 until the cap (change `add-model-routing`) decision
steps ran on Opus 5.5 at `high` effort. That routing included a one-time trial
of Sonnet 5.5 for `story-validator`, which **failed** on REC-019 (2026-11-21):
the first check ran on both models, all 18 Opus findings led to changes in the
story, and Sonnet found 15 of them and missed three:
- a database constraint for a feed video with no feed-entry time;
- the dependent stories not marked `blocked-by:REC-019`, and no owner for the
  curated-list loader;
- most of "other updates and console edits keep the time".

Sonnet raised one point Opus did not (AC1 bundling several checks). On
2026-11-21, after that trial, the project owner capped everything at Sonnet 5.5 and `medium`
anyway, accepting that trade-off. The validation flow still repeats the check
until no finding is new, and the human reviews every story, which is where a
missed finding can still be caught. Details in REC-019's row of
[`backlog/validation-log.md`](../backlog/validation-log.md).

## Guardrails

- **Human validation.** Every AI-written story starts flagged
  `needs-human-validation` and cannot be started or turned into an OpenSpec
  change until a human validates it and sets the team estimate.
- **Hook `validate-ac.sh`.** Blocks any backlog edit that would mark a story
  `done` without Given/When/Then criteria, start a story still flagged
  `needs-human-validation`, remove that flag before a team `Estimate` is set,
  or use an estimate outside `1|2|3|5|8|13` or `spike <N>h`.
- **Story slicing.** Stories are full-stack slices by default and split by
  layer only when needed; every story has a `layer:` label. See
  [AGENTS.md › Story slicing](../AGENTS.md#story-slicing).
- **Estimation.** `size:*` labels are t-shirt sizes (S/M/L/XL); the AI
  estimate and the team `Estimate` are Fibonacci points. See
  [backlog/README.md › Estimation](../backlog/README.md#estimation).
- **Architecture decisions.** Designs that make an architecture decision must
  name their ADRs and C4 updates (`openspec/config.yaml`).
- **Attribution.** Commits written by an AI carry a `Co-Authored-By:` line.

## Prompt log

Every prompt used to build the project is in [prompts-log.md](prompts-log.md).
