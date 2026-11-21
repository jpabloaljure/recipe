---
id: E03
title: Save and share recipes without an account
prd-goal: G3
---

## REC-011 · Save a recipe to favorites
- **Status:** todo
- **Labels:** module:favorites, type:feature, size:S, layer:frontend
- **PRD:** 5.4
- **Flags:** needs-human-validation; (assumed) a `needs_recipe` video (title only) can also be saved (Decided 4)
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want to save a recipe with one tap and no account, so that I can find it again when I'm ready to cook.

### Acceptance criteria
- Given a video or its recipe is shown, when I tap the heart icon, then the recipe is saved to favorites and the heart shows as saved.
- Given a recipe is saved, when I tap the heart again, then it is removed from favorites (assumed).
- Given I saved a recipe, when I reload the app in the same browser, then it is still saved (localStorage).
- Given I cleared my browser data, when I open the app, then my favorites are gone and the app works normally with an empty list.

### Technical context
—

### Estimation notes
S: localStorage only, no backend.
Small UI surface on the video and on the panel.

## REC-012 · Favorites view
- **Status:** todo
- **Labels:** module:favorites, type:feature, size:S, layer:frontend
- **PRD:** 5.4, 12 (favorites recipe copy)
- **Flags:** needs-human-validation; (assumed) selecting a favorite opens it the same way as a deep link (REC-014); (assumed) favorites store only the video reference, not a copy of the recipe (open decision); (assumed) the list shows each saved video's title, and a saved `needs_recipe` video opens with its title only (Decided 4)
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want a list of my saved recipes, so that I can go back to one I liked.

### Acceptance criteria
- Given I have saved recipes, when I open the "Favorites" view, then every saved recipe is listed.
- Given the Favorites view, when I select a saved recipe, then its video opens with the recipe available.
- Given I have no saved recipes, when I open the Favorites view, then it shows an empty list without errors (assumed).

### Technical context
—

### Estimation notes
S: simple list on top of REC-011.
Could grow if the open decision says favorites must store a recipe copy.

## REC-013 · Share a recipe
- **Status:** todo
- **Labels:** module:sharing, type:feature, size:S, layer:frontend
- **PRD:** 5.5
- **Flags:** needs-human-validation; (assumed) a `needs_recipe` video (title only) can also be shared (Decided 4)
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want to share a recipe with one tap, so that I can send it to someone I'll cook with.

### Acceptance criteria
- Given my browser supports the Web Share API, when I tap share, then the native share sheet opens with the recipe's link.
- Given my browser does not support the Web Share API, when I tap share, then the recipe's link is copied to the clipboard and I see that it was copied (assumed).
- Given I share a recipe, when the link is generated, then it is the recipe's deep link (`/r/{videoId}`).

### Technical context
—

### Estimation notes
S: standard browser API with a simple fallback.
Depends on REC-014 for the link target.

## REC-014 · Deep link opens the feed on a recipe
- **Status:** todo
- **Labels:** module:sharing, type:feature, size:M, layer:fullstack
- **PRD:** 5.5, API-3
- **Flags:** needs-human-validation; blocked-by:REC-021; blocked-by:REC-019
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want a shared link to open straight on that recipe, so that I don't have to search for the video someone sent me.

### Acceptance criteria
- Given a deep link `/r/{videoId}` for a ready video, when I open it, then the feed opens on that video with its recipe available (API-3).
- Given I opened a deep link to a video in the middle of the feed, when I swipe up or down, then the next or previous video in the feed becomes active.
- Given a deep link `/r/{videoId}` for a `needs_recipe` video, when I open it, then the feed opens on that video showing its title only.
- Given a deep link for an ID that is unknown or not in the feed (not `ready` or `needs_recipe`), when I open it, then I land on the regular feed without an error.

### Technical context
Owns how a deep-linked video joins the visit's feed (from REC-002 validation, #24, 2026-11-16): the linked video plays first, then the regular feed (REC-002) starts at page 1, and the client skips the linked video if it comes up again in the feed.
The single-video request is `GET /api/videos/{youtubeId}` as specified by REC-021: 200 for a `ready` or `needs_recipe` video, 404 for an unknown, malformed or out-of-feed ID, which the client treats as "land on the regular feed" (`backlog/README.md` Decided 5, 2026-11-18, from REC-021 validation).

### Estimation notes
M: a new entry point into the feed plus a single-video request.
Edge-case behavior is not in the PRD; it was decided in `backlog/README.md` Decided 5.
