# AGENTS.md — Easy Recipes from YouTube (working title)

Project context for AI agents (Claude Code, Cursor, etc.).

> Note: Claude Code does not read `AGENTS.md` natively. This repo keeps a
> symlink `CLAUDE.md -> AGENTS.md` so both ecosystems share the same context.
> Create it with: `ln -s AGENTS.md CLAUDE.md`

## Project

A mobile-first web app with a vertical feed of YouTube cooking Shorts. Each
video comes with an easy recipe (servings, ingredients, numbered steps),
extracted ahead of time by an LLM. The PRD lives in `docs/PRD.md`: it is the
high-level product description for stakeholders, not the source of truth.
When a decision changes the product, update the PRD in the same change so it
stays aligned with the backlog, code and documentation; detail stays in the
backlog and docs.

### Stack

Decided in the OpenSpec change `choose-tech-stack` (ADRs 0002–0004 in
`docs/adr/`), plus Playwright in `add-e2e-testing` (ADR 0006):

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Web app + API | Next.js (App Router) with React 19 |
| Styling | Plain CSS modules |
| Database | Postgres on Neon |
| Data access + migrations | Drizzle ORM |
| Daily ingestion | Node TypeScript script on a GitHub Actions schedule |
| Hosting + CDN | Vercel |
| Package manager / tests | pnpm, Vitest (unit), Playwright (end-to-end, Chromium) |
| LLM provider | TBD (pending decision in `docs/adr/README.md`) |

- Do not add any other library, framework or service without human approval
  (and an ADR).
- The LLM is called only from the ingestion script, never in the request
  path (PERF-1).

### Architecture records (ADRs and C4)

- Architecture decisions are recorded as ADRs in `docs/adr/`; the
  architecture is drawn as C4 diagrams (Mermaid) in `docs/architecture/c4/`.
- Every architecture decision gets an ADR, written with the `write-adr`
  skill. Undecided items go to "Pending decisions" in `docs/adr/README.md`,
  not into an ADR.
- Any change that adds, removes or replaces an external system, a container
  (app, database, job, hosting) or a major component updates the matching C4
  diagram in the same change.
- Accepted ADRs are never edited; a new ADR supersedes them.

Language: all project artifacts (backlog, specs, docs) are written in English.

## Backlog

The backlog lives in files under `backlog/`. No external tracker is used yet.

- One file per epic: `backlog/E<NN>-<slug>.md`, with frontmatter `id`,
  `title`, `prd-goal`.
- Each user story is a `## REC-<NNN> · <title>` section inside its epic file.
  IDs are global and never reused or renumbered.
- Each story starts with a metadata list:
  - **Status:** `todo` | `in-progress` | `blocked` | `done`
  - **Labels:** one each of module, type, size (see below)
  - **PRD:** the PRD sections/IDs the story comes from (e.g. `5.2, PERF-3`)
  - **Flags:** e.g. `needs-human-validation`, `needs-splitting`,
    `blocked-by:REC-014`, or `—`
  - **AI estimate:** the `estimate-story` opinion in Fibonacci story points
    (`1` | `2` | `3` | `5` | `8` | `13`) or, for a spike, a timebox (e.g.
    `spike 8h`); `—` until estimated. One voice in the team's estimate.
  - **Estimate:** the team-agreed estimate, same scale as `AI estimate`; `—`
    until the team estimates.
- Each story ends with `### Estimation notes`: the reasoning for the `size:*`
  label (from `decompose-prd`), then the AI estimate's justification (from
  `estimate-story`).
- Conventions are summarized in `backlog/README.md`.

### Estimation

- `size:*` is a rough t-shirt scope set when the story is created.
  `AI estimate` and `Estimate` are Fibonacci story points.
- Order: acceptance criteria approved by the human → `AI estimate` from
  `estimate-story` → team `Estimate` entered by the human. No estimate before
  the criteria are approved.
- Size and points should agree; `estimate-story` warns (does not change the
  label) when they don't:

  | `size:*` | Story points |
  |---|---|
  | S | 1–2 |
  | M | 3–5 |
  | L | 8 |
  | XL | 13 |

  More than 13 points: do not estimate; flag `needs-splitting` and propose a
  split.
- Spikes are never estimated in points: both estimates are a timebox in hours
  (`spike <N>h`).

Epics map to PRD goals: E01 = G1 (browse with no waiting),
E02 = G2 (recipe for every video), E03 = G3 (save and share without an
account), E04 = launch readiness (PRD §8).

### Labels (every story, ALWAYS one of each)
- Size: `size:S`, `size:M`, `size:L`, `size:XL`
- Type: `type:feature`, `type:bug`, `type:refactor`, `type:docs`, `type:spike`
- Module: `module:feed`, `module:playback`, `module:recipe-panel`,
  `module:extraction`, `module:ingestion`, `module:favorites`, `module:sharing`

User stories use the format "As a [role], I want [action], so that [benefit]".
Roles from the PRD: **home cook** (§3) and **maintainer** (§6.4, operations only).
Acceptance criteria use the Given/When/Then format, following the rules below.

### Acceptance criteria (BDD) rules

One behavior per scenario, kept short. Each acceptance-criteria scenario has
exactly one `Given`, one `When` and one `Then`.

