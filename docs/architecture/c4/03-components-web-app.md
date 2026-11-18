# C4 Level 3: Components of the web app

Status: Proposed

The main parts inside the Next.js app. Not built yet; this is the plan.

```mermaid
C4Component
  title Easy Recipes - Web app components

  Person(cook, "Home cook")
  System_Ext(ytp, "YouTube IFrame Player")
  ContainerDb(db, "Database", "Postgres on Neon")

  Container_Boundary(web, "Web app (Next.js)") {
    Component(feed, "Feed", "React", "Vertical swipe feed, pagination, light shuffle (5.1, API-2)")
    Component(player, "Player controller", "React + IFrame API", "Autoplay muted, unmute, loop, pause, preload (5.2, PERF-3, PERF-5)")
    Component(panel, "Recipe panel", "React", "Servings, ingredients, steps, source, auto-open (5.3, PERF-4)")
    Component(favs, "Favorites store", "localStorage", "Save, list, remove favorites (5.4)")
    Component(share, "Share", "Web Share API", "Share sheet or copy deep link (5.5)")
    Component(feedApi, "Feed route", "Route handler", "GET /api/feed: ready videos with recipes and title-only needs_recipe videos, cacheable (API-1, PERF-6)")
    Component(videoApi, "Video route", "Route handler", "GET /api/videos/{youtubeId}: one feed video for deep links (API-3)")
  }

  Rel(cook, feed, "Swipes")
  Rel(feed, player, "Controls active video")
  Rel(player, ytp, "Embeds")
  Rel(feed, panel, "Opens recipe")
  Rel(feed, favs, "Saves")
  Rel(feed, share, "Shares")
  Rel(feed, feedApi, "Fetches pages", "JSON")
  Rel(feed, videoApi, "Fetches deep-linked video", "JSON")
  Rel(feedApi, db, "Reads", "SQL")
  Rel(videoApi, db, "Reads", "SQL")
```

## Notes

- The recipe arrives with each feed item, so the panel needs no extra
  request (PERF-4).
- Component names are a plan; the scaffolding change may rename or merge
  them and must update this diagram (and set `Status: Current`).

## Related ADRs

- [0002 Next.js on Vercel](../../adr/0002-nextjs-on-vercel.md)
