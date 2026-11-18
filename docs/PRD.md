# PRD — Easy Recipes from YouTube (working title)

| | |
|---|---|
| **Status** | Draft v0.3 |
| **Date** | 2026-11-14 (updated 2026-11-18) |
| **Scope** | MVP |
| **Platform** | Web app (mobile-first, desktop supported) |

---

## 1. Summary

A web app that shows a vertical, full-screen feed of short YouTube cooking videos (Shorts) with **easy recipes**. Each video has a recipe panel with ingredients, servings, and numbered steps. The recipe is extracted ahead of time by an LLM from the video's **description**, **first comment**, or **captions**. All processing happens in the background, so the feed never waits on extraction. A video whose recipe could not be found still appears, showing its title only.

## 2. Problem

Short cooking videos are fun to watch but hard to cook from. The recipe is fast, often has no written version, or is buried in a long description or a comment. Users have to pause, rewind, and take their own notes.

## 3. Target user

**The casual home cook:** limited time, limited experience, wants something quick to cook today. Watches on a phone and swipes through short videos.

## 4. Goals and non-goals

### Goals (MVP)
1. Browse a curated feed of easy recipe Shorts with no waiting.
2. See the written recipe (ingredients, servings, numbered steps) for every video in the feed that has one; a video with no recipe found shows its title only.
3. Save favorites and share recipes without creating an account.

### Non-goals (MVP)
- User accounts or sync across devices.
- Search, categories, or filters.
- Step timestamps (tap a step to jump to that point in the video).
- Total time / difficulty display.
- User-submitted URLs.
- Languages other than English.
- Engagement analytics.
- Admin UI for adding recipes by hand.
- Native mobile apps.

## 5. User experience

### 5.1 Feed
- Vertical, full-screen feed with one video at a time (Shorts style).
- **No autoscroll.** The user scrolls or swipes to move to the next or previous video.
- On desktop the vertical video is centered and the recipe panel sits beside it. On mobile the panel slides up from the bottom as a sheet.

### 5.2 Playback
- **Autoplay** when a video becomes the active one in the feed.
- **Starts muted** (a browser requirement). One tap unmutes, and the choice is remembered for the rest of the session (later videos play with sound).
- **Loops:** when the video ends it restarts automatically.
- Videos that scroll out of view are paused.

### 5.3 Recipe panel
- Opened and closed from a "Recipe" tab or button on each video.
- **Opens automatically when the video ends for the first time** (at the start of its first repeat). This happens once per video per view. If the user closes the panel, it does not reopen on later loops.
- Contents (MVP):
  - **Servings**
  - **Ingredients** (with quantities)
  - **Numbered steps**
- A small label shows where the recipe came from (description, comment, or captions) and links to the original YouTube video.
- A video whose recipe could not be found (`needs_recipe`, §6.4) shows its title only: it has no recipe panel and never opens one.

### 5.4 Favorites
- A heart icon on each video or recipe saves it to favorites.
- Stored in the browser's **localStorage** (no account). A "Favorites" view lists saved recipes.
- Favorites are lost if the user clears browser data. This is acceptable for the MVP.

### 5.5 Sharing
- A share button uses the native share sheet (Web Share API) when available. Otherwise it copies the link.
- Each recipe has a **deep link** (e.g. `/r/{videoId}`) that opens the feed on that video, with its recipe available (or its title only, for a `needs_recipe` video). A link to a video that is unknown or no longer in the feed opens the regular feed, with no error.

## 6. Functional requirements

### 6.1 Ingestion (backend, scheduled)
| ID | Requirement |
|---|---|
| ING-1 | A scheduled job runs **daily** to discover new candidate videos from YouTube (search queries and/or a list of seed channels). |
| ING-2 | Only **Shorts-length** videos (≤ 3 min) that are **embeddable** and in **English** are kept as candidates. The others are stored as `rejected` (§6.4), so they are skipped next time (ING-3). |
| ING-3 | Videos already in the database are skipped (deduplicated by video ID). |
| ING-4 | Launch catalog: **~50 ready recipes**. The daily job keeps adding new ones. |

### 6.2 Recipe extraction
| ID | Requirement |
|---|---|
| EXT-1 | Sources are tried in priority order: **1. Description → 2. First comment → 3. Captions**. The first source that yields a complete recipe wins. |
| EXT-2 | "First comment" means the top comment, with preference for a comment by the video's own creator (often pinned). |
| EXT-3 | An **LLM** turns the source text into structured data: `servings`, `ingredients[] {name, quantity, unit}`, `steps[]`. |
| EXT-4 | The LLM also returns facts used for the "easy" check: `ingredient_count`, `estimated_active_minutes`, `special_equipment[]`. |
| EXT-5 | A recipe counts as **complete** only if it has at least 2 ingredients and at least 2 steps. |
| EXT-6 | The source that was used is stored (`description` / `comment` / `captions`). |

