# Security

The security practices of Easy Recipes: what is in place, where to see it, and
what is not done yet. The app is small and public: a read-only feed of YouTube
videos, no accounts and no user data on the server (favorites live in the
browser's `localStorage`, PRD §5.4). So the main risks are a leaked write
credential, a change that reaches production without review, and bad input on
the one public endpoint. The practices below follow from that.

Last reviewed: 2026-11-22. When code, workflows or settings change a practice,
update this file in the same pull request.

## Practices in place

### Database access

| Practice | Example | Where |
|---|---|---|
| **The app only reads.** It connects as the role `app_readonly`, which has `SELECT` and nothing else. Every Vercel preview reads the production database, so a bug in the app cannot change data. | A write as `app_readonly` is rejected; this was checked in Neon on 2026-11-22 (see the [checklist](checklist.md), item 12). | [`0003_read_only_grants.sql`](../src/lib/db/migrations/0003_read_only_grants.sql), [ADR 0007](adr/0007-database-connections-roles-and-migrations.md) |
| **The write credential is kept out of the app.** `DATABASE_URL_DIRECT` (the owner role) is only in GitHub Actions secrets, never in Vercel. Only the migration workflow, the curated loader and, later, the ingestion job use it. | The web app's code only calls `getAppDb()`, which needs `DATABASE_URL`. | [`client.ts`](../src/lib/db/client.ts), [`migrate.yml`](../.github/workflows/migrate.yml), [`load-curated.yml`](../.github/workflows/load-curated.yml) |
| **The database enforces the data rules for every writer**, including a maintainer in the Neon console: the feed-entry time is set by the database, `rejected` is only for new candidates, required fields, a unique YouTube ID. | An `UPDATE` that changes `entered_feed_at` by hand is rejected by a trigger. | [`0001_feed_entry_time.sql`](../src/lib/db/migrations/0001_feed_entry_time.sql), [`video-catalog` spec](../openspec/specs/video-catalog/spec.md) |
| **Queries are parameterized.** Drizzle and `pg` send values as parameters, never joined into SQL text. The code has no `eval` and no `dangerouslySetInnerHTML`. | The feed query's cursor values are bound parameters. | [`query.ts`](../src/lib/feed/query.ts), [`load.mts`](../src/lib/catalog/load.mts) |
| **Dev-only passwords cannot reach a real database.** The scripts that create roles or seed made-up data refuse a host that is not this machine. | `pnpm db:seed` against a Neon URL stops with an error. | [`local-only.mts`](../scripts/db/local-only.mts) |

### Input and output of the public endpoint

| Practice | Example | Where |
|---|---|---|
| **Strict validation of the only input**, the `cursor`. It must be base64url JSON with an id inside the database column's range and a time between 1970 and 9999. Anything else is a `400`, so a crafted cursor never reaches Postgres. | `?cursor=` (empty), a cursor with id `99999999999`, or an old offset cursor each return `400 invalid_cursor`. | [`cursor.ts`](../src/lib/feed/cursor.ts), [`handle-request.ts`](../src/lib/feed/handle-request.ts) |
| **Errors do not leak details.** The response body is a fixed message with a code; the real error is only written to the server log. | A database failure returns `500 internal_error` with a generic message. | [`handle-request.ts`](../src/lib/feed/handle-request.ts), [OpenAPI spec](api/openapi.yaml) |
| **Error and empty responses are not cached** (`no-store`), so a failure is never kept by the CDN. | The 400 and 500 responses send `Cache-Control: no-store`. | [`handle-request.ts`](../src/lib/feed/handle-request.ts) |
| **Malformed stored data is not served.** A recipe whose items do not have the contract's shape is served title-only and logged. | A recipe whose `ingredients` is `["flour"]` is returned as `recipe: null`. | [`recipe.ts`](../src/lib/feed/recipe.ts) |
| **No LLM in the request path.** The LLM is only called from the ingestion script, so a visitor cannot send text to a model. | PERF-1. | [AGENTS.md](../AGENTS.md) |

### The YouTube embed

| Practice | Example | Where |
|---|---|---|
| **Privacy-enhanced player.** The embed uses `youtube-nocookie.com`, an explicit `allow` list and a `strict-origin-when-cross-origin` referrer policy. | The iframe's `allow` names only the features the player needs, including `autoplay` (REC-003). | [`SlideVideo.tsx`](../src/app/feed/SlideVideo.tsx) |
| **The video ID and the page origin are escaped** in the embed URL, and only the active video and its two neighbours render an iframe. | `encodeURIComponent(youtubeId)` and `encodeURIComponent(origin)`. | [`embed-url.ts`](../src/lib/player/embed-url.ts), [`Feed.tsx`](../src/app/feed/Feed.tsx) |
| **The only third-party script is YouTube's own IFrame Player API.** It is loaded once from `www.youtube.com`, behind one adapter, with no npm dependency; the player is destroyed only after its iframe is gone. | No other outside script runs on the page. | [ADR 0008](adr/0008-youtube-iframe-player-api.md), [`youtube-player.ts`](../src/lib/player/youtube-player.ts) |

### Secrets and configuration

| Practice | Example | Where |
|---|---|---|
| **Secrets are never committed.** `.env*` is git-ignored except `.env.example`, which holds only local development values. | `DATABASE_URL` and `DATABASE_URL_DIRECT` in `.env.example` point at the local Docker database. | [`.gitignore`](../.gitignore), [`.env.example`](../.env.example) |
| **Each secret lives in one place.** `DATABASE_URL` (pooled, read-only role) is in Vercel for Production and Preview; `DATABASE_URL_DIRECT` (direct, owner) is in GitHub Actions secrets. | How to set them is in the Neon section of the development guide. | [Development](development.md#create-the-neon-project-production) |

### Production changes

| Practice | Example | Where |
|---|---|---|
| **`main` is protected** (GitHub branch protection settings, not stored in the repo). Every change needs a pull request, a green `check` job, a branch that is up to date and resolved review conversations; force-pushes are blocked and admins are included. | A direct push to `main` is refused. | [CONTRIBUTING](../CONTRIBUTING.md) |
| **Review.** Code pull requests get an AI review whose comments must be fixed or answered, and CODEOWNERS asks the owner to review. | Pull request 59 (the review threads): seven findings, five fixed and two answered. | [CONTRIBUTING › Review](../CONTRIBUTING.md#review), [`CODEOWNERS`](../.github/CODEOWNERS) |
| **Writes to production are gated.** The migration workflow and the curated loader run only from `main`, one run at a time; the loader is manual only. The three workflows that touch production set `permissions: contents: read`. | The loader job is skipped when started from another branch. | [`migrate.yml`](../.github/workflows/migrate.yml), [`load-curated.yml`](../.github/workflows/load-curated.yml), [`smoke-production.yml`](../.github/workflows/smoke-production.yml) |
| **Migrations are additive** after they merge, so the app works whether the deploy or the migration finishes first, and a failed migration is fixed with a new one. | There is no automatic rollback. | [ADR 0007](adr/0007-database-connections-roles-and-migrations.md) |
| **A smoke test runs against production** after every deploy. | The `@smoke` test loads the real feed and checks a video shows. | [`smoke-production.yml`](../.github/workflows/smoke-production.yml) |

### Dependencies and tests

| Practice | Example | Where |
|---|---|---|
| **Versions are pinned exactly** and CI installs from the lockfile. | `package.json` has no `^` or `~`; CI runs `pnpm install --frozen-lockfile`. | [`package.json`](../package.json), [`ci.yml`](../.github/workflows/ci.yml) |
| **A new library needs human approval and an ADR**, which limits what code can enter the project. | AGENTS.md, "Do not add any other library". | [AGENTS.md](../AGENTS.md) |
| **Tests cannot reach the outside network.** End-to-end tests stub or block outside hosts; the only test that reads a database, the CI smoke test, uses one created for that run. | An outside request fails the test; the feed tests stub `/api/feed`. | [ADR 0006](adr/0006-playwright-end-to-end-tests.md), [`e2e/support/`](../e2e/support/) |

## Known gaps

Not done yet; do not read them as practices.

- **Security headers.** `next.config.ts` sets none: no `Content-Security-Policy`,
  `X-Frame-Options` or `Permissions-Policy` from the app. Vercel adds HSTS on its
  own (seen in the production response headers).
- **Iframe `sandbox`.** The YouTube embed has no `sandbox` attribute.
- **Dependency updates.** No Dependabot or Renovate, and no audit step in CI.
- **Rate limiting.** None on `/api/feed`. The CDN cache absorbs most requests, but
  an uncached cursor page reads the database.
- **CI permissions.** `ci.yml` has no explicit `permissions:` block, unlike the
  other workflows, so it uses the repository's default token rights.
- **Database TLS.** The Neon connection strings use `sslmode=require`; making it
  `verify-full` is tracked as D-10 in the
  [draft backlog](../backlog/draft-backlog-list.md).
- **Second reviewer.** Branch protection requires no approving review
  (`required_approving_review_count` is 0): review is the AI review plus the
  owner's own check, until a second person joins.
- **Pool size.** ADR 0007 says REC-002 tunes the connection pool; the story says
  after launch. A decision is pending.

Each gap that becomes a change is a pull request that updates this list. A new
tool or setting with its own trade-off (a CSP, Dependabot) is an ADR first.
