# Proposal

## Why

The rules for when work may start and when it is finished are spread over
`AGENTS.md`, the backlog hook, the E2E rules and branch protection, and
there is no written contribution flow: no `CONTRIBUTING.md`, no pull request
template, no review step beyond CI. Since 2026-11-16 every change to `main`
goes through a pull request, so the project needs one place that says what
"ready" and "done" mean and how a PR is reviewed and merged, before REC-001
(the first feature story) is built.

## What Changes

- **Definition of Ready** (`docs/process/definition-of-ready.md`): a short
  checklist for "a story may become an OpenSpec change", linking the existing
  backlog rules instead of repeating them.
- **Definition of Done** (`docs/process/definition-of-done.md`): a checklist
  for "a story may be set to `done`": tasks, unit and E2E tests, CI, docs and
  ADRs, PR review, merge, a green production smoke check, change archived.
- **`CONTRIBUTING.md`**: the end-to-end flow (story → OpenSpec change →
  branch → PR → review → merge → production check → archive), branch and
  commit naming, and the review steps:
  - CI `check` passes (required, already enforced);
  - AI review: `/code-review --comment` run locally on the PR, every comment
    resolved before merge (required; optional for docs-only PRs);
  - human review: optional for now.
- **PR template** (`.github/pull_request_template.md`) with the DoD as a
  checklist, and **CODEOWNERS** (`* @jpabloaljure`) so a review is requested
  automatically without being required.
- **Production smoke check**: a GitHub Actions workflow triggered when
  Vercel reports a successful deploy of `main` (its `Vercel` commit status)
  runs the `@smoke` E2E test against each
  successful Production deployment; Playwright gains a `BASE_URL` option to
  test a deployed URL instead of a local build.
- **GitHub settings** (applied with the human's OK): require conversation
  resolution before merge; allow merge commits only; delete head branches
  automatically after merge. Required approvals stay at 0.
- `AGENTS.md` and `README.md` link the new documents.

This change implements no backlog story (`REC-*`). It is project process
that REC-001 (validated, `Estimate: 3`) and every later story follow, so the
`needs-human-validation` restriction does not apply to it. No story's scope
or acceptance criteria change.

Out of scope: an AI review that runs on GitHub (a GitHub Action with its own
identity and a required check), required human approvals, release notes or
versioning, issue templates.

## Capabilities

### New Capabilities
None. Process documents, repository settings and a CI workflow add no
product behavior, so the change sets `skip_specs: true`.

### Modified Capabilities
None.

## Impact

- **Docs:** new `CONTRIBUTING.md`, `docs/process/definition-of-ready.md`,
  `docs/process/definition-of-done.md`; links from `AGENTS.md` and
  `README.md`; `docs/checklist.md` if it tracks process docs.
- **GitHub files:** new `.github/pull_request_template.md`,
  `.github/CODEOWNERS`, `.github/workflows/smoke-production.yml`.
- **Code:** `playwright.config.ts` reads `BASE_URL` (no local server when it
  is set). No application code changes; no new dependencies.
- **GitHub settings:** branch protection on `main` (conversation
  resolution) and repository merge settings. Changing them is the human's
  approval.
- **Systems:** no new system. Vercel's existing GitHub integration posts the
  commit status that starts the check; GitHub Actions runs the check. No secrets: the
  production site is public.
- **Architecture records:** no ADR and no C4 change; the flow adds no
  framework, service or container.
