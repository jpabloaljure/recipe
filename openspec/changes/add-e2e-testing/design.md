# Design

## Context

See proposal.md - Why. Current state, checked on 2026-11-16:

- The app is a placeholder page (`src/app/page.tsx`, title "Easy Recipes").
  Vitest runs in Node on `src/**/*.test.ts`. CI runs `typecheck`, `test` and
  `build` on push and pull request.
- `tsconfig.json` includes `**/*.ts`, so files under `e2e/` are typechecked
  by `pnpm typecheck` with no extra config.
- `AGENTS.md` forbids libraries outside the stack without human approval and
  an ADR. The human approved Playwright on 2026-11-16.
- The MVP supports Chrome on Android and desktop only (REC-001, decided in
  `backlog/README.md`).
- REC-001's technical check showed that touch behavior over YouTube iframes
  differs between desktop and Android (an overlay broke hard flicks only on
  Android), so emulation cannot replace a real-device check.

## Goals / Non-Goals

**Goals:**
- `pnpm test:e2e` runs the E2E suite locally and in CI with no setup beyond
  installing Chromium once.
- Tests are deterministic: no outside network, no fixed waits, no retries.
- Rules that let every later change write E2E tests the same way, traced to
  spec scenarios.

**Non-Goals:**
- E2E tests of product behavior (each story's change owns them).
- Firefox, WebKit, real-device clouds, visual-regression snapshots,
  performance budgets.

## Decisions

### 1. Playwright Test, Chromium only (new ADR 0006)

Use `@playwright/test` (dev dependency, exact version pinned at apply time)
with only the Chromium browser installed.

- **Why:** it drives real Chromium, the MVP's only engine, with real layout
  and native scrolling (scroll-snap), touch and mobile screen emulation,
  request routing for stubbing YouTube, a `webServer` option to start the
  app, and traces on failure. It runs headless in GitHub Actions.
- **Alternative: Vitest browser mode.** Keeps one runner, but it tests
  components in isolation, not the full page served by Next.js, and its
  gesture and network-routing tools are thinner.
- **Alternative: Cypress.** Mature, but touch and mobile emulation are
  weaker, it runs inside the page (iframes and CDP access are harder), and
  parallel runs are a paid feature.
- **Alternative: manual checks only.** No new dependency, but nothing
  repeats them, which is the problem this change solves.
- This is a new library in the stack, so it gets **ADR 0006 "Playwright for
  end-to-end tests"**, written with the `write-adr` skill. **C4:** no
  diagram changes shape (test tooling is not a container or component); the
  ADR states this and links to no diagram.

### 2. Three projects, all Chromium

`playwright.config.ts` defines:

| Project | Base | Screen |
|---|---|---|
| `phone-portrait` | `devices['Pixel 7']` | portrait, touch, mobile |
| `phone-landscape` | `devices['Pixel 7 landscape']` | landscape, touch, mobile |
| `desktop` | `devices['Desktop Chrome']` | 1280×800 |

A test limits itself to the projects its scenario applies to (for example
with `test.skip` on the project name, wrapped in a helper).

- **Why:** these are the screen shapes REC-001's spec names (phone portrait,
  phone landscape, desktop). Pixel 7 is a common mid-range Android screen.

### 3. Run against the production build

`webServer` runs `pnpm build && pnpm start` on port 3000 in CI, and reuses a
running server locally (`reuseExistingServer: !process.env.CI`). Test
settings: `retries: 0`, `forbidOnly` in CI, `trace: 'retain-on-failure'`,
HTML report to `playwright-report/`.

- **Why:** the production build is what Vercel serves; dev mode adds
  overlays and slower, different behavior. No retries keeps flaky tests
  visible (rule 10).
- **Alternative: test the Vercel preview URL.** Closer to production, but
  CI would wait for Vercel and need its URL; a local production build is
  enough for behavior.

### 4. A shared `test` with a network guard

`e2e/support/test.ts` extends Playwright's `test` with an automatic fixture
that routes every request:

- requests to the app's own origin pass through;
- YouTube embed requests (`youtube.com`, `youtube-nocookie.com`,
  `*.ytimg.com`, `*.googlevideo.com`) get a small local HTML stub page that
  marks itself with `data-testid="youtube-stub"`;
- any other outside request is aborted and recorded, and the test fails at
  teardown, listing the URLs.

Tests import `test` and `expect` from `e2e/support/test.ts`, never from
`@playwright/test` directly.

- **Why:** no outside network makes tests fast and reliable and keeps CI
  from depending on YouTube. Failing on unrouted requests catches new
  outside calls instead of letting them slip through.
- The YouTube stub is a plain page; stories that need player events
  (REC-003, REC-018) extend it in their own changes.

### 5. Gesture helpers

`e2e/support/gestures.ts` exports `swipeNext(page)` and
`swipePrevious(page)` (and a `strength` option for a hard flick):

on every project, a finger stroke built from raw touch events sent through
the Chrome DevTools Protocol (`Input.dispatchTouchEvent`: touchStart, timed
touchMoves, touchEnd), which goes through Chromium's real scroll, fling and
snap path. It works on the `desktop` project too, even without touch
emulation. Event timestamps set the speed: a normal swipe is a slow drag over
70% of the screen; a hard flick covers the same distance at about
12,000 px/s, the top of a real finger flick.

The helpers resolve when the scroll has settled: on a `scrollend` event, or,
when nothing scrolled, after 10 animation frames with no `scroll` event once
the gesture was sent. Never on a fixed delay.

- **Why:** Playwright's touchscreen API only taps; the CDP gesture is the
  closest Chromium offers to a finger swipe.
