# C4 Level 3: Components of the ingestion job

Status: Proposed

The steps inside the daily ingestion job. Not built yet; this is the plan.

```mermaid
C4Component
  title Easy Recipes - Ingestion job components

  System_Ext(yapi, "YouTube Data API v3")
  System_Ext(llm, "LLM provider", "TBD")
  ContainerDb(db, "Database", "Postgres on Neon")

  Container_Boundary(ing, "Ingestion job (GitHub Actions, daily)") {
    Component(disc, "Discovery", "TypeScript", "Finds English, embeddable Shorts up to 3 min; skips known IDs (ING-1, ING-2, ING-3)")
    Component(avail, "Availability checker", "TypeScript", "Marks deleted, private or non-embeddable videos unavailable (6.4)")
    Component(extract, "Recipe extractor", "TypeScript", "Description, then comment, then captions; completeness rules (EXT-1 to EXT-3, EXT-5, EXT-6)")
    Component(easy, "Easy classifier", "TypeScript", "Stores raw facts and sets ready or not_easy (EXT-4, 6.3)")
    Component(repo, "Repository", "Drizzle", "Reads and writes videos, recipes, statuses")
  }

  Rel(disc, yapi, "Searches, lists videos")
  Rel(disc, repo, "Saves candidates")
  Rel(avail, yapi, "Checks status")
  Rel(avail, repo, "Updates status")
  Rel(extract, yapi, "Reads description, comments")
  Rel(extract, llm, "Extracts recipe")
  Rel(extract, easy, "Passes recipe")
  Rel(easy, repo, "Saves recipe and status")
  Rel(repo, db, "Reads and writes", "SQL")
```

## Notes

- The captions source depends on spike REC-009; until then the extractor
  uses description and comment only (pending decision in
  [`docs/adr/README.md`](../../adr/README.md)).
- The LLM provider is a pending decision; the extractor is the only
  component that depends on it.
- Component names are a plan; the ingestion change must update this diagram
  (and set `Status: Current`).

## Related ADRs

- [0003 Postgres on Neon with Drizzle](../../adr/0003-postgres-neon-drizzle.md)
- [0004 Ingestion on GitHub Actions](../../adr/0004-ingestion-on-github-actions.md)