### 6.3 "Easy" filter
A video is classified as **easy** when all of these hold:
- **≤ 10 ingredients**
- **≤ 30 minutes** estimated active time
- **Common kitchen equipment only** (no sous vide, smoker, etc.)

The raw values are stored, so the thresholds can be changed later without reprocessing. Videos that fail the check never enter the feed.

### 6.4 Video status
| Status | Meaning | In feed? |
|---|---|---|
| `ready` | Recipe extracted and judged easy | ✅ |
| `needs_recipe` | No complete recipe found in any source | ✅ title only, no recipe |
| `not_easy` | Recipe found but fails the easy check | ❌ |
| `unavailable` | Video deleted, private, or no longer embeddable | ❌ |
| `rejected` | Candidate that failed the ING-2 checks; kept so it is skipped next time (ING-3) | ❌ |

Adding a recipe by hand to a `needs_recipe` video is not part of the MVP (see §10).

### 6.5 Feed API
| ID | Requirement |
|---|---|
| API-1 | Returns a paginated feed of `ready` videos with their recipe included, so the panel opens with no extra request, and `needs_recipe` videos with their title only. |
| API-2 | Feed order for the MVP: newest first, with light shuffling so returning users see variety (videos are shuffled within each page of the feed, differently on each visit). |
| API-3 | Returns a single video in the feed (`ready` or `needs_recipe`) by its YouTube ID, for deep links; any other ID is not found. |

## 7. Performance requirements

Speed is a core requirement: users should never wait on videos.

| ID | Target |
|---|---|
| PERF-1 | **Recipe extraction never runs while a user is browsing.** Everything is processed ahead of time. |
| PERF-2 | First video playable in **< 2 s** on a mid-range phone over 4G. |
| PERF-3 | The next video starts in **< 500 ms** after a swipe. The client preloads the next 1–2 videos and their recipes. |
| PERF-4 | The recipe panel opens instantly (its data arrives with the feed). A `needs_recipe` video has no recipe panel. |
| PERF-5 | Only a few video players are kept alive at once (current, previous, next) to keep memory and CPU low. |
| PERF-6 | Feed responses are cacheable (CDN/edge). In the MVP they are cached for up to an hour, so new videos can take up to an hour to appear. |

## 8. Success criteria (MVP)

**Required for launch**
- PERF-2 and PERF-3 met on a real mid-range mobile device.
- **Extraction accuracy:** a manual review of about 50 extracted recipes finds **≥ 90%** correct (ingredients and steps match the video).

**Later (needs analytics)**
- % of views where the recipe panel is opened or stays open.
- Favorites and shares per session.
- Return visits.

## 9. Risks and constraints

| Risk | Impact | Mitigation |
|---|---|---|
| **Captions access:** the official YouTube Data API only lets a video's owner download its captions. | Third-party captions may not be available through the official API. | Captions are the last fallback. Check which options are allowed (e.g. auto-generated transcripts) before building. Without captions, the video is marked `needs_recipe`. |
| **YouTube API quota** (e.g. search calls are expensive). | Limits how many videos can be discovered per day. | Daily batch job, lean on seed channels, cache results. ~50 + daily growth fits comfortably. |
| **YouTube Terms of Service:** videos must play in the official embedded player. | Limits how much playback can be customized. | Use the YouTube IFrame Player API. Never download or re-host videos. Always link back to the original. |
| **Pinned comment not identifiable** through the API. | "First comment" may not be the creator's recipe. | Prefer comments by the channel owner. The LLM checks that the text is actually a recipe. |
| **LLM extraction errors.** | Wrong quantities or missing steps. | Completeness rules (EXT-5), pre-launch accuracy review, `needs_recipe` fallback. |
| **LLM cost.** | Running cost. | Extraction runs once per video. Small daily volume. |
| **Videos removed after ingestion.** | Broken items in the feed. | MVP: the feed skips a video that fails to load, and a maintainer can mark it `unavailable`. A periodic availability check comes after the MVP (§10). |
| **Autoplay rules.** | Sound can't start without a user action. | Muted autoplay plus a tap to unmute (§5.2). |

## 10. Future roadmap (post-MVP)
1. **Step timestamps:** tap a step to jump to that moment in the video.
2. Total time and difficulty in the recipe panel.
3. Review `needs_recipe` videos and add recipes by hand (first by editing the database, later through an admin UI).
4. Search and category filters (once the catalog is around 500+ recipes).
5. Optional accounts for syncing favorites across devices.
6. Engagement analytics.
7. More languages and translated recipes.
8. Users can paste their own YouTube URL.
9. Periodic availability check that marks removed videos `unavailable`.

## 11. Out of scope for this document
Tech stack, hosting, and architecture belong in a separate technical design document.

## 12. Open questions
- [ ] Product name and branding.
- [ ] Seed channels and search queries for discovery.
- [ ] Is it legal to get captions/transcripts for third-party videos? (see Risks)
- [ ] Should favorites also save a copy of the recipe, so it still shows if the video is later removed?
