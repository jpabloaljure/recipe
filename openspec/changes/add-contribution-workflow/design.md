# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-16:

- **Rules that already exist:** `AGENTS.md` holds the backlog rules
  (validation, Given/When/Then limits, estimates, `needs-splitting`) and the
  13 E2E test rules. `.claude/hooks/validate-ac.sh` enforces part of the
  backlog rules. `openspec/config.yaml` stops changes from unvalidated
  stories.
- **GitHub:** `main` requires a PR and the CI `check` (enforced for admins),
  with 0 required approvals and conversation resolution off. All three merge
  methods are allowed (PRs #1, #3 and #4 used merge commits); head branches
  are not deleted automatically. There is no `.github/pull_request_template.md`,
  no `CODEOWNERS` and no `CONTRIBUTING.md`. The only collaborator is the
  owner, and GitHub does not let an author approve their own PR.
- **Deploys:** Vercel's GitHub integration builds every push (the "Vercel"
  check on PRs) and deploys `main` to production at
  `recipe-henna-pi.vercel.app`, which is public.
- **E2E:** Playwright always starts a local production server
  (`webServer`); `@smoke` (`e2e/app/smoke.spec.ts`) checks the home page
  title and console errors.

Decisions below were made with the human in an explore session on
2026-11-16.

## Goals / Non-Goals

**Goals:**
- One place each for "ready", "done" and "how to contribute", that agents
  and humans link to instead of restating rules.
- A review step that actually happens while the owner is the only human.
- A recorded, automatic check that production works after each merge.

**Non-Goals:**
- Required human approvals (impossible with one collaborator).
- An AI reviewer running on GitHub with its own identity (a later change
  with an ADR, if wanted).
- Changing any backlog rule or the hook.

## Decisions

### 1. Three documents: CONTRIBUTING.md plus separate DoR and DoD

- `CONTRIBUTING.md` (repo root, where GitHub links it from new PRs): the
  flow, branch and commit naming, the review steps, and the merge and
  close-out steps.
- `docs/process/definition-of-ready.md` and
  `docs/process/definition-of-done.md`: checklists only. Each item links to
  the rule that defines it (`AGENTS.md` sections, E2E rules) instead of
  repeating it, so the rules keep one source.
- `AGENTS.md` gets a short "Contributing" section linking the three;
  `README.md`'s AI-assisted workflow section links them too.

- **Why separate DoR/DoD files:** they are linked from several places (PR
  template, `AGENTS.md`, skills, CONTRIBUTING); a file is a stable link
  target, and CONTRIBUTING stays about the flow.
- **Alternative: all in CONTRIBUTING.md.** One file fewer, but it grows long
  and links depend on heading anchors.

### 2. Definition of Ready (a story may become an OpenSpec change)

1. Story follows the backlog format: user story sentence, one label of each
   kind, PRD trace (`AGENTS.md` "Backlog").
2. Acceptance criteria in Given/When/Then within the BDD limits, approved by
   a human (`AGENTS.md` "Acceptance criteria (BDD) rules").
3. `needs-human-validation` removed and a team `Estimate` set (enforced by
   the hook).
4. Not flagged `needs-splitting`; estimate at most 13 points (or a spike
   timebox).
5. No open `blocked-by:REC-NNN` (the blocker is `done`).
6. Dependencies, risks and open decisions written in Technical context; any
   spike that de-risks the story is done.
7. Out-of-scope items name the stories that own them.

Spikes use items 1–5 only.

### 3. Definition of Done (a story may be set to `Status: done`)

- **Code and tests:** all OpenSpec tasks checked and
  `openspec validate --strict` passes; unit tests for logic; an E2E test for
  every automatable spec scenario, the rest listed and done as manual checks
  (E2E rules 12–13); CI `check` green.
- **Docs and architecture:** ADRs and C4 updates the design named are done;
  README and docs updated if behavior or setup changed.
- **Review and merge:** PR uses the template and the author self-reviewed;
  AI review run and every comment resolved (Decision 4); merged to `main`
  through the PR.
- **Production:** the production smoke check (Decision 6) is green on the
  merge commit, and the changed feature was looked at on the production URL.
- **Close-out:** OpenSpec change archived (specs synced to `openspec/specs/`);
  story set to `Status: done`; backlog and validation log updated.

Spikes: findings recorded where the story says, timebox respected, follow-up
stories created; no code DoD items unless the spike produced code for `main`.

### 4. Review flow: required local AI review, optional human review

Steps before merge, in order:

1. CI `check` passes (required by branch protection).
2. The author self-reviews against the PR template's checklist.
3. **AI review:** `/code-review --comment <PR#>` runs locally in Claude Code
   and posts its findings as PR review comments (from the author's GitHub
   account through `gh`). The author fixes or answers each one and resolves
   the thread. **Required**, except for docs-only PRs (only Markdown or
   other non-code files changed), where it is optional.
4. **Human review:** optional. CODEOWNERS (`* @jpabloaljure`) requests a
   review automatically; it is not required.
