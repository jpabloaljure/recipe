# C4 Level 3: Components of the web app

Status: Proposed

The main parts inside the Next.js app. Built: the Feed, the Feed route, the
Player controller and the Recipe panel and sheet (REC-001 to REC-006, REC-018,
REC-022). Still the plan: the Favorites store, Share, the Video route and the
panel's auto-open (REC-007).

```mermaid
C4Component
  title Easy Recipes - Web app components

  Person(cook, "Home cook")
  System_Ext(ytp, "YouTube IFrame Player")
  ContainerDb(db, "Database", "Postgres on Neon")

  Container_Boundary(web, "Web app (Next.js)") {
    Component(feed, "Feed", "React", "CSS scroll-snap feed, one video per gesture, wrap-around, next page via /api/feed; light shuffle of each page once per visit (5.1, API-2)")
    Component(player, "Player controller", "React + IFrame API", "Autoplay muted, unmute, loop, pause (5.2); warms up the next video and keeps at most three players (REC-004, PERF-3, PERF-5)")
    Component(panel, "Recipe panel", "React", "Servings, ingredients, steps, source; always open beside the video where there is room (REC-006), a sheet opened from a Recipe button where not (REC-022), auto-open (REC-007) (5.3, PERF-4)")
    Component(favs, "Favorites store", "localStorage", "Save, list, remove favorites (5.4)")
    Component(share, "Share", "Web Share API", "Share sheet or copy deep link (5.5)")
    Component(feedApi, "Feed route", "Route handler", "GET /api/feed: ready videos with recipes and title-only needs_recipe videos, newest first with a cursor, cacheable (API-1, API-2, PERF-6)")
    Component(videoApi, "Video route", "Route handler", "GET /api/videos/{youtubeId}: one feed video for deep links (API-3)")
  }

  Rel(cook, feed, "Swipes")
  Rel(feed, player, "Controls active video")
  Rel(player, ytp, "Embeds and controls", "IFrame Player API")
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
- Built so far (REC-006, change `add-recipe-panel`): the Recipe panel beside the
  video where there are at least 260 px on each side. It is one panel next to
  the feed's scroll container, shown by a CSS rule on the room beside the video,
  and follows the active video. Built since (REC-022, change
  `add-recipe-sheet`): the "Recipe" button over the video, above the unmute
  button's place, and the sheet it opens, where there is no room for the panel
  and the unmute button is over the video; the sheet is also one element next to
  the scroll container, and a turn or resize swaps it with the panel. The button
  beside the video (REC-023) and the auto-open (REC-007) are not built.
- Component names are a plan; the scaffolding change may rename or merge
  them and must update this diagram (and set `Status: Current`).
- Built so far (REC-001, change `add-vertical-swipe-feed`): the Feed and the
  Feed route. The Feed route reads the database as the read-only role since
  REC-002 (change `add-database-feed`), and the Feed shuffles each page it
  receives once per visit.
- Built in REC-003 (change `add-autoplay-playback`): the Player controller,
  for autoplay muted, unmute, sound carried over per tab, loop with an `ended`
  event, and pause and resume. It controls one player per mounted iframe through
  the YouTube IFrame Player API (ADR 0008). REC-004 adds the warm-up of the next video (muted, about a second, then paused) and the cap of three live players (the feed mounts only the active slide and its two neighbours).
  The diagram stays `Proposed` until the other components exist.

## Related ADRs

- [0002 Next.js on Vercel](../../adr/0002-nextjs-on-vercel.md)
- [0008 YouTube IFrame Player API for playback control](../../adr/0008-youtube-iframe-player-api.md)
