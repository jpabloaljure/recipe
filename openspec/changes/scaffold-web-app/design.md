# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-16:

- No application code, no `package.json`, and no git repository (README
  lists "Repository: TBD").
- Local Node is v26; pnpm is not installed. Node 25 and later no longer ship
  Corepack, so pnpm must be installed separately.
- ADR 0002 fixes Next.js (App Router), React 19, TypeScript, CSS modules and
  Vercel. ADR 0003 says the Drizzle schema "lives in the repo and is shared
  by the web app and the ingestion job". ADR 0004 says the ingestion job is
  a TypeScript script "in the same repo". `AGENTS.md` forbids any library
  beyond the stack without human approval and an ADR.
- The C4 level 3 web-app diagram is `Proposed`, and its note says the
  scaffolding change may rename components.

## Goals / Non-Goals

**Goals:**
- `pnpm install && pnpm build` works on a fresh clone, locally and on
  Vercel, with no other setup.
- A layout where REC-001's feed, the later API routes, the Drizzle schema
  and the ingestion script each have an obvious place, without moving
  files later.
- CI that fails on type errors, failing tests or a broken build.

**Non-Goals:**
- Any product behavior: feed, player, API routes (REC-001 onward).
- Database, Drizzle, `.env` secrets, the ingestion workflow (data-model and
  ingestion changes).
- A linter or formatter, component-testing libraries, path aliases beyond
  `@/*`, a CSS reset library, analytics.

## Decisions

### 1. One package at the repo root, code under `src/` (new ADR 0005)

```
recipe/
  package.json          one package, one lockfile
  src/
    app/                Next.js App Router (pages, later route handlers)
    lib/                shared code: later the Drizzle schema, feed types
  scripts/              later: ingestion entry point (ADR 0004)
  docs/ backlog/ openspec/   unchanged
```

- **Why:** ADRs 0003 and 0004 need the web app and the ingestion script to
  share the schema and types. One package lets the script import from
  `src/lib` directly, with one `tsconfig` and one lockfile.
- **Alternative: a pnpm workspace** (`apps/web`, `packages/db`,
  `jobs/ingest`). This gives cleaner boundaries, but means three
  `package.json` files, workspace configuration and Vercel root-directory
  settings for an app with one deployable. Revisit if a second deployable
  appears (PRD §10).
- **Alternative: an `app/` folder at the root** without `src/`. This mixes
  application code with docs, backlog and OpenSpec folders.
- This is a structural pattern, so it gets **ADR 0005 "Single-package
  repository layout"**, written with the `write-adr` skill. **C4:** no level
  changes shape (no container or component is added or removed). The ADR
  links to level 2 (containers) because it places the web app and the
  ingestion job in one codebase. The level 3 web-app diagram stays
  `Proposed` until REC-001 builds the Feed.

### 2. Create with `create-next-app`, then trim

Use `pnpm create next-app` with TypeScript, App Router, `src/` directory,
import alias `@/*`, and no Tailwind and no linter. Then remove the sample
assets and styles. Versions are the latest stable releases at apply time,
pinned exactly in `package.json`, with `packageManager: pnpm@<version>`.

- **Why:** the generator produces the configuration that Next.js and Vercel
  expect (`next.config.ts`, `tsconfig.json`, `next-env.d.ts`), which is
  safer than writing it by hand.
- **Alternative: writing the files by hand.** This gives full control, but
  makes it easy to miss Next.js defaults (TypeScript plugin, includes).

### 3. Tests: Vitest in the Node environment only

Add `vitest` plus `vitest.config.ts` (environment `node`, `src/**/*.test.ts`)
and one smoke test of a small pure function in `src/lib`, so the runner and
CI are proven.

- **Why:** Vitest is the decided test tool. Component tests need a DOM
  (`jsdom` or `happy-dom`) and usually `@testing-library/react` and
  `@vitejs/plugin-react`. Those are new libraries, so they are not added
  here. REC-001's change asks for them, with an ADR if approved.

### 4. Type safety instead of a linter

Set TypeScript `strict: true` and add a `typecheck` script (`tsc --noEmit`).
There is no ESLint or Biome.

- **Why:** both are new tools that need approval. With strict typing, a
  typecheck in CI catches most errors for now.
- **Alternative: the ESLint setup that `create-next-app` offers.** It is
  declined by the no-new-library rule. It can be proposed later through an
  ADR.

### 5. Runtime: Node 24 LTS on Vercel and in CI

Set `.nvmrc` to `24`, `engines.node` to `>=24`, the Vercel project's Node
version to 24.x, and use the same version in CI.

- **Why:** Vercel and GitHub Actions run LTS versions. Local Node 26 still
  satisfies `>=24`.
- **Alternative: pin 26.** Production hosts may not offer it yet.

### 6. Placeholder page tuned for mobile

`src/app/layout.tsx` sets the language, title and a viewport for phones
(`width=device-width`, `viewport-fit=cover`). `globals.css` sets a
full-height dark body with no margins. `page.tsx` shows the working title.

- **Why:** REC-001's full-screen feed needs these base styles. Setting them
  now makes the deploy check on a phone meaningful.

### 7. CI on GitHub Actions; deploy through Vercel's Git integration

`.github/workflows/ci.yml` runs on push and pull request: pnpm install
(frozen lockfile), `typecheck`, `test` and `build`. Vercel builds previews
and production from the GitHub repository. There is no deploy step in CI.

- **Why:** GitHub Actions is already in the stack (ADR 0004). Vercel's Git
  integration needs no tokens in CI.
- **Alternative: deploying with the Vercel CLI from CI.** That adds a
  secret and a tool for no gain.

## Risks / Trade-offs

- [The generator adds files or dependencies outside the stack, such as an
  ESLint config or sample fonts] → Review the generated `package.json` and
  file list against Decisions 2–4 before continuing. Remove anything not
  listed there.
- [The git, GitHub and Vercel setup needs the human (accounts, a new remote,
  connecting the project)] → Mark those tasks for the human. The change is
  done only when the production URL serves the placeholder.
- [Installing pnpm globally changes the developer's machine] → The human
  installs it (`npm install -g pnpm`). The agent does not.
- [One package grows messy as ingestion lands] → Folder boundaries
  (`src/app`, `src/lib`, `scripts`) are recorded in ADR 0005. A workspace
  split remains open through a superseding ADR.

## Migration Plan

Nothing exists yet, so there is nothing to migrate. To roll back, delete the
generated files and the Vercel project. The ADR stays as a record (superseded
if the layout changes).

## Open Questions

- Component-testing libraries for REC-001 (`jsdom` or `happy-dom`,
  `@testing-library/react`): decided in REC-001's change, with an ADR if
  added.
- Whether to add a linter or formatter later: deferrable. It does not affect
  this layout.
