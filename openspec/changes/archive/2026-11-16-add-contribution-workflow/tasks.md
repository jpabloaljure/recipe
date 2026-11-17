# Tasks

## 1. Definition of Ready and Definition of Done

- [x] 1.1 Write `docs/process/definition-of-ready.md` (design Decision 2): the 7 checklist items plus the spike note, each linking the rule that defines it in `AGENTS.md` instead of restating it; verify every link resolves and no backlog rule text is copied
- [x] 1.2 Write `docs/process/definition-of-done.md` (design Decision 3): code and tests, docs and architecture, review and merge, production, close-out, plus the spike variant, linking `AGENTS.md` (E2E rules 12–13), `CONTRIBUTING.md` and the smoke workflow; verify every link resolves

## 2. Contribution guide

- [x] 2.1 Write `CONTRIBUTING.md` (design Decisions 4 and 7): the flow diagram (story → OpenSpec change → branch → PR → CI → AI review → optional human review → merge → production smoke → archive → done), branch, commit and PR-title conventions, the review steps with the docs-only exemption, what to do when the production smoke check is red, and links to the DoR and DoD; verify every link resolves
- [x] 2.2 Add a "Contributing" section to `AGENTS.md` linking `CONTRIBUTING.md`, the DoR and the DoD (one short paragraph, no rules copied), and link the three from `README.md` ("AI-assisted workflow"); update `docs/checklist.md` if a row covers process docs; verify `CLAUDE.md` (symlink) shows the section

## 3. GitHub templates

- [ ] 3.1 Add `.github/pull_request_template.md` (design Decision 5) with What, Why, Story and OpenSpec change, How it was tested, Manual checks, Notes for reviewers, the DoD checklist for the PR (linking the DoD file) and Reviewer (optional); verify it renders as a new PR's body (checked on this change's own PR in 5.1)
- [x] 3.2 Add `.github/CODEOWNERS` with `* @jpabloaljure`; verify GitHub shows no CODEOWNERS errors on the file's page and requests the owner's review on this change's PR. Result: no errors (`codeowners/errors` on the branch is empty); no review was requested on PR #5 because GitHub never requests a review from the PR's author, so the docs now say the request applies to PRs opened by others

## 4. Production smoke check

- [x] 4.1 Make `playwright.config.ts` use `BASE_URL` as `baseURL` and skip `webServer` when it is set (design Decision 6); verify `pnpm test:e2e` still builds and tests locally (21 passed), and `BASE_URL=https://recipe-henna-pi.vercel.app pnpm test:e2e --grep @smoke` passes against production with no local server
- [x] 4.2 Check that Vercel sends `deployment_status` events for this repo and how it names the production environment (`gh api repos/jpabloaljure/recipe/deployments` and a recent deployment's statuses); verify the environment name used in the workflow filter matches what Vercel sends. Result: no deployments; Vercel posts a `Vercel` commit status instead, so the workflow uses the `status` event (design Decision 6, human's choice)
- [x] 4.3 Add `.github/workflows/smoke-production.yml` (design Decision 6): `status` trigger, run only when the `Vercel` status is `success` on a commit on `main`, checkout `github.event.sha`, pnpm and cached Chromium as in `ci.yml`, `@smoke` on `desktop` and `phone-portrait` against the production domain, report upload on failure; verify the YAML parses (the first real run is checked in 5.2, since `status` workflows run from the default branch)
- [x] 4.4 Document the `BASE_URL` option and the production smoke check in `README.md` (Getting started) and `CONTRIBUTING.md`; verify the documented command runs as written

## 5. GitHub settings and first use (human-approved)

- [x] 5.1 With the human's approval, turn on "require conversation resolution" in `main`'s branch protection, set the merge method to merge commits only, and turn on automatic deletion of head branches (`gh api`); verify by reading the settings back (approvals still 0, `check` still required, admins still enforced)
- [ ] 5.2 Ship this change through the new flow: a `chore/contribution-workflow` branch, a PR using the template, CI green, `/code-review --comment` run and every comment resolved, merge; then verify the production smoke workflow ran on the merge commit and is green, and the branch was deleted automatically

## Workflow follow-up

- Archive this change after 5.2 (through a docs PR, under the new flow).
- Then update `add-vertical-swipe-feed` (REC-001): E2E tasks under the E2E rules and a close-out group that follows the DoD.
