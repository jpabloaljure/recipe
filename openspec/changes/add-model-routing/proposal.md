# Proposal

## Why

Every skill and agent in the project runs on the session model (Opus 5.5) at
its default effort: no skill or agent sets a model or an effort level, and no
project setting does either. Decision steps (PRD → backlog, ADRs, story
validation) get no extra effort, while read-heavy checks (links, alignment
between docs, ADRs and diagrams) run on the most expensive model. Claude Code
lets skills and agents pin `model` and `effort` in their frontmatter, so the
workflow can spend effort where decisions are made and move checkable reading
to a cheaper model, without lowering the quality of any decision. The prompt
log also does not record which models were used, which the AI usage log
(`prompts.md` §0) needs.

## What Changes

- **Routing rule in `AGENTS.md`:** Opus 5.5 stays the session model and every
  step that makes a decision stays on it. Effort is set per step (`high` for
  decisions, the default for routine work). Cheaper models run only in forked,
  read-only agents whose output the main session checks. The main session's
  model is never switched mid-session. A cheaper agent that meets ambiguity
  hands the step back instead of guessing. `CLAUDE_CODE_EFFORT_LEVEL` is never
  set.
- **Effort in project skill frontmatter:** `decompose-prd`, `write-adr` and
  `validate-backlog` at `high`; `estimate-story` at `medium`.
- **`story-validator` agent pinned** to `model: opus`, `effort: high`, plus a
  one-time side-by-side trial with Sonnet 5.5 on the next validated story: it
  switches to Sonnet only if Sonnet finds every finding that changed the
  story; the result is recorded either way.
- **New `doc-checker` agent** (`model: haiku`, `effort: low`, tools Read,
  Grep, Glob): checks links and alignment between docs, ADRs, C4 diagrams,
  the PRD and the backlog, and reports facts only. Used by `write-adr`, the
  change close-out, README and C4 updates, and the `pend-` prompt log.
- **Generated `openspec-*` skills:** their routing lives in the `AGENTS.md`
  rule, since `openspec update` overwrites their files (apply at the default
  effort, `high` for schema, API contract or risky tasks; explore and propose
  at `high`). Check whether `openspec/config.yaml` can carry it instead.
- **Prompt log:** each summary in `docs/prompts-log.md` gains **Models:** and
  **Why:** lines; the log's intro says so from prompt 201 on. The `pend-`
  rule (Claude Code memory, outside the repo) writes them.
- Docs: `docs/ai-workflow.md`, `prompts.md` §0, `docs/README.md` if needed.

This change implements no backlog story (`REC-*`): it is AI workflow tooling.
No story is used as a source, so the `needs-human-validation` restriction
does not apply.

Out of scope: moving any decision step (explore, propose, design, ADRs,
validation with the human, code review) off Opus; Sonnet for
`openspec-apply-change`; a project-wide effort setting; measuring token
spend beyond the side-by-side trial.

## Capabilities

### New Capabilities
None. Model routing and log format are AI workflow tooling with no product
behavior, so the change sets `skip_specs: true`.

### Modified Capabilities
None.

## Impact

- **Rules and docs:** `AGENTS.md`, `docs/ai-workflow.md`, `prompts.md`,
  `docs/prompts-log.md` (intro only), `docs/README.md` if the map changes.
- **Skills:** `.agents/skills/decompose-prd`, `write-adr`, `validate-backlog`,
  `estimate-story` (frontmatter, plus where `write-adr` and `validate-backlog`
  call the new agent). `.agents/skills/` is shared with Cursor and Codex.
- **Agents:** `.claude/agents/story-validator.md` (frontmatter), new
  `.claude/agents/doc-checker.md`.
- **Outside the repo:** the `pend-` memory rule.
- **Code, systems, architecture:** none. No ADR and no C4 change: this is
  development tooling, not the app's architecture.
