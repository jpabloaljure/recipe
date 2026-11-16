# 0006. Playwright for end-to-end tests

- **Status:** Accepted
- **Date:** 2026-11-16
- **Deciders:** Project owner

## Context

The only test tool in the stack is Vitest, running in Node (`scaffold-web-app`,
design Decision 3). It checks plain logic, but it cannot check what the user
sees in a browser: layout, native scrolling and scroll-snap, navigation, and
how components work together.

REC-001 (vertical swipe feed, PRD 5.1) is the first story whose behavior can
only be seen in a real browser. Without browser tests, its plan relied on
one-off hand checks that CI never repeats. Every later UI story (playback,
recipe panel, favorites, sharing) has the same need.

The MVP supports Chrome only, on Android and desktop (`backlog/README.md`,
decided while validating REC-001). REC-001's technical check showed that
touch behavior over YouTube iframes differs between desktop and Android, so
emulation cannot fully replace a real phone. `AGENTS.md` allows no new
library without human approval and an ADR; the human approved Playwright on
2026-11-16.

## Decision

We will use Playwright Test (`@playwright/test`, dev dependency only) for
end-to-end (E2E) tests, run in Chromium only.

- Three projects: an Android phone in portrait (Pixel 7), the same phone in
  landscape, and desktop Chrome at 1280×800.
- Tests run against the production build (`next build` + `next start`),
  locally and in GitHub Actions CI, where a failure blocks the merge.
- Every test runs with no outside network: YouTube embeds are served by
  local stub pages, and any other outside request fails the test.
- Swipes are synthesized as touch gestures through the Chrome DevTools
  Protocol on every project, desktop included: in headless Chromium,
  synthesized mouse-wheel scrolls do not follow scroll-snap like a real
  wheel does.
- How E2E test cases are written (traceability to spec scenarios, shape,
  selectors, no fixed waits, what stays manual) is set by the "End-to-end
  (E2E) test rules" in `AGENTS.md`.

## Alternatives

- **Vitest browser mode:** keeps one test runner, but it tests components in
  isolation rather than the full page served by Next.js, and its gesture and
  network-routing tools are thinner.
- **Cypress:** mature, but its touch and mobile emulation are weaker, it runs
  inside the page (iframes and DevTools Protocol access are harder), and
  parallel runs are a paid feature.
- **Manual checks only:** no new dependency, but nothing repeats them, so a
  regression in scrolling or layout would pass CI.

## Consequences

- **Positive:** spec scenarios about layout, scrolling and navigation become
  repeatable tests that run on every pull request, on the screen shapes the
  MVP supports.
- **Positive:** stubbing the outside network keeps tests fast, reliable and
  independent of YouTube.
- **Negative:** CI takes about 1–2 minutes longer (Chromium install,
  production server start), and developers download Chromium once.
- **Negative:** synthesized touch gestures are not real finger physics, and
  real mouse-wheel and trackpad scrolling are not tested at all; a test can
  pass while a hard flick on a real phone or a wheel step on desktop fails.
  These stay manual checks (`AGENTS.md` E2E rules) and REC-015.
- **Negative:** Chromium only; adding another browser later needs its own
  projects and may expose differences the suite has never seen.

## Links

- Change: [`add-e2e-testing`](../../openspec/changes/archive/2026-11-16-add-e2e-testing/design.md) (design Decision 1, archived)
- C4: no diagram affected (test tooling is not a container or component).
- PRD: §5.1, §8 (launch checks)
- Related ADRs: [0002](0002-nextjs-on-vercel.md),
  [0004](0004-ingestion-on-github-actions.md) (GitHub Actions runs CI),
  [0005](0005-single-package-repository-layout.md)
