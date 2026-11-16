# Proposal

## Why

PRD §11 defers the tech stack and architecture, and `AGENTS.md` says "Stack:
TBD", so the architecture, data model, API specification and work tickets in
the delivery checklist cannot be written yet. A stack is needed now, and it
must stay simple for the MVP while being able to grow into the PRD §10
roadmap (admin UI, search, accounts, user-submitted URLs) without a rewrite.

The delivery also requires architecture diagrams, and decisions like this one
need a record that outlives a single change. There is no place yet to store
architecture diagrams or decision records, nor a routine to keep them
current as the project grows.

Three options were compared (static feed with no server; Next.js +
Postgres; AdonisJS + React). The user chose **option B: Next.js + Postgres,
kept lean**.

## What Changes

- Record the stack decision, the options considered, and the scaling analysis
  in `design.md`.
- Replace "Stack: TBD" in `AGENTS.md` with the chosen stack, and keep the
  rule that agents add nothing beyond it without human approval.
- Fill the "Tech stack" section of `README.md` and replace its "Architecture:
  TBD" with the C4 container diagram and links to the architecture docs and
  ADRs.
- Add C4 architecture documentation in Mermaid under `docs/architecture/c4/`:
  system context (level 1), containers (level 2), and components (level 3)
  for the web app and the ingestion job. Parts not built yet are marked
  `Proposed`.
- Add Architecture Decision Records under `docs/adr/`: a template, an index
  with a list of pending decisions, and ADRs 0001–0004 (record decisions;
  Next.js on Vercel; Postgres on Neon with Drizzle; ingestion on GitHub
  Actions).
- Add a `write-adr` skill that creates the next ADR, updates the index, and
  updates the affected C4 diagrams.
- Add a rule to `AGENTS.md` and `openspec/config.yaml`: every architecture
  decision gets an ADR, and changes to containers, components or external
  systems update the matching C4 diagram in the same change.
- Update `docs/checklist.md` (tech stack and architecture done).
- No application code. Scaffolding the app is a separate change.

This change implements no backlog story (`REC-*`); it is a project-level
decision, so the `needs-human-validation` restriction does not apply.

## Capabilities

### New Capabilities
None. This change records a technical decision and updates documentation;
it adds no system behavior, so it sets `skip_specs: true`.

### Modified Capabilities
None.

## Impact

- **Docs:** `AGENTS.md` (and `CLAUDE.md`, its symlink), `README.md`,
  `docs/checklist.md`, new `docs/architecture/` and `docs/adr/`.
- **Agent tooling:** new skill `.agents/skills/write-adr/` (symlinked in
  `.claude/skills/`); new `design`/`tasks` rules in `openspec/config.yaml`.
- **Future work unblocked:** data model (Postgres schema via Drizzle), API
  specification (`GET /api/feed`, `GET /api/videos/{id}`), work tickets by
  layer, and the scaffolding change.
- **New external services (once scaffolded):** Vercel (hosting + CDN), Neon
  (Postgres), GitHub Actions (daily ingestion), YouTube Data API v3, an LLM
  provider (still to be chosen).
