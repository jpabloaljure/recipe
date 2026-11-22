# Easy Recipes from YouTube (working title)

A mobile-first web app with a vertical, full-screen feed of short YouTube
cooking videos (Shorts), each with an easy written recipe.

> Status: **MVP in progress.** The vertical swipe feed reads its videos from
> the database through `GET /api/feed` (newest first, shuffled within each
> page). Production shows videos once the curated list is loaded; recipes are
> not built yet, so every video is title only. Delivery progress:
> [docs/checklist.md](docs/checklist.md).

## Index

0. [Project info](#0-project-info)
1. [Product overview](#1-product-overview)
2. [System architecture](#2-system-architecture)
3. [Data model](#3-data-model)
4. [API specification](#4-api-specification)
5. [User stories](#5-user-stories)
6. [Work tickets](#6-work-tickets)
7. [Pull requests](#7-pull-requests)

**More documentation:** [how this project is built with AI](docs/ai-workflow.md)
· [documentation map](docs/README.md)

---

## 0. Project info

| | |
|---|---|
| **Author** | Juan Pablo Aljure |
| **Project name** | Easy Recipes from YouTube (working title) |
| **Short description** | A vertical feed of YouTube cooking Shorts, each with an easy recipe (servings, ingredients, numbered steps) extracted ahead of time by an LLM. |
| **Project URL** | [recipe-henna-pi.vercel.app](https://recipe-henna-pi.vercel.app) |
| **Repository** | [github.com/jpabloaljure/recipe](https://github.com/jpabloaljure/recipe) |

---

## 1. Product overview

### 1.1. Objective

Short cooking videos are fun to watch but hard to cook from: the recipe goes
by fast, often has no written version, or is buried in a description or
comment. Easy Recipes is for the **casual home cook** (limited time, watches
on a phone) who wants something quick to cook today: swipe through easy
recipe videos and read the recipe without pausing and rewinding.

### 1.2. Main features

- **Feed:** vertical, one video at a time, swipe to move.
- **Playback:** muted autoplay, one tap to unmute, loop.
- **Recipe panel:** servings, ingredients, numbered steps and their source;
  a video with no recipe found shows its title only.
- **Favorites:** saved in the browser, no account.
- **Sharing:** native share sheet or copy link; deep links to a recipe.
- **Daily ingestion (background):** finds new Shorts, extracts recipes with
  an LLM, and keeps only easy ones.

Full requirements, scope and performance targets: [PRD](docs/PRD.md).

### 1.3. Design and user experience

> **TODO:** provide images and/or a video walkthrough showing the user
> experience from landing in the app through all the main features.

### 1.4. Installation

Prerequisites: Node 26+, pnpm, and Docker for the local database.

```bash
pnpm install                 # install dependencies
cp .env.example .env.local   # local settings (git-ignored)
pnpm db:up                   # local Postgres 17 in Docker
pnpm db:setup                # the read-only role the app uses
pnpm db:migrate              # create the tables
pnpm db:seed                 # made-up videos for the feed
pnpm dev                     # dev server at http://localhost:3000
pnpm test                    # unit tests (no database needed)
pnpm test:db                 # database tests
pnpm test:e2e                # end-to-end tests
```

Setup details, the database, E2E tests and testing a deployed site:
[docs/development.md](docs/development.md).

---

## 2. System architecture

### 2.1. Architecture diagram

Two paths: a **request path** (browser → Vercel CDN → Next.js API → Postgres,
with cached feed responses) and a **batch path** (a daily GitHub Actions job
that finds videos, extracts recipes with an LLM and writes to Postgres). The
LLM is never called while a user is browsing.

Diagrams (C4 model, Mermaid): [docs/architecture/](docs/architecture/README.md)
· Reasons, benefits and trade-offs: [ADRs](docs/adr/README.md).

### 2.2. Main components

| Component | Technology | Decision |
|---|---|---|
| Web app + API | Next.js (App Router), React 19, TypeScript, CSS modules | [ADR 0002](docs/adr/0002-nextjs-on-vercel.md) |
| Database | Postgres on Neon, Drizzle ORM | [ADR 0003](docs/adr/0003-postgres-neon-drizzle.md) |
| Ingestion job | Node TypeScript script on a GitHub Actions schedule | [ADR 0004](docs/adr/0004-ingestion-on-github-actions.md) |
| Hosting + CDN | Vercel | [ADR 0002](docs/adr/0002-nextjs-on-vercel.md) |

### 2.3. Project structure

One package for the web app and the ingestion job
([ADR 0005](docs/adr/0005-single-package-repository-layout.md)).

```
src/        web app and API (Next.js App Router)
e2e/        end-to-end tests (Playwright)
docs/       PRD, architecture, ADRs, API spec, process
backlog/    user stories, one file per epic
openspec/   OpenSpec specs and changes
.github/    CI and production smoke check
.agents/    AI skills
```

Full tree: [docs/architecture/repository-layout.md](docs/architecture/repository-layout.md).

### 2.4. Infrastructure and deployment

Vercel deploys `main` to production on every merge. `main` is protected:
every change goes through a pull request with CI green. After each deploy, a
smoke test runs against production. Flow:
[CONTRIBUTING.md](CONTRIBUTING.md).

The database is Postgres on Neon. The app reads it as a read-only role; schema
changes are migrations in the repo, reviewed in a pull request and applied to
production by a workflow after the merge
([ADR 0007](docs/adr/0007-database-connections-roles-and-migrations.md),
[docs/development.md](docs/development.md#production-migrations)).

### 2.5. Security

> **TODO:** list and describe the main security practices implemented in the
> project, with examples where relevant.

### 2.6. Tests

- **Unit:** Vitest.
- **End-to-end:** Playwright in Chromium on three screens (phone portrait,
  phone landscape, desktop), on every pull request
  ([ADR 0006](docs/adr/0006-playwright-end-to-end-tests.md)).
- **Production smoke:** the `@smoke` E2E test after each deploy.

How to run them: [docs/development.md](docs/development.md).

---

## 3. Data model

A video has zero or one recipe; the video's status decides whether it is in
the feed. ER diagram, fields, types, keys and rules:
[docs/architecture/data-model.md](docs/architecture/data-model.md).

---

## 4. API specification

| Endpoint | Returns |
|---|---|
| `GET /api/feed` | One page of the feed: `ready` videos with their recipe, `needs_recipe` videos with their title only |
| `GET /api/videos/{youtubeId}` | One feed video (with its recipe, or title only), for deep links |

OpenAPI 3.1 spec with schemas and examples:
[docs/api/openapi.yaml](docs/api/openapi.yaml).

---

## 5. User stories

Validated stories (all stories: [backlog/](backlog/README.md)):

- [**REC-001** · Vertical full-screen feed with manual swipe](backlog/E01-browse-feed.md#rec-001--vertical-full-screen-feed-with-manual-swipe):
  as a home cook, I want to swipe through short recipe videos one at a time,
  so that I can quickly find something to cook today.
- [**REC-002** · Feed shows ready and title-only videos, newest first with variety](backlog/E01-browse-feed.md#rec-002--feed-shows-ready-and-title-only-videos-newest-first-with-variety):
  as a home cook, I want the feed to contain easy recipe videos, plus videos
  whose recipe could not be found shown by their title, in a fresh order, so
  that I always have something worth watching.
- [**REC-019** · Database schema and migration for the video catalog](backlog/E01-browse-feed.md#rec-019--database-schema-and-migration-for-the-video-catalog):
  as a maintainer, I want one versioned database schema for videos, their
  status and their recipe, so that the feed and the ingestion job read and write
  the same data.
- [**REC-020** · Data model document](backlog/E01-browse-feed.md#rec-020--data-model-document-no-implementation):
  as a maintainer, I want the data model written down before the schema is
  built, so that the feed, the recipe panel and the ingestion job agree.
- [**REC-021** · API specification document](backlog/E01-browse-feed.md#rec-021--api-specification-document-no-implementation):
  as a maintainer, I want the feed API specified before it is built, so that
  the web app and its tests rely on one agreed shape.

---

## 6. Work tickets

Tickets are backlog stories with a `layer:` label (no separate tracker; see
[story slicing](AGENTS.md#story-slicing)):

| Layer | Ticket |
|---|---|
| Database | [REC-019 · Database schema and migration for the video catalog](backlog/E01-browse-feed.md#rec-019--database-schema-and-migration-for-the-video-catalog) |
| Backend | [REC-021 · API specification document](backlog/E01-browse-feed.md#rec-021--api-specification-document-no-implementation) |
| Full stack (feed UI and a stub feed route) | [REC-001 · Vertical full-screen feed with manual swipe](backlog/E01-browse-feed.md#rec-001--vertical-full-screen-feed-with-manual-swipe) |

---

## 7. Pull requests

- [#1 Add Playwright end-to-end testing and E2E test rules](https://github.com/jpabloaljure/recipe/pull/1)
- [#5 Add contribution workflow: DoR, DoD, PR flow, production smoke](https://github.com/jpabloaljure/recipe/pull/5)
- [#11 Add story slicing rules and a layer label on every story](https://github.com/jpabloaljure/recipe/pull/11)
