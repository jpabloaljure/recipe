# AGENTS.md — Easy Recipes from YouTube (working title)

Project context for AI agents (Claude Code, Cursor, etc.).

> Note: Claude Code does not read `AGENTS.md` natively. This repo keeps a
> symlink `CLAUDE.md -> AGENTS.md` so both ecosystems share the same context.
> Create it with: `ln -s AGENTS.md CLAUDE.md`

## Project

A mobile-first web app with a vertical feed of YouTube cooking Shorts. Each
video comes with an easy recipe (servings, ingredients, numbered steps),
extracted ahead of time by an LLM. The PRD lives in `docs/PRD.md` and is the
product source of truth.

### Stack

Decided in the OpenSpec change `choose-tech-stack` (ADRs 0002–0004 in
`docs/adr/`):

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Web app + API | Next.js (App Router) with React 19 |
| Styling | Plain CSS modules |
| Database | Postgres on Neon |
| Data access + migrations | Drizzle ORM |
| Daily ingestion | Node TypeScript script on a GitHub Actions schedule |
| Hosting + CDN | Vercel |
| Package manager / tests | pnpm, Vitest |
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