- `Given`: at most two `And`/`But` steps after it (three preconditions at most).
- `When`: no `And`/`But` after it. It is one action, written as what the user
  achieves (`When I save the recipe`), not each click.
- `Then`: at most two `And`/`But` steps after it (three results at most), all
  coming from the same action.
- Preconditions go under `Given`, even if they are actions the user took
  earlier.
- If a scenario needs a second action or more steps than this allows, split it
  into separate scenarios.
- If a story's acceptance criteria keep breaking these limits, flag the story
  `needs-splitting`.

Quick test: if you can't name the scenario as one behavior without using
"and", split it.

### End-to-end (E2E) test rules

E2E tests use Playwright in Chromium (ADR 0006). Run them with
`pnpm test:e2e`. Shared code is in `e2e/support/`.

1. **Purpose:** E2E tests cover spec scenarios that only a real browser can
   show (layout, scrolling, navigation, wiring between components). Logic
   rules stay in Vitest unit tests; E2E tests do not repeat them.
2. **Traceability:** each E2E test checks one spec scenario and is named
   `<capability> › <Requirement> › <Scenario>` with the exact names from
   `openspec/specs/` (or the change's delta spec). A scenario that cannot be
   automated is marked manual in the change's tasks, with the reason.
3. **Shape:** one Given, one When, one Then, with the same limits as the
   acceptance-criteria rules above. The test sets up its starting state
   directly (URL, stub data) instead of clicking through earlier steps.
4. **Location:** `e2e/<capability>/<requirement-kebab>.spec.ts`; shared code
   in `e2e/support/`.
5. **No outside network:** import `test` and `expect` from
   `e2e/support/test.ts`, never from `@playwright/test`. Outside hosts are
   stubbed there or fail the test. Data comes from stub sources, never a
   shared database.
6. **No fixed waits:** `page.waitForTimeout` and sleeps are not allowed. Use
   Playwright's auto-waiting assertions, `expect.poll`, or a helper that
   waits for a named event (for swipes: `e2e/support/gestures.ts`).
7. **Selectors:** by role, label or `data-testid`; never by CSS class (CSS
   module class names are generated) or by DOM structure.
8. **Browsers and screens:** Chromium only, on the `phone-portrait`,
   `phone-landscape` and `desktop` projects. A test runs on every project
   its scenario applies to (limit it with `onlyOn` from
   `e2e/support/projects.ts`).
9. **Independence:** each test opens a fresh page, does not depend on another
   test or on test order, and can run in parallel.
10. **Flaky tests:** retries are off. A test that sometimes fails is a bug:
    fix it, or skip it with `test.fixme` and a link to a backlog story.
11. **CI:** E2E tests run against the production build on every pull request
    and push to `main`; a failure blocks the merge; traces are kept on
    failure.
12. **Done:** a story that changes what the user sees is not `done` until
    every automatable scenario in its spec has a passing E2E test.
13. **Manual checks:** real touch-flick physics on a phone, real mouse-wheel
    and trackpad scrolling on desktop, the YouTube player's own behavior, and
    the performance targets (REC-015) stay manual or spikes; list them in the
    change's tasks.

## Backlog quality rules

- A story is not set to `Status: done` without acceptance criteria in
  Given/When/Then format. This is enforced by the hook
  `.claude/hooks/validate-ac.sh` (PreToolUse on Write/Edit of
  `backlog/E*.md`). Edits made through shell commands (sed, heredocs) bypass
  the hook, so always edit backlog files with the Write/Edit tools.
- Features not in `docs/PRD.md` are not added to the backlog without prior
  human validation. PRD §4 (Non-goals) and §10 (Future roadmap) are out of
  scope for the MVP.
- Stories flagged `needs-splitting` do not enter a sprint until refined.
- **Human validation.** Every AI-generated story starts with the flag
  `needs-human-validation`. While the flag is present, the story:
  - cannot be started or set to `Status: in-progress` (or `done`);
  - cannot be used as the source of an OpenSpec change (`openspec-propose`,
    `openspec new change`, or any spec/design/tasks written from it).
- The flag is removed only when a human says in chat that the story is
  validated, and only if the story already has a team `**Estimate:**` value
  (not `—`). Agents never remove it on their own initiative, and never set
  `**Estimate:**` themselves.
- To validate stories, use the `validate-backlog` skill: it runs the
  `story-validator` agent (`validate-story` skill) on one story at a time,
  lets the human review and edit, waits for the human to approve the
  acceptance criteria, records the AI estimate and then the team Estimate,
  and logs progress in `backlog/validation-log.md` so validation can stop
  and resume.
- The hook `.claude/hooks/validate-ac.sh` blocks a `needs-human-validation`
  story from moving to `in-progress`/`done`, blocks removing the flag while
  `**Estimate:**` is missing or `—`, and rejects estimate values outside
  `1|2|3|5|8|13` or `spike <N>h`.
- Launch checks (PRD §8: real-device performance, extraction accuracy review)
  are typed `type:spike` with a timebox.

## Contributing

How work flows from story to production (branches, pull requests, the
required AI review, merge, the production smoke check and close-out) is in
[CONTRIBUTING.md](CONTRIBUTING.md). A story becomes an OpenSpec change only
when it meets the [Definition of Ready](docs/process/definition-of-ready.md),
and is set to `Status: done` only when it meets the
[Definition of Done](docs/process/definition-of-done.md).
