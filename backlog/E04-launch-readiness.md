---
id: E04
title: Launch readiness
prd-goal: "§8"
---

## REC-015 · Spike: performance check on a real mid-range phone
- **Status:** todo
- **Labels:** module:playback, type:spike, size:M, layer:frontend
- **PRD:** 8, PERF-2, PERF-3
- **Flags:** needs-human-validation; blocked-by:REC-001, blocked-by:REC-004
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the app to feel instant on my everyday phone, so that I keep using it instead of giving up.

### Acceptance criteria
- Given a real mid-range phone on 4G, when the app is opened from cold, then the first video is playable in < 2 s (PERF-2).
- Given the same device, when I swipe to the next video, then it starts in < 500 ms (PERF-3).
- Given the measurements, when the spike ends, then the results are recorded with device, network and pass/fail for each target.

### Technical context
—

### Estimation notes
Spike, timebox 6 h. Minimum output: recorded PERF-2/PERF-3 measurements with pass/fail.
Required for launch; a failure reopens REC-001/REC-004.

## REC-016 · Spike: extraction accuracy review
- **Status:** todo
- **Labels:** module:extraction, type:spike, size:M, layer:backend
- **PRD:** 8, 9 (LLM extraction errors)
- **Flags:** needs-human-validation; blocked-by:REC-008, blocked-by:REC-010, blocked-by:REC-017
- **AI estimate:** —
- **Estimate:** —

As a home cook, I want the written recipe to match what the video shows, so that I can trust it while cooking.

### Acceptance criteria
- Given about 50 extracted recipes, when each is manually compared to its video, then each is marked correct or incorrect (ingredients and steps match).
- Given the review results, when accuracy is calculated, then launch passes only if ≥ 90% are correct.
- Given an incorrect recipe, when the review ends, then the error type (wrong quantity, missing step, etc.) is recorded.

### Technical context
—

### Estimation notes
Spike, timebox 8 h. Minimum output: per-recipe verdicts and the overall accuracy %.
Required for launch; < 90% sends work back to REC-008.
