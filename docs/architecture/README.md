# Architecture

Architecture documentation for Easy Recipes, using the
[C4 model](https://c4model.com) with diagrams written in Mermaid. Decisions
behind the architecture are recorded as ADRs in [`../adr/`](../adr/README.md).

## C4 levels

| Level | Shows | File | Status |
|---|---|---|---|
| 1. System context | The system, its users, and the external systems it depends on | [c4/01-system-context.md](c4/01-system-context.md) | Current |
| 2. Containers | The deployable parts (web app, API, database, ingestion job) and how they talk | [c4/02-containers.md](c4/02-containers.md) | Current |
| 3. Components: web app | The main parts inside the Next.js app | [c4/03-components-web-app.md](c4/03-components-web-app.md) | Proposed |
| 3. Components: ingestion | The steps inside the daily ingestion job | [c4/03-components-ingestion.md](c4/03-components-ingestion.md) | Proposed |

Level 4 (code) is not drawn: the code is its own source of truth.

## Other diagrams

Diagrams that are not C4 levels. They follow the same status convention.

| Diagram | Shows | File | Status |
|---|---|---|---|
| Data model | The server data: videos, recipes, statuses and their rules (Mermaid `erDiagram`) | [data-model.md](data-model.md) | Current |

## Status convention

Each diagram file starts with a `Status:` line:

- **Proposed**: designed but not built yet. The diagram is the plan.
- **Current**: matches the code (or, for levels 1–2, the decided
  architecture).

Move a diagram from `Proposed` to `Current` in the change that builds it.

## When to update a diagram

Update the matching diagram in the same change (OpenSpec change or PR) that:

| The change… | Update |
|---|---|
| adds, removes or replaces an external system or a type of user | Level 1 |
| adds, removes or replaces a deployable part, database or hosting | Level 2 |
| adds, removes or reshapes a major part inside a container | Level 3 for that container |

If the change comes from an architecture decision, write an ADR first
(`write-adr` skill) and link it from the diagram's "Related ADRs" list.

## Writing diagrams

- One diagram per file, one level and one scope per diagram. Keep them small.
- Use Mermaid's `C4Context`, `C4Container` and `C4Component` diagram types.
  Mermaid's C4 support is still marked experimental; if a diagram does not
  render on GitHub, fall back to a `flowchart` with C4-style labels.
- Check rendering on GitHub or at <https://mermaid.live> before committing.
- Tie components to PRD sections or requirement IDs where possible.
