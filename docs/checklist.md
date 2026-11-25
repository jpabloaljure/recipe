# Entrega 1 + 2 + final — Checklist

Tracks what each delivery needs. Entrega 2 includes everything in Entrega 1, and the final delivery includes both. The final delivery is the full MVP from the PRD; bugs (the draft backlog's `D-` bug rows) are tracked in `backlog/draft-backlog-list.md`, not here.
Update the status and notes as items are done.

Status: ✅ done · 🟡 partial · ❌ missing

_Last updated: 2026-11-25_

## Still missing

Only what is not ✅ yet, in the order that matters for Entrega 2:

1. **README §1.3:** screenshots or a video of the feed (item 14). Needs images from the maintainer.
2. **README §2.5:** the security practices (item 14, also item 1).
3. **README §2.4:** say where the secrets live (item 14).
4. **Decision:** whether C4 level 3 for the web app moves to `Current` (item 14).
5. **Item 15:** record which devices the manual check used.
6. **Entrega 1 carry-overs:** the final product name (item 3), the prompts used to write the PRD (item 2), and 11 stories (REC-005 and REC-008 to REC-017) still flagged `needs-human-validation` (item 9).

Outside the checklist: D-11 (iPhone landscape), the ADR 0007 wording about pool tuning, and daily discovery (REC-005).

## Entrega 1 — Documentation

Delivered on branch `feature/entrega-1-jpa`. Open items carry over to Entrega 2.

| # | Item | Status | Where | Notes / what's left |
|---|---|---|---|---|
| 1 | README.md (root) | 🟡 | `README.md` | Follows the delivery template (sections 0–7), each section a short summary with links to the full docs; details moved to `docs/` (map in `docs/README.md`). Sections with nothing to show yet are marked TODO with the template's description: 1.3 design/UX (placeholder app), 2.5 security; both are filled in Entrega 2 (item 14). |
| 2 | Prompts log | 🟡 | `prompts.md`, `docs/prompts-log.md` | `prompts.md` is the AI usage log: tools and models by phase, up to 3 key prompts per template section with context and human adjustments, and a human-adjustments summary. `docs/prompts-log.md` is the full log (setup §0 and prompts 1–335), appended with the `pend-` keyword. Still missing: the prompts used to write the PRD itself. |
| 3 | Project info sheet | 🟡 | `README.md` (§0) | Author (Juan Pablo Aljure), short description, project URL and repository filled in. Left: the final product name (working title for now, PRD §12). |
| 4 | Overview (goal and features) | ✅ | `README.md` | Objective, target user and features summarized from the PRD; scope and performance targets linked to the PRD. |
| 5 | Architecture (diagram and components) | ✅ | `docs/architecture/`, `docs/adr/` | C4 levels 1–3 in Mermaid (context and containers Current; web app and ingestion components Proposed) and ADRs 0001–0007. Kept current with the `write-adr` skill. |
| 6 | Tech stack | ✅ | `AGENTS.md`, `README.md` | Next.js + React 19 on Vercel, Postgres on Neon + Drizzle, ingestion on GitHub Actions, pnpm, Vitest (change `choose-tech-stack`); Playwright for end-to-end tests (ADR 0006, change `add-e2e-testing`). LLM provider is a pending decision. |
| 7 | Data model | ✅ | [docs/architecture/data-model.md](architecture/data-model.md) | REC-020 (change `add-data-model-document`): Mermaid ER diagram of video and recipe with field types and keys, the five statuses, the feed-entry time rule and required fields. `Status: Current`: REC-019 built the schema and it runs in production since 2026-11-22. Whether an ingestion run is stored is a pending decision. |
| 8 | API specification | ✅ | [README › API specification](../README.md#4-api-specification), [docs/api/openapi.yaml](api/openapi.yaml) | REC-021 (change `add-api-specification`): OpenAPI 3.1 for `GET /api/feed` (paged by opaque cursor, up to 10 items) and `GET /api/videos/{youtubeId}`, with item, recipe and error schemas, cache headers, examples and a field-to-column table; the README has an endpoint table. REC-002 and REC-014 implement it. |
| 9 | User stories | 🟡 | `backlog/E01`–`E04` | 23 stories (REC-001 to REC-023): generated with `decompose-prd`, plus REC-019 split out during validation, REC-022 split out of REC-006 (2026-11-24) and REC-020/REC-021 (data model and API spec documents). REC-001 (done 2026-11-21), REC-019 (done 2026-11-22), REC-020, REC-021 and REC-002 (done 2026-11-22, 8 points) are validated and estimated; REC-003, REC-004 and REC-018 are validated and done (2026-11-24); REC-006 and REC-022 are validated and done (2026-11-25), REC-007 and REC-023 are validated, and the other 11 are not started; those 11 (REC-005 and REC-008 to REC-017) are still flagged `needs-human-validation`. Validation in progress with `validate-backlog`. |
| 10 | Work tickets (backend, frontend, DB) | ✅ | `AGENTS.md` ("Story slicing"), `backlog/E01`–`E04` | Stories are full-stack slices by default and split by layer only when needed (change `add-story-slicing-rules`); every story has a `layer:` label. DB: REC-019, REC-020. Backend: REC-005, REC-008, REC-009, REC-010, REC-016, REC-017, REC-021. Frontend: REC-003, REC-004, REC-006, REC-007, REC-011–REC-013, REC-015, REC-018. Full stack: REC-001, REC-002, REC-014. Validated per layer: DB REC-019 (2026-11-21, done 2026-11-22) and REC-020 (2026-11-17), backend REC-021 (2026-11-18), full stack REC-001 (feed UI plus a stub feed route; re-validated 2026-11-19, was frontend). No frontend-only story is validated yet. |
| 11 | Git repo | ✅ | [github.com/jpabloaljure/recipe](https://github.com/jpabloaljure/recipe), `.github/workflows/ci.yml` | Pushed to `main`; CI (typecheck, unit tests, build, E2E tests) runs on pull requests and pushes to `main`. `main` is protected (PR and green `check` required); the PR flow, DoR and DoD are in `CONTRIBUTING.md` and `docs/process/`, and a smoke check runs after each production deploy. |

## Entrega 2 — Working code

Connected scaffolds of the architecture and at least one feature working end
to end. Scope chosen 2026-11-19 (option A): **a home cook opens the app and
swipes through real cooking Shorts that come from the database through the
API.** Stories: REC-001 (swipe feed), REC-019 (schema and migration), REC-002
(feed API), plus an ingestion job scaffold that loads a curated list of real
Shorts. Out of scope: daily discovery (REC-005) and recipe extraction (REC-008,
blocked by the LLM provider decision).

| # | Item | Status | Where | Notes / what's left |
|---|---|---|---|---|
| 12 | Connected scaffolds | ✅ | `src/`, Neon, Vercel, `.github/workflows/` | Web app ↔ `GET /api/feed` ↔ Postgres on Neon ↔ ingestion job scaffold (GitHub Actions), deployed. Done (REC-019, 2026-11-22): the Neon project (Postgres 17), the read-only role `app_readonly`, `DATABASE_URL` (pooled, read-only) in Vercel and `DATABASE_URL_DIRECT` (direct, owner) in GitHub Actions secrets, and the migration workflow, whose first run applied the four migrations to production (the tables, three triggers and grants checked in Neon; a write as `app_readonly` is rejected). Done (REC-002, 2026-11-22): the feed route reads the database as `app_readonly`, and the manual loader workflow loaded 27 curated Shorts into production. The ingestion job scaffold for this delivery is the manual loader workflow (`.github/workflows/load-curated.yml`, `scripts/db/load-curated.mts`): it loads a curated list into production as the owner role and is safe to re-run. The daily discovery job (REC-005) is out of scope for Entrega 2. |
| 13 | End-to-end feature | ✅ | production URL | A home cook opens the app and swipes through real cooking Shorts that come from the database through the API. Done 2026-11-22: REC-001 (swipe feed, PR #43), REC-019 (schema on Neon) and REC-002 (PR #59, #61; change `add-database-feed` archived): production serves 24 real Shorts from the database, title only (recipes wait for REC-008), 10 per page with a next cursor, CDN-cached (second request `HIT`); the production smoke run is green and the maintainer checked it by hand on a phone. Known, outside this delivery: on an iPhone in landscape the player's header sits outside the video (`backlog/draft-backlog-list.md` D-11; iOS is outside the MVP), and an empty feed showed a black screen until REC-018 (done 2026-11-24). |
| 14 | Updated files | 🟡 | `README.md`, `docs/`, `prompts.md` | Done: `prompts.md` with the Entrega 2 prompts (REC-001, REC-019, REC-002), the tools and models, the agent context and the human adjustments (2026-11-22); README §1.4 installation (database, seed, `pnpm db:*` commands), `docs/development.md` with the database, seed and loader setup, the data model and C4 level 2 at `Current`. Left: README §1.3 screenshots or a video of the feed (TODO in the README); README §2.5 security practices (TODO in the README); README §2.4 secrets (it describes the roles, not where `DATABASE_URL` and `DATABASE_URL_DIRECT` live: Vercel and GitHub Actions secrets, see `docs/development.md`); C4 level 3 web app is `Proposed` by design until the other components exist (Feed and Feed route are built), so decide whether to move it to `Current`. |
| 15 | Tests | 🟡 | `src/**/*.test.ts`, `e2e/` | Unit tests for the feed logic, schema rules and API; E2E tests for every automatable feed scenario (stub data, no shared database); device checks on Android and desktop; green smoke check in production. Done for REC-001: Vitest for the feed logic, stub route and HTTP source, Playwright for every automatable feed scenario, device checks passed 2026-11-20, smoke green; its `Hard flick` E2E test is skipped on CI (`backlog/draft-backlog-list.md` D-9). Done for REC-019: 68 database tests (one per `video-catalog` scenario, plus the unit-only checks) and unit tests for the client and the local-only guard, run in CI on a `postgres:17` service. Done for REC-002: unit tests for the cursor, route handler, shuffle, recipe mapping, seed and loader rules, 82 database tests in total (the keyset walk with ties, the loader's re-runs), and the `@smoke` test against a seeded database in CI. Done 2026-11-22: the maintainer's manual checks (cache `HIT`, the loaded feed in production, the real-device wrap) were successful, and the production smoke is green on REC-002's merge commit. Left: write down which devices the manual check used (Android and desktop are the supported ones; the iPhone look found D-11), and the ingestion tests, which arrive with daily discovery (REC-005, out of scope). |

## Entrega final — Complete MVP

What is left for a home cook to open the app, swipe through easy recipes and
save or share them (PRD goals G1–G3), and for the launch checks (PRD §8). The
starting point is the end of Entrega 2: the feed serves 24 real Shorts, title
only. Playback (REC-003, REC-004) is done; no other story below is started: the
others still carry `needs-human-validation` (11 of them: REC-005 and REC-008 to REC-017; REC-006, REC-007, REC-018, REC-022 and REC-023 are validated), so each needs validation and a team estimate first
(item 9). Daily ingestion and recipe extraction run in the ingestion job
(GitHub Actions), never in the request path.

| # | Item | Status | Stories | What it needs |
|---|---|---|---|---|
| 16 | Pick the LLM provider | ❌ | pending decision in `docs/adr/README.md` | Decide the provider and model, write the ADR, add the key as a secret. Blocks 17 and 19. |
| 17 | Daily discovery of videos | ❌ | REC-005 | A scheduled job that finds new candidate Shorts. Open decision: which seed channels and search queries. Replaces the hand-loaded curated list. |
| 18 | Recipe panel | 🟡 | REC-006, REC-022, REC-023, REC-007 | Done 2026-11-25: the panel beside the video where there is room, about 260 px on each side (REC-006, change `add-recipe-panel`; the recipes in production are placeholders, draft D-22). Done 2026-11-25 (REC-022, change `add-recipe-sheet`): where there is no room and the unmute button is over the video (a phone in portrait), a Recipe button opens a sheet over the video. Missing: the same for a narrow window (REC-023); where the sheet is used it opens by itself after the first play-through (REC-007). |
| 19 | Recipe extraction | ❌ | REC-008, REC-017, REC-010, spike REC-009 | The LLM extracts the recipe ahead of time from the description, then the top comment; only easy recipes enter the feed; videos with no recipe keep the title only. The captions spike decides whether captions are a third source. |
| 20 | Playback | ✅ | REC-003, REC-004 | Autoplay muted, tap to unmute, loop (REC-003, done 2026-11-24); the next video is warmed up so it starts in under 500 ms in the by-eye check, and at most three players are alive (REC-004, done 2026-11-24). Known limitation: a stall after an unmute on a later video (draft D-12). REC-015 takes the real PERF-3 numbers. |
| 21 | Feed states | ✅ | REC-018 | Done 2026-11-24 (PR #82, change `add-feed-states` archived): a loading, "No recipes yet" and "Oops, something went wrong" view with Retry for the first page (failed, offline or no answer in 10 seconds); an end slide with a loading indicator or retry row while more pages remain; a video that is removed, private or not embeddable is skipped, with "Oops" after 3 skips in a row. The maintainer checked it by hand on the production site. Still open outside this story: a video that never loads, or autoplay refused even when muted (draft D-19, D-20). |
| 22 | Favorites | ❌ | REC-011, REC-012 | Save a recipe and see the saved list, with no account (stored in the browser). Open decision: whether favorites keep a copy of the recipe. |
| 23 | Share and deep link | ❌ | REC-013, REC-014 | Share a recipe by link; the link opens the feed on that recipe (uses `GET /api/videos/{youtubeId}`). |
| 24 | Launch catalog | ❌ | PRD ING-4 | About 50 `ready` recipes in production, up from 24 title-only Shorts. |
| 25 | Launch checks | ❌ | REC-015, REC-016 | Performance on a real mid-range phone (PERF-2, PERF-3); manual review of about 50 recipes with at least 90% correct. Both are timeboxed spikes. |
| 26 | Tests for the new stories | ❌ | all of the above | A passing E2E test for every automatable scenario of each story (E2E rule 12), unit and database tests for the new logic, a green production smoke check. |
| 27 | Final documentation | 🟡 | `README.md`, `docs/`, `prompts.md` | Carry-overs from above: feed screenshots (README §1.3), the final product name, the prompts used to write the PRD, the C4 level 3 decision, the devices of the manual check. Then update the README, PRD, data model, OpenAPI, C4, `prompts.md` and this checklist for what the final delivery built. |
| 28 | Final delivery branch | ❌ | CONTRIBUTING | The branch `final-project-jpa` (the course's `final-project-[INITIALS]` name), with everything merged and CI green. |

Suggested order: item 16 first (it blocks the LLM work), validate the stories
as each one comes up, then 20 and 21 (frontend only, no new decision), 17 and
19 together (both run in the ingestion job), then 18, 22 and 23, and last 24,
25, 26 and 27.

## Suggested order

### Entrega 2

```
validate REC-002 (done 2026-11-22) -----------------------+
                                                              v
REC-001 swipe feed (done) ------> REC-019 schema on Neon (done) --> REC-002 feed API + curated loader (done)
                                                              |
                                                              v
                                    14 README, C4, data model, prompts.md --> branch feature/entrega-2-jpa
```

### Entrega 1

Items 5–8 depend on picking the stack (6), and items 1, 3 and 4 collect everything at the end.

```
6 Tech stack --> 5 Architecture --> 7 Data model --> 8 API spec --> 10 Work tickets
                                                                         |
9 Validate stories ------------------------------------------------------+
                                                                         v
                                          1 README (+3 info sheet, +4 overview, +2 link)
                                                                         |
                                                                         v
                                                                    11 Git repo
```
