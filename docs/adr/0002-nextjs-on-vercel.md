# 0002. Next.js (App Router) on Vercel for the web app and API

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Project owner

## Context

The MVP is a mobile-first web app with a read-only runtime: the feed and
single-video data come from the server, favorites live in localStorage (PRD
§5.4), and there are no accounts. Feed responses must be CDN-cacheable
(PERF-6), the first video must play in under 2 s (PERF-2), and the next in
under 500 ms (PERF-3). The PRD §10 roadmap (admin UI, search, accounts,
user-submitted URLs) must be reachable without a rewrite. The stack should be
as simple as possible.

## Decision

We will build the web app and its API as one Next.js (App Router) app with
React 19 and TypeScript, styled with plain CSS modules, and host it on
Vercel. The API is two route handlers, `GET /api/feed` and
`GET /api/videos/{id}`, whose responses are cached at the Vercel CDN.

## Alternatives

- **Static feed (Vite SPA + static JSON on a CDN, no server):** simplest and
  best for traffic, but a dead end for admin UI, accounts and user-submitted
  URLs, which all need server-side writes; adding them means rebuilding as
  this option.
- **AdonisJS API + separate React SPA:** supports the roadmap, but needs a
  long-running server, a scheduler and two deployments: more to operate than
  the MVP warrants.

## Consequences

- **Positive:** one codebase and one deployment for the client and the API;
  roadmap items (admin pages, auth, search endpoints) fit in the same app;
  CDN caching keeps traffic behavior close to a static site.
- **Negative:** Next.js is a large framework for a small app; mitigated by
  using only App Router pages and route handlers, with no extra libraries
  until a story needs them.
- **Negative:** some lock-in to Vercel; standard Next.js can run on other
  hosts or a Node server.

## Links

- Change: [`choose-tech-stack`](../../openspec/changes/archive/2026-11-15-choose-tech-stack/design.md) (archived)
- C4: [Level 2: containers](../architecture/c4/02-containers.md),
  [Level 3: web app](../architecture/c4/03-components-web-app.md)
- PRD: §5, §6.5, §7, §10
