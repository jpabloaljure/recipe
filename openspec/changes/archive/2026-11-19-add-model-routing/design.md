# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-19:

- **No model or effort is set anywhere.** None of the 11 skills in
  `.agents/skills/` (linked from `.claude/skills/`) and not
  `.claude/agents/story-validator.md` set `model` or `effort`;
  `.claude/settings.json` holds only the backlog hook. Everything runs on the
  session model, Opus 5.5, whose default effort is `medium`.
- **What Claude Code supports** (Claude Code docs, skills and subagents
  pages, read 2026-11-19):
  - Agent frontmatter: `model` (`haiku`, `sonnet`, `opus`, `fable`, a full
    model ID, or `inherit`; default: the model of the conversation that
    starts it) and `effort` (`low` to `max`).
  - Agent model precedence: the model passed when the agent is called, then
    the agent's `model` field, then `CLAUDE_CODE_SUBAGENT_MODEL`, then the
    session model. `CLAUDE_CODE_EFFORT_LEVEL` overrides every effort setting.
  - Skill frontmatter: `model` and `effort` apply to the main conversation
    **for the current turn only**; the session's settings come back on the
    next prompt. With `context: fork` (+ `agent: <name>`) they apply to a
    forked agent instead.
- **Generated skills:** the seven `openspec-*` skills are written by
  `openspec update` (OpenSpec 2.0.0); edits to them are overwritten.
  `openspec/config.yaml` supports `context`, per-artifact `rules` and
  per-operation `guidance` (apply, archive), not skill frontmatter.
- **Shared skills:** `.agents/skills/` is also read by Cursor and Codex.
- **Prompt caching** is per model: switching the main session's model loses
  the cached conversation.
- **Prompt log:** `docs/prompts-log.md` summaries have Goal, Changes and
  Result; the `pend-` rule lives in Claude Code memory, outside the repo.

## Goals / Non-Goals

**Goals:**
- Same results as today on every decision step, with more effort where
  decisions are made and less spend on reading-heavy checks.
- Routing that keeps working after `openspec update` and when a rule is
  ignored (fail-safe: the session model).
- A record of which models did the work, per prompt-log summary.

**Non-Goals:**
- A cheaper session model, or a cost dashboard.
- Changing what any skill does, beyond calling the new agent.

## Decisions

### 1. Route by judgment and cost of a mistake; Opus stays the session model

| Tier | Model | Used for |
|---|---|---|
| Top | Opus 5.5 (session) | Anything that makes a decision: PRD → backlog, explore, propose and design, ADRs, validation with the human, estimates, applying changes, code review |
| Mid | Sonnet 5.5 | Nothing yet; `story-validator` only if the trial (Decision 4) passes |
| Low | Haiku 5.5 | Forked, read-only checks whose output the main session verifies (Decision 5) |

- **Why:** the value of this workflow is in its decisions; a weaker decision
  costs more in rework than the model saves. Opus 5.5 costs twice Sonnet 5.5
  and 40 times Haiku 5.5, so the clear saving is moving bulk reading to
  Haiku, not moving decisions down.
- **Alternative:** Sonnet 5.5 as the session model with Opus for design
  only. Rejected: every apply and validation turn would run on the weaker
  model, and switching models inside a session loses the prompt cache.

### 2. Effort first: `high` for decisions, set in project skill frontmatter

| Skill | `effort` |
|---|---|
| `decompose-prd`, `write-adr`, `validate-backlog` | `high` |
| `estimate-story` | `medium` |
| `validate-story` | none (it runs inside `story-validator`, Decision 4) |

No skill sets `model`: they run on the session model.

- **Turn scope:** a skill's `effort` lasts only for the turn it is invoked
  in. `decompose-prd`, `write-adr` and `estimate-story` finish in that turn.
  `validate-backlog` and the explore sessions span many turns, so
  `AGENTS.md` tells the human to run `/effort high` at the start of a
  validation or explore session; the heaviest reading in validation is the
  validator, which pins its own effort on every call.
- **Why:** raising effort on the top model is the first lever before any
  model change, and it touches only the steps whose output everything else
  follows.
- **Alternative:** a project-wide `CLAUDE_CODE_EFFORT_LEVEL=high`.
  Rejected: it overrides every skill and agent setting, including `low` for
  checks.

### 3. Cheaper models only in forked, read-only agents

A cheaper model never edits files and never decides. It runs as an agent
with tools `Read`, `Grep` and `Glob`, returns facts with file and line, and
marks anything it is unsure of as `unsure`, which the main session checks
itself (hand back on doubt). The main session's model is never switched
mid-session.

- **Why:** a read-only agent cannot damage the repo, its output is easy to
  verify, and forking keeps the main session's cached context.