5. Merge when CI is green and every conversation is resolved.

Settings that make this hold: required approvals stay **0**; **conversation
resolution required** is turned on, so any comment, from the AI review or a
person, blocks merge until resolved.

- **Why local:** no new service, secret or ADR; the human chose it over a
  GitHub Action. **Trade-off:** GitHub cannot require that the AI review ran;
  it is a checklist item in the template. Once it has posted comments,
  conversation resolution makes them binding.
- **Why the docs-only exemption:** prompt-log and similar PRs would wait on
  a review of Markdown text; the `pend-` flow merges those without asking.
- **When a second person joins:** set required approvals to 1 and turn on
  "require review from Code Owners"; the flow stays the same.

### 5. PR template

`.github/pull_request_template.md` sections: **What**, **Why**, **Story and
OpenSpec change** (REC ID, change path, or "none: tooling/docs"), **How it
was tested** (commands and results), **Manual checks** (E2E rule 13 items
and results), **Notes for reviewers**, then the **DoD checklist** for the
PR's part (tests, CI, docs/ADR, self-review, AI review or docs-only,
conversations resolved), and **Reviewer (optional)**. It links the DoD file
rather than copying every item.

### 6. Production smoke check after each deploy

- `playwright.config.ts`: when `BASE_URL` is set, use it as `baseURL` and
  skip `webServer`; otherwise behave as today. The network guard already
  treats `baseURL`'s origin as the app's own.
- `.github/workflows/smoke-production.yml`, triggered by GitHub's `status`
  event: runs only when the commit status named `Vercel` turns `success` on
  a commit on `main` (that is the production deploy); checks out that commit
  (`github.event.sha`); installs dependencies and Chromium (cached as in
  `ci.yml`); runs
  `pnpm test:e2e --grep @smoke --project=desktop --project=phone-portrait`
  with `BASE_URL` set to the production domain; uploads the report on
  failure. The run is named after the deployed commit; GitHub attaches it to
  `main`'s latest commit (GITHUB_SHA for `status` events). Concurrency is
  per commit at job level, so a later status never cancels a running smoke.
- **Why `status`, not `deployment_status`:** checked at apply time
  (2026-11-16), Vercel creates no GitHub deployments or environments for this
  repo; it only posts a commit status named `Vercel`. The human chose the
  `status` trigger over changing Vercel settings or waiting on a build ID.
- **Which URL:** the production domain (`https://recipe-henna-pi.vercel.app`,
  kept as a workflow env value), not the deployment's own generated URL,
  which Vercel's deployment protection may put behind a login.
- **Why automatic:** a manual command leaves no record; the human chose
  this. It needs no secrets (public site) and no new system.
- **Not a required check:** it runs after the merge, so it cannot block it;
  a red result means production is broken and is fixed in a new PR (or a
  Vercel rollback).

### 7. Repository settings and conventions

- **Merge method:** merge commits only (squash and rebase off), matching the
  history so far.
- **Delete head branches automatically** after merge.
- **Branch names:** `<type>/<short-name>` with `feat`, `fix`, `docs`,
  `chore`, `test`; story work includes the ID (`feat/rec-001-swipe-feed`).
- **Commit messages:** imperative summary line, a body that says why, and a
  `Co-Authored-By` line when an AI wrote the change.
- **PR titles:** like commit summaries; story ID first when there is one
  (`REC-001: Vertical swipe feed`).
- Settings are changed through the GitHub API (`gh api`) with the human's
  approval at apply time, then read back to verify.

### 8. No ADR, no C4 change

The flow adds no framework, service, data store, container or structural
pattern: GitHub Actions and Vercel are already in the stack (ADRs 0002,
0004). Process documents are not architecture decisions under ADR 0001.

## Risks / Trade-offs

- [The AI review is skipped, since GitHub cannot require it] → template
  checkbox, CONTRIBUTING step, and agents run it as part of the PR flow; a
  GitHub Action can make it enforceable later.
- [AI review comments appear under the owner's name] → accepted for a solo
  project; a bot identity comes with a GitHub Action later.
- [Vercel does not send `deployment_status` events, or names the
  environment differently] → confirmed at apply time: it sends none, so the
  workflow uses the `Vercel` commit status instead (Decision 6). If Vercel
  renames that status context, the workflow stops running; the DoD's
  "smoke check green on the merge commit" item makes that visible.
- [The production domain still serves the previous deployment when the
  event arrives] → the smoke test is version-agnostic (title, no console
  errors), so a race cannot cause a false failure; a later change can check
  a build ID if feature-level checks are added.
- [Conversation resolution blocks merges on trivial comments] → resolving a
  thread with a short reply is enough; that is the intended cost.

## Migration Plan

Docs and settings only; nothing to migrate. Open PRs at apply time (none
expected) would need their conversations resolved. Rollback: revert the
commit and switch the settings back (conversation resolution off, all merge
methods on, branch auto-delete off).

## Open Questions

None.
