# Definition of Done

A story is **done**, and may be set to `Status: done`, when every item below
holds. The flow that gets it there is in
[CONTRIBUTING.md](../../CONTRIBUTING.md); the rules each item points to live
in [AGENTS.md](../../AGENTS.md).

## Code and tests

- [ ] Every task in the story's OpenSpec change is checked, and
  `openspec validate --strict` passes.
- [ ] Logic is covered by Vitest unit tests.
- [ ] Every automatable spec scenario has a passing E2E test; the rest are
  listed as manual checks in the change's tasks and were done
  ([E2E rules](../../AGENTS.md#end-to-end-e2e-test-rules) 12 and 13).
- [ ] CI `check` is green.

## Docs and architecture

- [ ] The ADRs and C4 updates the design named are written
  ([Architecture records](../../AGENTS.md#architecture-records-adrs-and-c4)).
- [ ] README and docs are updated if behavior or setup changed; the PRD is
  updated if the product changed.

## Review and merge

- [ ] The PR uses the template and the author self-reviewed it.
- [ ] The AI review ran and every comment is resolved (optional for
  docs-only PRs); see [Review](../../CONTRIBUTING.md#review).
- [ ] Merged to `main` through the PR.

## Production

- [ ] The [production smoke check](../../.github/workflows/smoke-production.yml)
  is green for the merge commit (its run is named after the commit).
- [ ] The changed feature was looked at on the production URL.

## Close-out

- [ ] The OpenSpec change is archived and its specs are synced to
  `openspec/specs/`.
- [ ] The story is set to `Status: done`; the backlog and
  `backlog/validation-log.md` are updated where they track it.

## Spikes

A `type:spike` story is done when its findings are recorded where the story
says, the timebox was respected and any follow-up stories are created. The
code items apply only if the spike produced code for `main`.
