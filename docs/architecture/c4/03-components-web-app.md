# C4 Level 3: Components of the web app

Status: Proposed

The main parts inside the Next.js app. Feed and the Feed route are built
(REC-001); the other components are still the plan.

```mermaid
C4Component
  title Easy Recipes - Web app components

  Person(cook, "Home cook")
  System_Ext(ytp, "YouTube IFrame Player")
  ContainerDb(db, "Database", "Postgres on Neon")

  Container_Boundary(web, "Web app (Next.js)") {
    Component(feed, "Feed", "React", "CSS scroll-snap feed, one video per gesture, wrap-around, next page via /api/feed; light shuffle of each page once per visit (5.1, API-2)")
    Component(player, "Player controller", "React + IFrame API", "Autoplay muted, unmute, loop, pause, preload (5.2, PERF-3, PERF-5)")
    Component(panel, "Recipe panel", "React", "Servings, ingredients, steps, source, auto-open (5.3, PERF-4)")
    Component(favs, "Favorites store", "localStorage", "Save, list, remove favorites (5.4)")
    Component(share, "Share", "Web Share API", "Share sheet or copy deep link (5.5)")
    Component(feedApi, "Feed route", "Route handler", "GET /api/feed: ready videos with recipes and title-only needs_recipe videos, newest first with a cursor, cacheable (API-1, API-2, PERF-6)")
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
- Built so far (REC-001, change `add-vertical-swipe-feed`): the Feed, which
  embeds the YouTube player as a plain iframe until the Player controller
  (REC-003) exists, and the Feed route. The Feed route reads the database as
  the read-only role since REC-002 (change `add-database-feed`), and the
  Feed shuffles each page it receives once per visit.
  The diagram stays `Proposed` until the other components exist.

## Related ADRs

- [0002 Next.js on Vercel](../../adr/0002-nextjs-on-vercel.md)
