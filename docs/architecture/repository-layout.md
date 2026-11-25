# Repository layout

What each folder and top-level file is for. One package holds both the web app
and the ingestion job ([ADR 0005](../adr/0005-single-package-repository-layout.md)).

```
.
+-- README.md              project overview (start here)
+-- CONTRIBUTING.md        how work goes from story to production
+-- prompts.md             AI usage log: tools, models, key prompts
+-- AGENTS.md              context and rules for AI agents
+-- CLAUDE.md              symlink to AGENTS.md (for Claude Code)
+-- docs/
|   +-- README.md          documentation map
|   +-- PRD.md             product requirements
|   +-- development.md     install, run and test locally
|   +-- verify-features.md how to check the three delivered features, with screenshots
|   +-- screenshots/       production screenshots used by the README and the guide
|   +-- ai-workflow.md     how the project is built with AI
|   +-- prompts-log.md     log of the prompts used to build the project
|   +-- checklist.md       delivery checklist
|   +-- api/               OpenAPI spec of the feed API
|   +-- architecture/      C4 diagrams, data model, this file
|   +-- adr/               architecture decision records
|   +-- process/           Definition of Ready and Definition of Done
+-- backlog/               user stories, one file per epic
+-- openspec/              OpenSpec specs and changes
+-- src/
|   +-- app/               Next.js App Router: the page, the feed and recipe components, GET /api/feed
|   +-- lib/
|       +-- feed/          feed logic: cursor, query, route handler, client state, recipe text
|       +-- player/        YouTube IFrame Player adapter and playback rules
|       +-- db/            Drizzle schema, connections, migrations, database test harness
|       +-- catalog/       curated list and recipe loaders (used by scripts/db)
+-- scripts/db/            local seed, roles setup and the curated Shorts and recipes loaders
+-- e2e/                   Playwright end-to-end tests
|   +-- support/           shared test code (stubs, gestures, screen projects)
+-- package.json           one package for the web app and ingestion
+-- playwright.config.ts   E2E test projects (phone-portrait, phone-landscape, desktop)
+-- vitest.config.ts       unit and database tests
+-- drizzle.config.ts      Drizzle migrations settings
+-- docker-compose.yml     local Postgres for development and database tests
+-- .github/workflows/     CI, migrations, curated-data loaders and the production smoke check
+-- .agents/skills/        AI skills (shared by Claude Code, Cursor, Codex)
+-- .claude/
    +-- settings.json      registers the backlog hook
    +-- launch.json        dev server for the in-app browser preview
    +-- hooks/             validate-ac.sh (backlog checks)
    +-- agents/            story-validator agent
    +-- skills/            symlinks to .agents/skills/
```
