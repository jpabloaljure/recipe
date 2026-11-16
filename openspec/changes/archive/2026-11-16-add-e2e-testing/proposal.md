# Proposal

## Why

REC-001 (the vertical swipe feed) is the first story whose behavior can only
be seen in a real browser: scrolling, snapping, layout and wrap-around. The
current tests (Vitest in Node) cannot check any of that, so the plan for
REC-001 (`add-vertical-swipe-feed`) relied on one-off hand checks that CI
never repeats. The human approved Playwright on 2026-11-16 and asked for
project rules for end-to-end (E2E) test cases. This is set up once, on its
own, before REC-001 continues, so that REC-001 and every later UI story can
ship its E2E tests with its own work.

## What Changes

- Add Playwright (`@playwright/test`, dev dependency, pinned) with a config
  for Chromium only and three projects: Android phone in portrait, the same
  phone in landscape, and desktop. Tests run against the production build.
- Add shared test support under `e2e/`: a fixture that blocks every request
  to an outside host and serves local stub pages for YouTube embeds, and
  gesture helpers (wheel on desktop, synthesized swipe on phones).
- Add one smoke E2E test of the current placeholder page, plus self-tests of
  the fixture and the gesture helpers.
- Add a `test:e2e` script and an E2E step to the CI workflow.
- Write the **E2E test rules** in `AGENTS.md` (what E2E tests are for,
  traceability to spec scenarios, shape, location, no outside network, no
  fixed waits, selectors, browsers and screens, independence, retries, CI,
  when a story is done, what stays manual).
- Add a tasks rule to `openspec/config.yaml`: every spec scenario gets an E2E
  test task or is listed as manual with a reason.
- Record the decision in a new ADR 0006 "Playwright for end-to-end tests" and
  add Playwright to the stack tables in `AGENTS.md` and `README.md`.

This change implements no backlog story (`REC-*`). It is test tooling that
REC-001 (validated, `Estimate: 3`) and the later UI stories rely on, so the
`needs-human-validation` restriction does not apply to it. No story's scope
or acceptance criteria change. After it lands, `add-vertical-swipe-feed` is
revised to add REC-001's E2E tests under the new rules.

Out of scope: E2E tests for any product behavior (each story's change owns
its own), browsers other than Chromium, visual-regression screenshots,
performance measurement (REC-015), component-testing libraries.

## Capabilities

### New Capabilities
None. Test tooling and project rules add no system behavior, so the change
sets `skip_specs: true`.

### Modified Capabilities
None.

## Impact

- **Code:** new `playwright.config.ts`, `e2e/` (fixtures, gesture helpers,
  smoke and self-tests), `test:e2e` script in `package.json`, Playwright
  output folders in `.gitignore`. No application code changes.
- **Dependencies:** `@playwright/test` (dev only) and the Chromium browser
  that Playwright downloads. Nothing reaches the client bundle.
- **Systems:** the GitHub Actions CI workflow gains an E2E step (Chromium
  install, run, report upload on failure). Vercel is unchanged.
- **Docs:** new ADR 0006 and the ADR index; `AGENTS.md` (stack table, E2E
  test rules); `openspec/config.yaml` (tasks rule); `README.md` (tech stack,
  Getting started); `docs/checklist.md`. The C4 diagrams keep their shape:
  test tooling is not a container or component.
- **Unblocks:** revising `add-vertical-swipe-feed` (REC-001) with E2E tests.
