# Tasks

## 1. Agent context

- [x] 1.1 In `AGENTS.md`, replace "Stack: TBD" with the stack table from `design.md` (Next.js App Router + React 19, plain CSS modules, Postgres on Neon, Drizzle, GitHub Actions ingestion, Vercel, pnpm, Vitest; LLM provider TBD) and state that no other library or service is added without human approval; verify `grep -n "TBD" AGENTS.md` shows only the LLM provider and `CLAUDE.md` shows the same text
- [x] 1.2 In `AGENTS.md`, keep the rule that the LLM is called only from the ingestion script, never in the request path (PERF-1); verify the sentence is present

## 2. README

- [x] 2.1 Replace the README "Tech stack" section with the stack table and the three PRD constraints already listed; verify the section no longer says TBD except for the LLM provider
- [x] 2.2 Replace the README "Architecture" section with the C4 container diagram from `design.md`, the request and batch paths, and links to `docs/architecture/` and `docs/adr/`; verify the links resolve and the diagram renders on GitHub or mermaid.live
- [x] 2.3 Leave "Data model", "API specification" and "Getting started" as TBD, pointing to the follow-up work; verify those three sections still say TBD

## 3. Architecture docs (C4 in Mermaid)

- [x] 3.1 Write `docs/architecture/README.md`: what each C4 level shows, the file list, the `Status: Proposed | Current` convention, and when to update a diagram; verify every listed file exists
- [x] 3.2 Write `docs/architecture/c4/01-system-context.md` (`C4Context`: home cook, maintainer, Easy Recipes, YouTube Data API, YouTube IFrame Player, LLM provider); verify it renders on GitHub or mermaid.live
- [x] 3.3 Write `docs/architecture/c4/02-containers.md` with the container diagram from `design.md`; verify it renders
- [x] 3.4 Write `docs/architecture/c4/03-components-web-app.md` (`C4Component`, `Status: Proposed`: feed, player controller, recipe panel, favorites store, share, feed and video route handlers), each component tied to its PRD section; verify it renders
- [x] 3.5 Write `docs/architecture/c4/03-components-ingestion.md` (`C4Component`, `Status: Proposed`: discovery, availability checker, recipe extractor, easy classifier, repository), each tied to ING/EXT IDs; verify it renders

## 4. ADRs and maintenance

- [x] 4.1 Write `docs/adr/template.md` (Status, Date, Context, Decision, Alternatives, Consequences, Links) and `docs/adr/README.md` (index table, numbering and supersede rules, "Pending decisions": LLM provider, captions source after REC-009, favorites recipe copy); verify the index lists every ADR file
- [x] 4.2 Write `docs/adr/0001-record-architecture-decisions.md` (Accepted); verify it follows the template
- [x] 4.3 Write `docs/adr/0002-nextjs-on-vercel.md` (Accepted, alternatives A and C, links to the container diagram); verify it follows the template
- [x] 4.4 Write `docs/adr/0003-postgres-neon-drizzle.md` (Accepted, alternatives SQLite and Prisma); verify it follows the template
- [x] 4.5 Write `docs/adr/0004-ingestion-on-github-actions.md` (Accepted, alternative Vercel Cron, links to the ingestion component diagram); verify it follows the template
- [x] 4.6 Create `.agents/skills/write-adr/SKILL.md` (next number, fill template, update index, mark superseded ADRs, update affected C4 diagrams) and symlink it from `.claude/skills/write-adr`; verify the symlink resolves and the skill's frontmatter has `name` and `description`
- [x] 4.7 Add the ADR/C4 rule to `AGENTS.md`, and `design`/`tasks` rules to `openspec/config.yaml` (architecture decisions name their ADRs and C4 updates, and tasks include them); verify `openspec validate choose-tech-stack` still passes and the config still parses

## 5. Delivery checklist

- [x] 5.1 In `docs/checklist.md`, set item 6 (Tech stack) and item 5 (Architecture) to ✅, with notes pointing to `docs/architecture/` and `docs/adr/`; update "Last updated"; verify the table shows the new statuses

## 6. Final check

- [x] 6.1 Run `openspec validate choose-tech-stack` and verify it passes; verify every ADR is in the index, every Markdown link in `README.md`, `docs/architecture/` and `docs/adr/` resolves, and `AGENTS.md`, `README.md`, the ADRs and the C4 diagrams name the same stack

## Workflow follow-up

- Archive the change after the documentation edits are reviewed.
- Next changes: data model (Drizzle schema), API specification, then scaffolding the app. Each one updates the C4 diagrams and adds ADRs as needed.
