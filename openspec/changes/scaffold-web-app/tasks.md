# Tasks

## 1. Prerequisites (human)

- [x] 1.1 Human installs pnpm (`npm install -g pnpm`; Node 25+ ships no Corepack); verify `pnpm -v` prints a version
- [x] 1.2 Initialize git in the repo root (`git init`, default branch `main`) with no commit yet; verify `git status` runs and lists the existing docs as untracked

## 2. Repository layout decision

- [x] 2.1 Write ADR 0005 "Single-package repository layout" with the `write-adr` skill (Accepted; alternatives: pnpm workspace, root `app/` without `src/`; links to this change, ADRs 0003/0004 and C4 level 2); verify the file follows `docs/adr/template.md` and the index in `docs/adr/README.md` lists it
- [x] 2.2 Check the C4 diagrams against ADR 0005: no container or component changes shape, so levels 1–3 keep their content; add ADR 0005 to the "Related ADRs" list of `docs/architecture/c4/02-containers.md`; verify the diagram file still renders and its `Status:` line is unchanged

## 3. Next.js app

- [x] 3.1 Generate the app at the repo root with `pnpm create next-app` (TypeScript, App Router, `src/` directory, import alias `@/*`, no Tailwind, no linter) without overwriting `README.md` or other existing files; verify `src/app/`, `package.json`, `tsconfig.json` and `next.config.ts` exist and `README.md` is unchanged
- [x] 3.2 Review the generated `package.json` and files against design Decisions 2–4: keep only `next`, `react`, `react-dom`, `typescript` and `@types/*`; remove sample assets, sample fonts and any lint configuration; pin exact versions and set `packageManager` and `engines.node` (`>=24`); verify `pnpm install` succeeds and `package.json` lists no other dependency
- [x] 3.3 Add `.nvmrc` (`24`) and a `.gitignore` covering `node_modules`, `.next`, `.env*` (except `.env.example`), `.vercel` and `*.tsbuildinfo`; verify `git status` does not list `node_modules` or `.next` after a build
- [x] 3.4 Set `strict: true` in `tsconfig.json` and add a `typecheck` script (`tsc --noEmit`); verify `pnpm typecheck` passes
- [x] 3.5 Replace the sample page with the placeholder: `layout.tsx` (lang, title, phone viewport with `viewport-fit=cover`), `globals.css` (full-height dark body, no margins), `page.tsx` (working title only); verify `pnpm dev` serves it at localhost and, at 375×812 in the browser, the page fills the screen with no scrollbars
- [x] 3.6 Verify `pnpm build` completes with no errors or warnings about missing configuration

## 4. Tests

- [x] 4.1 Add `vitest` (dev, pinned), `vitest.config.ts` (environment `node`, include `src/**/*.test.ts`) and a `test` script (`vitest run`); verify `pnpm test` runs
- [x] 4.2 Add one small pure function in `src/lib/` with a test next to it (smoke test of the runner); verify `pnpm test` reports it passing, and fails when the expected value is changed

## 5. CI

- [x] 5.1 Add `.github/workflows/ci.yml` (push and pull request; Node from `.nvmrc`; pnpm install with frozen lockfile; `typecheck`, `test`, `build`); verify the YAML parses, then (after 6.1) the first run on GitHub is green

## 6. Hosting (human-assisted)

- [x] 6.1 Human creates the GitHub repository, adds it as `origin`, and approves the first commit and push; verify the repository shows the files and CI (5.1) passes
- [ ] 6.2 Human creates the Vercel project from the GitHub repository (framework Next.js, Node 24.x, no environment variables); verify the production deployment succeeds
- [ ] 6.3 Open the production URL on Android Chrome and desktop Chrome; verify the placeholder fills the screen and loads without console errors

## 7. Docs

- [ ] 7.1 Fill the README "Getting started" section (prerequisites: Node 24+, pnpm; `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm typecheck`, `pnpm build`) and the Repository and Deployed URL rows; verify each documented command runs as written on the current checkout
- [x] 7.2 Update `docs/checklist.md` (README row: Getting started done; add or update any scaffolding row); verify no row still says "no code exists"

## Workflow follow-up

- Next: an OpenSpec change for REC-001 (validated, Estimate 3), which decides on the component-testing libraries (design Open Questions).
- Archive this change after the production URL check (6.3) passes, then fix ADR 0005's change link to the archived path.