### 4. `story-validator`: pinned to Opus; one side-by-side trial with Sonnet

- Frontmatter: `model: opus`, `effort: high`.
- **Trial** on the next story validated with `validate-backlog` (REC-019 or
  REC-002): the first check runs the validator twice, once as pinned and
  once called with `model: sonnet` (the per-call model wins over the
  frontmatter, so no file changes). Only the Opus findings are shown to
  the human and drive the session.
- **Pass:** every Opus finding that led to a change in the story (an option
  the human applied) also appears in the Sonnet run, in any wording. Then a
  later direct PR sets `model: sonnet`. **Fail:** it stays on Opus.
- The result goes into `backlog/validation-log.md` (that story's notes) and
  `docs/ai-workflow.md`, pass or fail.
- **Why:** finding gaps is the validator's whole purpose, so it moves down
  only on evidence from real work.
- **Alternative:** switch to Sonnet now. Rejected: no evidence yet, and a
  missed finding reaches the backlog.

### 5. New `doc-checker` agent on Haiku

- Frontmatter: `model: haiku`, `effort: low`, tools `Read, Grep, Glob`.
- **Checks** (each returns `ok`, `problem` or `unsure`, with file:line):
  relative links and anchors resolve; the ADR index lists every ADR file
  with its status; C4 and data-model `Status:` lines; named facts that must
  agree across the PRD, README, `AGENTS.md`, ADRs, C4, data model, API spec
  and backlog (endpoint paths, statuses, stack items); prompt-log numbering
  is continuous.
- **Called by:** `write-adr` (after its edits), the change close-out
  (through `operations.archive.guidance` in `openspec/config.yaml`, which
  survives `openspec update`), README and C4 updates (`AGENTS.md` rule), and
  `pend-` (before the commit).
- The caller reads the report and fixes or dismisses each `problem` and
  `unsure` item; the checker never fixes anything.
- **Alternative:** a link-check script. Not now: it covers only links, adds
  code to maintain, and the alignment checks need reading.

### 6. Generated `openspec-*` skills: routing through `AGENTS.md` and `config.yaml`

Their files are not edited. A "Model routing" section in `AGENTS.md` states:
explore and propose at `high` effort (`/effort high`, Decision 2);
`openspec-apply-change` at the default effort, raised to `high` for tasks
that touch the schema, the API contract, or a design decision; archive, sync
and update at the default. `operations.apply.guidance` and
`operations.archive.guidance` in `openspec/config.yaml` add "run the
`doc-checker` agent before finishing" for docs and close-out work.

### 7. Shared skills stay shared

The new `effort` field goes into the shared `SKILL.md` files. Before
committing, check what Cursor and Codex do with an unknown frontmatter
field. If either rejects it, the field is not added there and the skill's
tier goes into the `AGENTS.md` table instead.

### 8. Prompt log: Models and Why lines in every summary

From prompt 201 on, each summary ends with:

```markdown
- **Models:** Opus 5.5 (main session) · Haiku 5.5 (doc-checker: links and alignment) · Opus 5.5, effort high (story-validator)
- **Why:** decisions on the schema stayed on Opus; read-only checks went to Haiku.
```

- **Sources:** the main session's model is known; agents' models come from
  their frontmatter or the model they were called with. Effort is written
  only where a skill or agent sets it; the session's effort is not visible
  and is never guessed.
- **Sessions on another model:** a chain run on Haiku (an explore session,
  for example) says so on its Models line; when one chain mixes sessions, a
  prompt from another model gets a short mark in its heading, e.g.
  `(Haiku 5.5)`.
- The log's intro gains one sentence; the `pend-` memory rule writes the
  lines. `prompts.md` §0 adds the `doc-checker` row and an effort column.

## Risks / Trade-offs

- **Skill effort reverts after one turn** → `/effort high` at the start of
  multi-turn sessions (Decision 2), written in `AGENTS.md`; the validator
  pins its own effort.
- **Haiku misses a problem** → it adds a check, it does not remove one: the
  main session still reviews the diff, and `unsure` items come back to it.
- **One trial is a small sample** → the bar is strict (every finding that
  changed the story), and the result is recorded so later runs can
  revisit it.
- **Most spend stays on Opus** (applies, validation) → accepted: those are
  the decision steps; savings come from the checks and from not raising
  effort where it adds nothing.
- **A tool reading `.agents/skills/` rejects the new field** → checked
  before commit (Decision 7).

## Migration Plan

All changes are files: frontmatter lines, one new agent, rule text and
config guidance. Rollback is reverting the PR; with no frontmatter set, every
skill and agent falls back to the session model, as today. The `pend-`
memory change is reverted by hand.
