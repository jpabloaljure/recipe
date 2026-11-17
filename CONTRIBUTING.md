# Contributing

How work moves from a backlog story to production. Checklists:
[Definition of Ready](docs/process/definition-of-ready.md) (a story may
start) and [Definition of Done](docs/process/definition-of-done.md) (a story
is finished). Project rules live in [AGENTS.md](AGENTS.md).

## Flow

```
backlog story (meets the DoR)
  |
  v
OpenSpec change (openspec-propose: proposal, specs, design, tasks)
  |
  v
branch <type>/<short-name>  -->  openspec-apply-change, commits
  |
  v
pull request (template)
  |
  v
CI `check` green  -->  AI review  -->  human review (optional)
  |
  v
merge (every conversation resolved)
  |
  v
Vercel deploys main  -->  production smoke check
  |
  v
archive the OpenSpec change (docs PR)  -->  story `done` (meets the DoD)
```

Work that implements no story (tooling, docs, process) skips the backlog
steps but follows the same branch, PR and review steps.

## Branches

`main` is protected: every change goes through a pull request and needs the
CI `check` to pass, also for admins. Never push to `main`.

Branch names are `<type>/<short-name>`, with `type` one of `feat`, `fix`,
`docs`, `chore`, `test`. Story work includes the ID:
`feat/rec-001-swipe-feed`. Branches are deleted automatically after merge.

## Commits

- An imperative summary line (`Add swipe feed`, not `Added ...`).
- A body that says why, when the summary does not.
- A `Co-Authored-By:` line when an AI wrote the change.

## Pull requests

- **Title:** like a commit summary; the story ID first when there is one
  (`REC-001: Vertical swipe feed`).
- **Body:** the [PR template](.github/pull_request_template.md) fills in
  automatically. Say what changed and why, link the story and OpenSpec
  change, list how it was tested and the manual checks, and tick the DoD
  items that apply to the PR.
- **Merge method:** merge commits only.

## Review

Before merge, in order:

1. **CI.** The `check` job passes (typecheck, unit tests, build, E2E tests).
   Branch protection requires it.
2. **Self-review.** The author reads the diff against the template's
   checklist.
3. **AI review.** Run locally in Claude Code:

   ```
   /code-review --comment <PR number>
   ```

   It posts its findings as review comments on the PR. Fix or answer each
   one, then resolve the thread. **Required**, except for docs-only PRs
   (only Markdown or other non-code files changed), where it is optional.
4. **Human review.** Optional for now. CODEOWNERS requests a review from the
   owner automatically on PRs opened by anyone else (GitHub never asks a PR's
   author to review it), but it is not required.
5. **Merge** when CI is green and every conversation is resolved. Branch
   protection blocks the merge while any review thread is open.

When a second person joins, required approvals go to 1 with "Require review
from Code Owners"; the flow stays the same.

## Production smoke check

After each merge, Vercel deploys `main` to production
(<https://recipe-henna-pi.vercel.app>). When Vercel reports that deploy as
successful (its `Vercel` commit status on the merge commit), the
[production smoke workflow](.github/workflows/smoke-production.yml) runs the
`@smoke` E2E tests against the production URL. Find its result in the
Actions tab as "Production smoke for <commit sha>"; GitHub attaches the run
to `main`'s latest commit, which is the merge commit unless another merge
followed quickly.

Run the same check by hand:

```bash
BASE_URL=https://recipe-henna-pi.vercel.app pnpm test:e2e --grep @smoke --project=desktop --project=phone-portrait
```

With `BASE_URL` set, Playwright tests that URL and starts no local server.

**If it is red,** production is broken:

1. Open the failed run and its `playwright-report` artifact to see why.
2. If users are affected and the fix is not quick, roll back to the previous
   deployment in Vercel (Deployments, then "Promote to Production" or
   "Instant Rollback").
3. Fix it in a new `fix/...` PR through the same flow, and check that the
   smoke check is green on its merge commit.

## Close-out

After the merge and a green smoke check, archive the OpenSpec change
(`openspec-archive-change`) in a docs PR, then set the story to
`Status: done`. The [Definition of Done](docs/process/definition-of-done.md)
lists everything that must hold.
