# C4 Level 2: Containers

Status: Current

The deployable parts of Easy Recipes and how they communicate.

```mermaid
C4Container
  title Easy Recipes - Containers

  Person(cook, "Home cook", "Watches Shorts and cooks from the recipe")
  Person(maint, "Maintainer", "Operates the app: marks broken videos unavailable (PRD 9)")

  System_Ext(ytp, "YouTube IFrame Player", "Plays the videos")
  System_Ext(yapi, "YouTube Data API v3", "Search, video details, comments")
  System_Ext(llm, "LLM provider", "Extracts structured recipes (TBD)")

  System_Boundary(sys, "Easy Recipes") {
    Container(web, "Web app", "Next.js, React 19", "Feed, recipe panel, favorites, sharing")
    Container(api, "API routes", "Next.js route handlers", "GET /api/feed, GET /api/videos/{id}")
    ContainerDb(db, "Database", "Postgres on Neon", "Videos, recipes, statuses")
    Container(ing, "Ingestion job", "Node TypeScript on GitHub Actions", "Daily discovery, extraction, easy check, availability")
  }

  Rel(cook, web, "Uses", "HTTPS, via Vercel CDN")
  Rel(web, api, "Reads feed and videos", "JSON, CDN-cached")
  Rel(web, ytp, "Embeds")
  Rel(api, db, "Reads", "SQL")
  Rel(ing, yapi, "Discovers and checks videos")
  Rel(ing, llm, "Extracts recipes")
  Rel(ing, db, "Writes", "SQL")
  Rel(maint, db, "Fixes video statuses", "Neon console")
```

## Paths

- **Request path:** browser -> Vercel CDN -> Next.js route handler ->
  Postgres. Feed and video responses are CDN-cached (`s-maxage` with
  revalidation), so most requests stop at the CDN (PERF-6).
- **Batch path:** GitHub Actions runs the ingestion job daily. It writes
  videos, recipes and statuses to Postgres. It shares the Drizzle schema and
  types with the web app.
- **Favorites** live in the browser's localStorage, inside the web app
  container (PRD §5.4).

## Related ADRs

- [0002 Next.js on Vercel](../../adr/0002-nextjs-on-vercel.md)
- [0003 Postgres on Neon with Drizzle](../../adr/0003-postgres-neon-drizzle.md)
- [0004 Ingestion on GitHub Actions](../../adr/0004-ingestion-on-github-actions.md)
- [0005 Single-package repository layout](../../adr/0005-single-package-repository-layout.md)
