# 0004. Daily ingestion as a TypeScript script on GitHub Actions

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Project owner

## Context

Once a day the system must discover new Shorts (ING-1 to ING-3), extract
recipes with an LLM (EXT-1 to EXT-6), classify them as easy (§6.3) and check
that existing videos are still available (§6.4). Extraction must never run
while a user is browsing (PERF-1). A batch of LLM calls can take minutes, and
the volume is small (~50 at launch plus daily growth).

## Decision

We will run ingestion as a Node TypeScript script in the same repo,
triggered by a GitHub Actions scheduled workflow. It writes to Postgres
through the shared Drizzle schema (ADR 0003). The web app never calls the
LLM.

## Alternatives

- **Vercel Cron calling a route handler:** keeps everything on Vercel, but
  functions have time limits that a batch of LLM calls can exceed.
- **A queue service (e.g. Inngest, QStash):** handles long or per-item work,
  but adds a service the MVP does not need. Revisit for the roadmap's
  user-submitted URLs (§10), which need on-demand extraction.
- **A long-running worker server:** more to operate than a daily batch
  needs.

## Consequences

- **Positive:** jobs run up to 6 hours, free at this volume; the batch is
  fully outside the request path (PERF-1); same language and types as the
  app.
- **Negative:** the schedule is only as precise as GitHub Actions cron (can
  be delayed); acceptable for a daily job.
- **Negative:** secrets (database URL, YouTube API key, LLM key) must be set
  in both GitHub and Vercel.

## Links

- Change: [`choose-tech-stack`](../../openspec/changes/archive/2026-11-15-choose-tech-stack/design.md) (archived)
- C4: [Level 1: system context](../architecture/c4/01-system-context.md),
  [Level 2: containers](../architecture/c4/02-containers.md),
  [Level 3: ingestion](../architecture/c4/03-components-ingestion.md)
- PRD: §6.1, §6.2, §6.3, §6.4, PERF-1, §9
