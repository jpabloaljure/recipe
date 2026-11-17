# Entrega 1 — Checklist

Tracks what the first delivery needs. Update the status and notes as items are
done.

Status: ✅ done · 🟡 partial · ❌ missing

_Last updated: 2026-11-16_

| # | Item | Status | Where | Notes / what's left |
|---|---|---|---|---|
| 1 | README.md (root) | 🟡 | `README.md` | Written with every section. Architecture, tech stack and getting started are filled in (app scaffolded, change `scaffold-web-app`); data model, API spec and work tickets are still TBD. |
| 2 | Prompts log | 🟡 | `docs/prompts.md` | Exists with setup (§0) and prompts 1–15, linked from the README. Still missing: the prompts used to write the PRD itself. |
| 3 | Project info sheet | 🟡 | `README.md` | Table in place with description, platform and PRD status. Repo and deployed URLs filled in; name and author are TBD. |
| 4 | Overview (goal and features) | ✅ | `README.md` | Problem, target user, goals, features, out of scope and performance targets summarized from the PRD. |
| 5 | Architecture (diagram and components) | ✅ | `docs/architecture/`, `docs/adr/` | C4 levels 1–3 in Mermaid (context and containers Current; web app and ingestion components Proposed) and ADRs 0001–0006. Kept current with the `write-adr` skill. |
| 6 | Tech stack | ✅ | `AGENTS.md`, `README.md` | Next.js + React 19 on Vercel, Postgres on Neon + Drizzle, ingestion on GitHub Actions, pnpm, Vitest (change `choose-tech-stack`); Playwright for end-to-end tests (ADR 0006, change `add-e2e-testing`). LLM provider is a pending decision. |
| 7 | Data model | ❌ | — (story REC-020) | Owned by REC-020 (docs only; needs validation). Entities implied by the PRD: video (statuses `ready`, `needs_recipe`, `not_easy`, `unavailable`), recipe (servings, source, raw "easy" facts), ingredient, step, maybe ingestion_run. Needs an ER diagram with fields, types and keys. |
| 8 | API specification | ❌ | — (story REC-021) | Owned by REC-021 (docs only; needs validation; blocked by REC-020). API-1 to API-3 only describe behavior. Write OpenAPI or endpoint tables for at least `GET /feed` (paginated, cacheable) and `GET /videos/{id}`, with request and response schemas. |
| 9 | User stories | 🟡 | `backlog/E01`–`E04` | 21 stories (REC-001 to REC-021): generated with `decompose-prd`, plus REC-019 split out during validation and REC-020/REC-021 (data model and API spec documents). REC-001 and REC-002 are validated and estimated; REC-003 is in review; the rest are flagged `needs-human-validation`. Validation in progress with `validate-backlog`. |
| 10 | Work tickets (backend, frontend, DB) | ❌ | — | Stories don't cover this. Labels are by module, not by layer: either add a `layer:` label or write at least one detailed ticket per layer (backend, frontend, DB). |
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
