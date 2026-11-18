# C4 Level 1: System context

Status: Current

Who uses Easy Recipes and which external systems it depends on.

```mermaid
C4Context
  title Easy Recipes - System context

  Person(cook, "Home cook", "Swipes through recipe Shorts and cooks from the written recipe")
  Person(maint, "Maintainer", "Operates the app: marks broken videos unavailable (PRD 9)")

  System(easy, "Easy Recipes", "Mobile-first web app: feed of easy recipe Shorts with written recipes")

  System_Ext(ytp, "YouTube IFrame Player", "Plays the videos inside the app")
  System_Ext(yapi, "YouTube Data API v3", "Search, video details, comments, availability")
  System_Ext(llm, "LLM provider", "Turns video text into structured recipes (provider TBD)")

  Rel(cook, easy, "Browses, saves, shares", "HTTPS")
  Rel(maint, easy, "Fixes video statuses in the database")
  Rel(easy, ytp, "Embeds videos")
  Rel(easy, yapi, "Discovers and checks videos", "daily")
  Rel(easy, llm, "Extracts recipes", "daily")
```

## Notes

- Video streams come from YouTube, never from our servers (PRD §9).
- The LLM is called only by the daily ingestion job, never while a user is
  browsing (PERF-1).

## Related ADRs

- [0001 Record architecture decisions](../../adr/0001-record-architecture-decisions.md)
- [0004 Ingestion on GitHub Actions](../../adr/0004-ingestion-on-github-actions.md)
