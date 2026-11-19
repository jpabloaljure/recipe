# Entrega 1 — Checklist

Tracks what the first delivery needs. Update the status and notes as items are
done.

Status: ✅ done · 🟡 partial · ❌ missing

_Last updated: 2026-11-18_

| # | Item | Status | Where | Notes / what's left |
|---|---|---|---|---|
| 1 | README.md (root) | 🟡 | `README.md` | Follows the delivery template (sections 0–7), each section a short summary with links to the full docs; details moved to `docs/` (map in `docs/README.md`). Sections with nothing to show yet are marked TODO with the template's description: 0.1 author, 1.3 design/UX (placeholder app), 2.5 security. |
| 2 | Prompts log | 🟡 | `prompts.md`, `docs/prompts-log.md` | `prompts.md` is the AI usage log: tools and models by phase, up to 3 key prompts per template section with context and human adjustments, and a human-adjustments summary. `docs/prompts-log.md` is the full log (setup §0 and prompts 1–200), appended with the `pend-` keyword. Still missing: the prompts used to write the PRD itself. |
| 3 | Project info sheet | 🟡 | `README.md` | Table in place with description, platform and PRD status. Repo and deployed URLs filled in; name and author are TBD. |
| 4 | Overview (goal and features) | ✅ | `README.md` | Objective, target user and features summarized from the PRD; scope and performance targets linked to the PRD. |
| 5 | Architecture (diagram and components) | ✅ | `docs/architecture/`, `docs/adr/` | C4 levels 1–3 in Mermaid (context and containers Current; web app and ingestion components Proposed) and ADRs 0001–0006. Kept current with the `write-adr` skill. |
| 6 | Tech stack | ✅ | `AGENTS.md`, `README.md` | Next.js + React 19 on Vercel, Postgres on Neon + Drizzle, ingestion on GitHub Actions, pnpm, Vitest (change `choose-tech-stack`); Playwright for end-to-end tests (ADR 0006, change `add-e2e-testing`). LLM provider is a pending decision. |
| 7 | Data model | ✅ | [docs/architecture/data-model.md](architecture/data-model.md) | REC-020 (change `add-data-model-document`): Mermaid ER diagram of video and recipe with field types and keys, the five statuses, the feed-entry time rule and required fields. `Status: Proposed` until REC-019 builds the schema. Whether an ingestion run is stored is a pending decision. |
| 8 | API specification | ✅ | [README › API specification](../README.md#4-api-specification), [docs/api/openapi.yaml](api/openapi.yaml) | REC-021 (change `add-api-specification`): OpenAPI 3.1 for `GET /api/feed` (paged by opaque cursor, up to 10 items) and `GET /api/videos/{youtubeId}`, with item, recipe and error schemas, cache headers, examples and a field-to-column table; the README has an endpoint table. REC-002 and REC-014 implement it. |
| 9 | User stories | 🟡 | `backlog/E01`–`E04` | 21 stories (REC-001 to REC-021): generated with `decompose-prd`, plus REC-019 split out during validation and REC-020/REC-021 (data model and API spec documents). REC-001, REC-020 and REC-021 are validated and estimated; REC-002 (reopened 2026-11-17, title-only videos, Decided 4) and REC-003 are in review; the other 16 are flagged `needs-human-validation`. Validation in progress with `validate-backlog`. |
| 10 | Work tickets (backend, frontend, DB) | ✅ | `AGENTS.md` ("Story slicing"), `backlog/E01`–`E04` | Stories are full-stack slices by default and split by layer only when needed (change `add-story-slicing-rules`); every story has a `layer:` label. DB: REC-019, REC-020. Backend: REC-005, REC-008, REC-009, REC-010, REC-016, REC-017, REC-021. Frontend: REC-001, REC-003, REC-004, REC-006, REC-007, REC-011–REC-013, REC-015, REC-018. Full stack: REC-002, REC-014. Validated per layer: DB REC-020 (2026-11-17), backend REC-021 (2026-11-18), frontend REC-001 (2026-11-16). |
| 11 | Git repo | ✅ | [github.com/jpabloaljure/recipe](https://github.com/jpabloaljure/recipe), `.github/workflows/ci.yml` | Pushed to `main`; CI (typecheck, unit tests, build, E2E tests) runs on pull requests and pushes to `main`. `main` is protected (PR and green `check` required); the PR flow, DoR and DoD are in `CONTRIBUTING.md` and `docs/process/`, and a smoke check runs after each production deploy. |

## Suggested order

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
