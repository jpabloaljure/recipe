# Tasks

## 1. Decision record

- [x] 1.1 Write ADR 0006 "Playwright for end-to-end tests" with the `write-adr` skill (Accepted; human approval 2026-11-16; alternatives: Vitest browser mode, Cypress, manual checks only; Chromium only; links to this change); verify the file follows `docs/adr/template.md` and `docs/adr/README.md` lists it
- [x] 1.2 Check the C4 diagrams against ADR 0006: test tooling adds no container or component, so levels 1–3 keep their content and `Status:` lines; verify no diagram file changed and the ADR says no diagram is affected

## 2. Playwright setup

- [x] 2.1 Add `@playwright/test` as a dev dependency pinned to an exact version, a `test:e2e` script (`playwright test`), and `/test-results/`, `/playwright-report/`, `/blob-report/` to `.gitignore`; verify `pnpm install` succeeds and `package.json` adds no other dependency
- [x] 2.2 Install Chromium for Playwright (`pnpm exec playwright install chromium`; the human runs or approves this first download); verify `pnpm exec playwright --version` prints the pinned version
- [x] 2.3 Add `playwright.config.ts` (design Decisions 2–3): `testDir: 'e2e'`, projects `phone-portrait` (Pixel 7), `phone-landscape` (Pixel 7 landscape), `desktop` (Desktop Chrome, 1280×800); `webServer` on port 3000 (`pnpm start` in CI, `pnpm build && pnpm start` locally, `reuseExistingServer` when not CI); `retries: 0`; `forbidOnly` in CI; `trace: 'retain-on-failure'`; HTML report; verify `pnpm typecheck` passes and `pnpm test` (Vitest) does not pick up `e2e/` files

## 3. Shared test support

- [x] 3.1 Add `e2e/support/test.ts` with the automatic network-guard fixture (design Decision 4): own origin passes, YouTube embed hosts get a local stub page with `data-testid="youtube-stub"`, any other outside request is aborted and fails the test at teardown listing its URLs; export `test` and `expect`
- [x] 3.2 Add `e2e/support/support.spec.ts` self-tests for 3.1, using `page.setContent`: an iframe to `youtube-nocookie.com/embed/x` shows the stub; a request to another outside host makes the test fail (assert it with `test.fail()`); verify `pnpm test:e2e` passes on all three projects
- [x] 3.3 Add `e2e/support/gestures.ts` (design Decision 5): `swipeNext`, `swipePrevious` with a `strength` option, raw CDP touch events (`Input.dispatchTouchEvent`) on every project (no mouse wheel or `synthesizeScrollGesture`: see design Decision 5), resolving on `scrollend` or on gesture completion with no movement, never on a timer; plus a helper to limit a test to given projects
- [x] 3.4 Add self-tests for 3.3 on a `page.setContent` page with a full-height scroll-snap list of five items (`scroll-snap-stop: always`): `swipeNext` moves from item 1 to item 2; `swipePrevious` on item 1 stays on item 1; verify `pnpm test:e2e` passes on all three projects, with no `waitForTimeout` in `e2e/`

## 4. Smoke test

- [x] 4.1 Add `e2e/app/smoke.spec.ts`: the home page loads with the title "Easy Recipes" and no console errors; verify `pnpm test:e2e` passes on all three projects against the production build

## 5. CI

- [x] 5.1 Add the E2E step to `.github/workflows/ci.yml` after `Build` (design Decision 7): cache `~/.cache/ms-playwright` keyed on the Playwright version, `pnpm exec playwright install --with-deps chromium`, `pnpm test:e2e`, upload `playwright-report/` and `test-results/` on failure; verify the YAML parses, then the first run on GitHub (pushed by the human) is green and a deliberately failing test (on a throwaway branch) blocks CI and uploads the report

## 6. Rules and docs

- [x] 6.1 Add the section "End-to-end (E2E) test rules" to `AGENTS.md` after "Acceptance criteria (BDD) rules", with the 13 rules from design Decision 6, and add Playwright (E2E, ADR 0006) to the `AGENTS.md` stack table; verify every rule from the design is present and `CLAUDE.md` (symlink) shows it
- [x] 6.2 Add the tasks rule to `openspec/config.yaml` (design Decision 6); verify `openspec instructions tasks --change add-e2e-testing --json` lists it under `rules`
- [x] 6.3 Update `README.md`: Playwright in the tech stack table; `pnpm exec playwright install chromium` (once) and `pnpm test:e2e` in Getting started; verify each documented command runs as written on the current checkout
- [x] 6.4 Update `docs/checklist.md` (tech stack row mentions Playwright and ADR 0006; architecture row says ADRs 0001–0006); verify the rows match the ADR index

## Workflow follow-up

- Archive this change after CI is green on `main`, then fix ADR 0006's change link to the archived path.
- Then revise `add-vertical-swipe-feed` (REC-001) with `openspec-update-change`: add E2E tests for each automatable `feed` scenario under the new rules, keep only the rule-13 items as manual device checks, and add `data-testid` hooks to the Feed design.
