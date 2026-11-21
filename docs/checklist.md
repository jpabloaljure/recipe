# Entrega 1 + 2 — Checklist

Tracks what each delivery needs. Entrega 2 includes everything in Entrega 1.
Update the status and notes as items are done.

Status: ✅ done · 🟡 partial · ❌ missing

_Last updated: 2026-11-21_

## Entrega 1 — Documentation

Delivered on branch `feature/entrega-1-jpa`. Open items carry over to Entrega 2.

| # | Item | Status | Where | Notes / what's left |
|---|---|---|---|---|
| 1 | README.md (root) | 🟡 | `README.md` | Follows the delivery template (sections 0–7), each section a short summary with links to the full docs; details moved to `docs/` (map in `docs/README.md`). Sections with nothing to show yet are marked TODO with the template's description: 1.3 design/UX (placeholder app), 2.5 security; both are filled in Entrega 2 (item 14). |
| 2 | Prompts log | 🟡 | `prompts.md`, `docs/prompts-log.md` | `prompts.md` is the AI usage log: tools and models by phase, up to 3 key prompts per template section with context and human adjustments, and a human-adjustments summary. `docs/prompts-log.md` is the full log (setup §0 and prompts 1–205), appended with the `pend-` keyword. Still missing: the prompts used to write the PRD itself. |
| 3 | Project info sheet | 🟡 | `README.md` (§0) | Author (Juan Pablo Aljure), short description, project URL and repository filled in. Left: the final product name (working title for now, PRD §12). |
| 4 | Overview (goal and features) | ✅ | `README.md` | Objective, target user and features summarized from the PRD; scope and performance targets linked to the PRD. |
| 5 | Architecture (diagram and components) | ✅ | `docs/architecture/`, `docs/adr/` | C4 levels 1–3 in Mermaid (context and containers Current; web app and ingestion components Proposed) and ADRs 0001–0006. Kept current with the `write-adr` skill. |
| 6 | Tech stack | ✅ | `AGENTS.md`, `README.md` | Next.js + React 19 on Vercel, Postgres on Neon + Drizzle, ingestion on GitHub Actions, pnpm, Vitest (change `choose-tech-stack`); Playwright for end-to-end tests (ADR 0006, change `add-e2e-testing`). LLM provider is a pending decision. |
| 7 | Data model | ✅ | [docs/architecture/data-model.md](architecture/data-model.md) | REC-020 (change `add-data-model-document`): Mermaid ER diagram of video and recipe with field types and keys, the five statuses, the feed-entry time rule and required fields. `Status: Proposed` until REC-019 builds the schema. Whether an ingestion run is stored is a pending decision. |
| 8 | API specification | ✅ | [README › API specification](../README.md#4-api-specification), [docs/api/openapi.yaml](api/openapi.yaml) | REC-021 (change `add-api-specification`): OpenAPI 3.1 for `GET /api/feed` (paged by opaque cursor, up to 10 items) and `GET /api/videos/{youtubeId}`, with item, recipe and error schemas, cache headers, examples and a field-to-column table; the README has an endpoint table. REC-002 and REC-014 implement it. |
| 9 | User stories | 🟡 | `backlog/E01`–`E04` | 21 stories (REC-001 to REC-021): generated with `decompose-prd`, plus REC-019 split out during validation and REC-020/REC-021 (data model and API spec documents). REC-001 (done 2026-11-21), REC-020 and REC-021 are validated and estimated; REC-002 (reopened 2026-11-17, title-only videos, Decided 4) and REC-003 are in review; the other 16 are flagged `needs-human-validation`. Validation in progress with `validate-backlog`. |
| 10 | Work tickets (backend, frontend, DB) | ✅ | `AGENTS.md` ("Story slicing"), `backlog/E01`–`E04` | Stories are full-stack slices by default and split by layer only when needed (change `add-story-slicing-rules`); every story has a `layer:` label. DB: REC-019, REC-020. Backend: REC-005, REC-008, REC-009, REC-010, REC-016, REC-017, REC-021. Frontend: REC-003, REC-004, REC-006, REC-007, REC-011–REC-013, REC-015, REC-018. Full stack: REC-001, REC-002, REC-014. Validated per layer: DB REC-020 (2026-11-17), backend REC-021 (2026-11-18), full stack REC-001 (feed UI plus a stub feed route; re-validated 2026-11-19, was frontend). No frontend-only story is validated yet. |
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
| 12 | Connected scaffolds | ❌ | `src/`, Neon, Vercel, `.github/workflows/` | Web app ↔ `GET /api/feed` ↔ Postgres on Neon ↔ ingestion job scaffold (GitHub Actions), deployed. Needs a Neon database and `DATABASE_URL` in Vercel and GitHub secrets (human). |
| 13 | End-to-end feature | ❌ | production URL | The feed in production shows real videos from the database, one per swipe. REC-001: done 2026-11-21 (PR #43; change `add-vertical-swipe-feed` archived, spec in `openspec/specs/feed/`); production already serves the stub `/api/feed` with 7 fixture videos, title only. REC-019 and REC-002: still `needs-human-validation`; validate before their OpenSpec changes. |
| 14 | Updated files | ❌ | `README.md`, `docs/`, `prompts.md` | README §1.3 screenshots of the feed, §1.4 database setup, §2.4 secrets, §2.5 security practices; C4 levels 2–3 and the data model moved to `Current` where built; `docs/development.md` with the database setup; `prompts.md` with the Entrega 2 prompts. |
| 15 | Tests | ❌ | `src/**/*.test.ts`, `e2e/` | Unit tests for the feed logic, schema rules and API; E2E tests for every automatable feed scenario (stub data, no shared database); device checks on Android and desktop; green smoke check in production. Done for REC-001: Vitest for the feed logic, stub route and HTTP source, Playwright for every automatable feed scenario, device checks passed 2026-11-20, smoke green; its `Hard flick` E2E test is skipped on CI (`backlog/draft-backlog-list.md` D-9). Left: schema, API and ingestion tests (REC-019, REC-002). |

## Suggested order

### Entrega 2

```
validate REC-019 and REC-002 ---------------------------------+
                                                              v
REC-001 swipe feed (done) ------> REC-019 schema on Neon --> REC-002 feed API + ingestion scaffold
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