- **Why not a mouse wheel on desktop (changed during apply, 2026-11-16, with
  the human):** in headless Chromium, `page.mouse.wheel` scrolls instantly,
  so scroll-snap snaps back after a 100 px step and skips past
  `scroll-snap-stop: always` after a long one; a CDP gesture with
  `gestureSourceType: 'mouse'` snaps to the nearest item instead of the
  scroll direction and also skips stops. Neither behaves like a real wheel.
- **Why not `Input.synthesizeScrollGesture` (changed after the first CI run,
  2026-11-16):** it worked on macOS, but on Linux (GitHub Actions and the
  official Playwright Docker image) it sends touchstart and touchend with no
  touchmove, so nothing scrolls. Raw touch events behave the same on both.
- **Flick speed:** synthesized flicks far faster than a finger (about
  20,000 px/s) were seen to skip past `scroll-snap-stop: always`; the hard
  flick stays at a realistic speed so a pass or fail reflects the page.
- **Limit:** this proves the page's wiring, not real input physics. Hard
  flicks on a real Android phone and real mouse-wheel and trackpad scrolling
  on desktop stay manual checks (rule 13).

### 6. E2E test rules live in `AGENTS.md`

A new section "End-to-end (E2E) test rules", after the acceptance-criteria
rules, with these rules:

1. **Purpose:** E2E tests cover spec scenarios that only a real browser can
   show (layout, scrolling, navigation, wiring between components). Logic
   rules stay in Vitest unit tests; E2E tests do not repeat them.
2. **Traceability:** each E2E test checks one spec scenario and is named
   `<capability> › <Requirement> › <Scenario>` with the exact names from
   `openspec/specs/` (or the change's delta spec). A scenario that cannot be
   automated is marked manual in the change's tasks, with the reason.
3. **Shape:** one Given, one When, one Then, with the same limits as the
   acceptance-criteria rules. The test sets up its starting state directly
   (URL, stub data) instead of clicking through earlier steps.
4. **Location:** `e2e/<capability>/<requirement-kebab>.spec.ts`; shared
   code in `e2e/support/`.
5. **No outside network:** import `test` from `e2e/support/test.ts`;
   outside hosts are stubbed or fail the test. Data comes from stub
   sources, never a shared database.
6. **No fixed waits:** `page.waitForTimeout` and sleeps are not allowed.
   Use Playwright's auto-waiting assertions, `expect.poll`, or a helper
   that waits for a named event.
7. **Selectors:** by role, label or `data-testid`; never by CSS class
   (CSS module class names are generated) or by DOM structure.
8. **Browsers and screens:** Chromium only, on the `phone-portrait`,
   `phone-landscape` and `desktop` projects. A test runs on every project
   its scenario applies to.
9. **Independence:** each test opens a fresh page, does not depend on
   another test or on test order, and can run in parallel.
10. **Flaky tests:** retries are off. A test that sometimes fails is a bug:
    fix it, or skip it with `test.fixme` and a link to a backlog story.
11. **CI:** E2E tests run against the production build on every pull
    request and push to `main`; a failure blocks the merge; traces are kept
    on failure.
12. **Done:** a story that changes what the user sees is not `done` until
    every automatable scenario in its spec has a passing E2E test.
13. **Manual checks:** real touch-flick physics on a phone, real mouse-wheel
    and trackpad scrolling on desktop, the YouTube player's own behavior,
    and the performance targets (REC-015) stay manual or spikes; list them
    in the change's tasks.

`openspec/config.yaml` gains a tasks rule pointing at these rules: "For each
spec scenario, include an E2E test task in the same group as the work it
tests, or list the scenario as a manual check with the reason (AGENTS.md E2E
test rules)."

- **Why `AGENTS.md`:** it is where agents and humans already read the
  backlog and BDD rules, and `CLAUDE.md` links to it. The config rule makes
  every `openspec-propose` run apply them.
- **Alternative: a separate `docs/testing.md`.** Easier to grow, but agents
  would need a pointer to find it; can be split out later if the section
  grows.

### 7. CI step

In `.github/workflows/ci.yml`, after `Build`: cache `~/.cache/ms-playwright`
keyed on the Playwright version, run
`pnpm exec playwright install --with-deps chromium`, run `pnpm test:e2e`,
and upload `playwright-report/` and `test-results/` as an artifact when the
step fails. The `webServer` reuses the build from the previous step
(`pnpm start` only, when `.next` exists in CI).

- **Why:** one job keeps the build shared; the cache avoids downloading
  Chromium on every run (system dependencies are still installed).

## Risks / Trade-offs

- [The CDP touch gesture differs from a real finger, so a test passes while
  a real flick fails] → rule 13 keeps real-device flick checks manual;
  REC-015 measures on a real phone.
- [CI time grows by about 1–2 minutes (Chromium install, production start)]
  → browser cache, Chromium only; acceptable for now.
- [The network guard breaks when Next.js or a later feature adds a new
  outside request] → that is intended: the failing test lists the URL, and
  the change that adds the request also adds its stub.
- [Downloading Chromium locally changes the developer's machine cache] →
  it goes into Playwright's own cache folder; the human runs the first
  install (or approves it) at apply time.
- [`scrollend` not firing when a gesture does not move the page (e.g.
  swiping back on the first item)] → the gesture helpers resolve on
  `scrollend` or when the scroll position is unchanged after the gesture
  completes (CDP reports completion), never on a timer.

## Migration Plan

No product code changes. Rollback: revert the change's commit (dependency,
config, `e2e/`, CI step, docs); ADR 0006 would then be superseded.

## Open Questions

None.
