---
id: E02
title: A written recipe for every video that has one
prd-goal: G2
---

## REC-006 · Recipe panel with servings, ingredients and steps
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:M, layer:frontend
- **PRD:** 5.1, 5.3, PERF-4, API-1
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want to open a written recipe next to the video, so that I can cook without pausing and rewinding.

### Acceptance criteria
- Given a video is active, when I tap its "Recipe" tab or button, then a panel opens instantly showing servings, ingredients with quantities, and numbered steps, with no extra network request (PERF-4).
- Given the recipe panel is open, when I close it, then the video stays visible and keeps playing.
- Given the recipe panel is open, when I look at it, then a label shows the source (description, comment or captions) and links to the original YouTube video.
- Given I am on desktop, when I open the recipe panel, then it sits beside the centered video.
- Given I am on mobile, when I open the recipe panel, then it slides up from the bottom as a sheet.
- Given the recipe sheet is open on mobile, when I swipe vertically on it, then the recipe scrolls and the active video does not change.
- Given a `needs_recipe` video is active, when I look at it, then only its title is shown, with no "Recipe" tab or button.

### Technical context
`needs_recipe` videos are in the feed with their title only (decided 2026-11-17, `backlog/README.md` Decided 4; PRD 5.3, PERF-4).

### Estimation notes
M: one component with two layouts (desktop side panel, mobile sheet).
Data already arrives with the feed, so no loading states are needed.

## REC-007 · Panel opens automatically after the first play-through
- **Status:** todo
- **Labels:** module:recipe-panel, type:feature, size:S, layer:frontend
- **PRD:** 5.3
- **Flags:** needs-human-validation; (assumed) a "view" ends when I swipe away; coming back to the same video counts as a new view
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the recipe to appear by itself once I've watched the video, so that I don't have to look for it.

### Acceptance criteria
- Given a video is playing for the first time in this view, when it reaches the end and starts its first repeat, then the recipe panel opens automatically.
- Given the panel opened automatically and I closed it, when the video loops again, then the panel does not reopen.
- Given I swiped away from a video and come back to it, when it reaches the end of its first loop, then the panel opens automatically again.
- Given a video is playing, when the recipe panel opens automatically, then the video keeps playing.
- Given a `needs_recipe` video is playing, when it reaches the end and starts its first repeat, then no recipe panel opens.

### Technical context
A `needs_recipe` video has no recipe panel (decided 2026-11-17, `backlog/README.md` Decided 4; PRD 5.3).

### Estimation notes
S: small state machine on top of REC-003 and REC-006.
The only uncertainty is the meaning of "view", flagged as assumed.

## REC-008 · Recipe extracted ahead of time from description or comment
- **Status:** todo
- **Labels:** module:extraction, type:feature, size:L, layer:backend
- **PRD:** 6.2, EXT-1, EXT-3, EXT-5, EXT-6, 6.4, PERF-1, 9 (LLM errors)
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want every recipe in the feed to be extracted before I see it, so that I never wait for one to be generated.

### Acceptance criteria
- Given a candidate video whose description contains a full recipe, when extraction runs, then servings, ingredients (name, quantity, unit) and steps are stored, with source `description` (EXT-1, EXT-3, EXT-6).
- Given an extraction result with fewer than 2 ingredients or fewer than 2 steps, when it is checked, then it does not count as complete and the next source is tried (EXT-5).
- Given no source yields a complete recipe, when extraction finishes, then the video is marked `needs_recipe` and enters the feed with its title only.
- Given a user is browsing the feed, when videos load, then no extraction runs (PERF-1).

### Technical context
`needs_recipe` videos are shown in the feed with their title only, and adding a recipe by hand is out of the MVP (decided 2026-11-17, `backlog/README.md` Decided 4; `draft-backlog-list.md` D-7). Re-running extraction later on `needs_recipe` videos is D-8. Recipe fields follow the data model document (REC-020).

### Estimation notes
L: LLM prompt design for structured output, plus the completeness rules and status handling.
Sets up the extraction pipeline that REC-017 and the captions source (REC-009) build on.

## REC-017 · Recipe extracted from the top comment as fallback
- **Status:** todo
- **Labels:** module:extraction, type:feature, size:M, layer:backend
- **PRD:** EXT-1, EXT-2, 9 (pinned comment not identifiable)
- **Flags:** needs-human-validation; blocked-by:REC-008
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want a recipe found in the comments when the description has none, so that more good videos make it into the feed.

### Acceptance criteria
- Given the description does not give a complete recipe, when extraction continues, then the top comment is tried next (EXT-1, EXT-2).
- Given the video's creator has commented, when the comment source is chosen, then the creator's comment is preferred over other top comments (EXT-2).
- Given the chosen comment is not actually a recipe, when it is checked, then it is not used and the next source is tried (§9).

### Technical context
—

### Estimation notes
M: reuses the REC-008 pipeline with a new source.
The pinned comment can't be identified through the API (§9), so the creator-comment heuristic needs care.

## REC-009 · Spike: can captions/transcripts be used for third-party videos?
- **Status:** todo
- **Labels:** module:extraction, type:spike, size:S, layer:backend
- **PRD:** EXT-1, 9 (captions access), 12 (captions legality)
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want recipes recovered from captions when the description and comment fail, so that fewer good videos are left out of the feed.

### Acceptance criteria
- Given the official YouTube Data API only lets owners download captions, when the spike ends, then it documents which caption/transcript options (e.g. auto-generated transcripts) are allowed for third-party videos.
- Given the allowed options, when the spike ends, then it gives a clear go/no-go on captions as the third extraction source.
- Given a no-go, when the spike closes, then it confirms the PRD fallback: videos without a recipe in the description or comment are marked `needs_recipe`.

### Technical context
—

### Estimation notes
Spike, timebox 8 h. Minimum output: a go/no-go decision with the allowed option, if any.
If go, a captions-fallback story is written then (tentative until the spike ends).

## REC-010 · Only easy recipes enter the feed
- **Status:** todo
- **Labels:** module:extraction, type:feature, size:M, layer:backend
- **PRD:** 6.3, EXT-4, 6.4
- **Flags:** needs-human-validation
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want every recipe in the feed to be genuinely easy, so that I can cook it today with little time and ordinary equipment.

### Acceptance criteria
- Given an extracted recipe with ≤ 10 ingredients, ≤ 30 minutes of estimated active time, and only common kitchen equipment, when it is classified, then the video becomes `ready`.
- Given an extracted recipe with 11 ingredients, or 31 active minutes, or special equipment (e.g. sous vide, smoker), when it is classified, then the video becomes `not_easy` and never enters the feed.
- Given any classified recipe, when it is stored, then the raw values `ingredient_count`, `estimated_active_minutes` and `special_equipment[]` are kept (EXT-4).
- Given the thresholds are changed later, when classification is re-applied, then it uses the stored raw values without re-running extraction.

### Technical context
—

### Estimation notes
M: simple rules, but the LLM must return reliable facts.
"Common kitchen equipment" is a fuzzy boundary for the LLM.
