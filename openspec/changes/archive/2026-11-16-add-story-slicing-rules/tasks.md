# Tasks

## 0. Before starting

- [x] 0.1 Ask the human to commit (through a PR) or set aside their uncommitted backlog, PRD, `AGENTS.md` and skill edits, so this change's commit holds only its own hunks; verify `git status` before the first edit

## 1. Rules in AGENTS.md and the backlog README

- [x] 1.1 In `AGENTS.md`: add `layer:fullstack|db|backend|frontend` to "Labels" as the fourth "one of each" label, `split-from:REC-<NNN>` to the Flags list, a "Story slicing" subsection under Backlog (design Decisions 1 and 3), and the widened maintainer role (Decision 4); verify `CLAUDE.md` (symlink) shows it and no other rule changed
- [x] 1.2 In `backlog/README.md`: the labels line, the `split-from:` flag and a short "Splitting" note linking `AGENTS.md`; verify it agrees with `AGENTS.md`

## 2. Definition of Ready and Done

- [x] 2.1 DoR: add "full-stack story, or a layer story flagged `split-from:` whose parent is `blocked-by` it", linking the new `AGENTS.md` section; verify the link resolves
- [x] 2.2 DoD: say that a `layer:db` or `layer:backend` story that changes nothing the user sees is done with unit or contract tests, and the user-facing slice carries the E2E tests (Decision 5); verify it does not contradict E2E rule 12

## 3. Skills

- [x] 3.1 `decompose-prd`: write the `layer:` label in the story template, cut full-stack stories by default, and use the widened maintainer role; verify the template matches `AGENTS.md`
- [x] 3.2 `validate-story`: check that the story has one `layer:` label, suggest a layer split when a trigger from Decision 1 holds, and for a split check the `split-from:`/`blocked-by:` links and that the parent kept the user-facing criteria
- [x] 3.3 `estimate-story`: in the "more than 13 points" step, propose the split by layer (parent keeps the user-facing slice); verify `validate-backlog` and `story-validator` need no change

## 4. Backlog backfill (human-confirmed)

- [x] 4.1 Show the human the layer table (design Decision 2) and apply their corrections
- [x] 4.2 Add the `layer:` label to all 21 stories (REC-001 to REC-021) and `split-from:REC-001` to REC-018, `split-from:REC-002` to REC-019, with the Edit tool so the hook runs; verify every `## REC-` section has exactly one `layer:` label and no other line changed

## 5. Checklist and close-out

- [x] 5.1 `docs/checklist.md` item 10: the rule and the stories per layer; set its status; update `README.md` if it lists the labels
- [x] 5.2 Ship through the contribution flow: a `docs/story-slicing-rules` branch, a PR using the template, CI green (docs-only, AI review optional), merge
