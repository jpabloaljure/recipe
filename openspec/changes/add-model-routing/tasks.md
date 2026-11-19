# Tasks

## 0. Before starting

- [x] 0.1 Check what Cursor and Codex do with an unknown `effort` field in a `SKILL.md` frontmatter (their skill docs); verify the answer is written in the PR description, and if either rejects it, apply design Decision 7's fallback (tier listed only in the `AGENTS.md` table) in groups 2 and 3

## 1. Routing rule

- [x] 1.1 Add a "Model routing" section to `AGENTS.md`: the tier table (design Decision 1), effort first (Decision 2, including `/effort high` at the start of validation and explore sessions), cheaper models only in forked read-only agents and hand back on doubt (Decision 3), no main-model switch mid-session, never set `CLAUDE_CODE_EFFORT_LEVEL`, and the routing for the generated `openspec-*` skills (Decision 6); verify `CLAUDE.md` (symlink) shows it and no other rule changed
- [x] 1.2 Update `docs/ai-workflow.md`: a "Models" section summarizing the routing and linking the `AGENTS.md` section; verify the link resolves

## 2. Agents

- [x] 2.1 Add `model: opus` and `effort: high` to `.claude/agents/story-validator.md`; verify the frontmatter parses (the agent appears in Claude Code's agent list) and its instructions are unchanged
- [x] 2.2 Create `.claude/agents/doc-checker.md` (`model: haiku`, `effort: low`, tools `Read, Grep, Glob`) with the checks and the `ok` / `problem` / `unsure` report format from Decision 5, never editing files; verify it runs on the current repo and its report lists real file:line evidence, and fix or record anything it finds
- [x] 2.3 Add a `doc-checker` row (and an effort column) to the tools table in `prompts.md` §0; verify the table renders

## 3. Skills and OpenSpec config

- [x] 3.1 Add `effort: high` to `decompose-prd`, `write-adr` and `validate-backlog`, and `effort: medium` to `estimate-story` (Decision 2); verify each frontmatter still parses (the skills appear in the skill list) and no instruction text changed
- [x] 3.2 In `write-adr`, add a last step: run the `doc-checker` agent and fix or dismiss each `problem` and `unsure` item; verify the step names the agent exactly as its file does
- [x] 3.3 In `validate-backlog`, add the one-time Sonnet trial to the first check of the next story (Decision 4: second run called with `model: sonnet`, only Opus findings shown, pass rule, record in the validation log and `docs/ai-workflow.md`), written so it is removed after it runs once; verify the step reads cleanly in the "Per story" list
- [x] 3.4 Add `operations.apply.guidance` and `operations.archive.guidance` to `openspec/config.yaml` (run `doc-checker` before finishing docs and close-out work; raise effort for schema, API contract or design tasks); verify `openspec validate add-model-routing` still passes and `openspec update --dry-run` reports no change to the config

## 4. Prompt log

- [x] 4.1 Add the sentence about Models and Why lines to the intro of `docs/prompts-log.md`, with no other change to the file; verify `git diff` shows only that hunk
- [x] 4.2 Update the `pend-` memory rule (Claude Code memory, outside the repo) to write the **Models:** and **Why:** lines as in Decision 8, run `doc-checker` before the commit, and keep everything else; verify the memory file and its `MEMORY.md` line say so

## 5. Close-out

- [ ] 5.1 Ship through the contribution flow: a `chore/model-routing` branch, a PR using the template, CI green (docs and config only, AI review optional), merge

## Workflow follow-up

- Archive this change after merge (no specs to sync: `skip_specs`).
- After the trial in task 3.3 runs: if it passes, a direct PR sets `story-validator` to `model: sonnet` and removes the trial step; if it fails, a direct PR removes the trial step. Either way the result stays recorded.
