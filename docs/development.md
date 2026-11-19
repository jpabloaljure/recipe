# Development

How to install, run and test Easy Recipes on your machine.

## Prerequisites

- Node 26 or later (see `.nvmrc`).
- pnpm: `npm install -g pnpm` (Node 25+ no longer ships Corepack).

The app is a placeholder page for now: no database or environment variables
are needed yet.

## Run the app

```bash
pnpm install      # install dependencies
pnpm dev          # dev server at http://localhost:3000
pnpm build        # production build
```

## Checks

```bash
pnpm typecheck    # TypeScript strict check
pnpm test         # unit tests (Vitest)
```

## End-to-end tests

Playwright in Chromium, on three screen projects: `phone-portrait`,
`phone-landscape` and `desktop` ([ADR 0006](adr/0006-playwright-end-to-end-tests.md)).
The rules for writing them are in [AGENTS.md › End-to-end (E2E) test rules](../AGENTS.md#end-to-end-e2e-test-rules);
shared code is in `e2e/support/`.

```bash
pnpm exec playwright install chromium   # once: download the test browser
pnpm test:e2e                           # build, start and test on 3 screen sizes
pnpm test:e2e --grep @smoke             # smoke test only
```

`pnpm test:e2e` reuses a server already running on port 3000; stop `pnpm dev`
first so the tests run against the production build.

## Test a deployed site

Set `BASE_URL` and Playwright tests that URL instead of starting a local
server. The production smoke check (run automatically after each production
deploy, see [CONTRIBUTING.md › Production smoke check](../CONTRIBUTING.md#production-smoke-check)):

```bash
BASE_URL=https://recipe-henna-pi.vercel.app pnpm test:e2e --grep @smoke --project=desktop --project=phone-portrait
```

## Continuous integration

`.github/workflows/ci.yml` runs typecheck, unit tests, build and E2E tests on
every pull request and push to `main`; `main` is protected and needs it green.
`.github/workflows/smoke-production.yml` runs the smoke test against
production after each deploy.
