# Design

## Context

See proposal.md for why. Current state this design builds on:

- `GET /api/feed` (`src/app/api/feed/route.ts`) calls `getFixturePage` and
  already returns the contract's shape, the 400 body and the cache header for
  a page with items. The client (`src/app/feed/Feed.tsx`) calls
  `appendPage` in `src/lib/feed/feed-state.ts`, which keeps arrival order, and
  `PageRequests` keeps at most one request per cursor in flight.
- REC-019 built the `video` table with `entered_feed_at timestamptz(3)` set
  by a trigger, the index `video_feed_idx (status, entered_feed_at, id)`, the
  shared client `src/lib/db/client.ts` (`getAppDb()` for the app through
  `app_readonly`, `createDirectDb()` for scripts) and `scripts/db/` with
  `setup-roles.mts`. ADR 0007 covers `pg`, Drizzle, the two roles and Postgres 17.
- CI (`.github/workflows/ci.yml`) has a `postgres:17` service container with
  only `TEST_DATABASE_URL`, and starts the web server with no `DATABASE_URL`.
  Once the route reads the database, `/api/feed` would return 5xx and every
  pull request would fail.
- The contract is `docs/api/openapi.yaml` (REC-021); the requirements are the
  delta specs in this change.

## Goals / Non-Goals

**Goals:**
- Replace the fixture with the database query without changing the response
  shape, the client or its E2E stubs.
- Keep every cacheable response identical for all visitors (PERF-6).
- Keep rule logic (cursor, shuffle, loader validation) in pure functions with
  unit tests, so E2E covers only what a browser can show.

**Non-Goals:**
- A new library, service or ADR. Failed-page UI (REC-018), title-only display
  (REC-006), the deep-linked video (REC-014), discovery (REC-005), pool tuning
  (needs real traffic, after launch).

## Decisions

**1. Keyset cursor on (`entered_feed_at`, `id`), page size 10, read 11.**
The cursor is base64url JSON `{"t": <ISO time, ms>, "i": <id>}`. The query is
`status in ('ready','needs_recipe') and (entered_feed_at, id) < (t, i)` ordered
by both descending, `limit 11`; an 11th row means `nextCursor` is built from the
10th, otherwise `null`. Rows with equal time are split by `id`, so ties at a page
boundary neither repeat nor skip. `timestamptz(3)` (REC-019) keeps the time
exact through a JS `Date`. Alternatives: offset paging (skips and repeats rows
when videos enter mid-visit, and is what the fixture does today); a separate
count query (a second round trip and a race).
Decoding lives in a small pure module (`src/lib/feed/cursor.ts`); anything that
does not decode to a valid time and integer is `invalid_cursor` (400). A cursor
that decodes but has nothing after it is not an error: the query returns no rows
and the route answers an empty last page.

**2. The route takes its database query as an injected function.**
`GET` calls `getFeedPage(query)` with a default that uses `getAppDb()`. The 5xx
test passes a query that throws; the route turns any thrown error into
`{ error: { code: "internal_error", ... } }` with 500 and `no-store`, and logs it.
Alternative: mock `pg` in the unit test. Injection is smaller and needs no mock
library. The query itself is checked with `*.db.test.ts` against a real database
(the walk of every page, ties at a boundary, status filter, the recipe join).

**3. Cache headers by response type, set in one place.**
200 with items: `public, s-maxage=3600`. Everything else (empty page, 400, 5xx):
`no-store`. One helper returns the header from the page, so a new response type
cannot forget it. Whether Vercel's CDN keeps `s-maxage` when forwarding is only
visible after deploy: a manual check (second request shows a `HIT`).

**4. The recipe is joined into the page query.**
A left join on `recipe` returns it with each `ready` video; a `needs_recipe`
video has none, and the route returns `recipe: null`. The route does not check
that status and recipe agree (REC-019 leaves that to ingestion, REC-008).
`channelName` is nullable in the schema, so it maps through as `null`; the
loader never writes a null one.

**5. The shuffle is a pure client function with an injectable random source.**
`shufflePage(items, random)` (Fisher-Yates) is applied in `appendPage` to the
items of each received page once, before they join `visit`; pages already in
`visit` are never touched. `appendPage` takes the random source as an optional
third argument, defaulting to `Math.random`, so unit tests pass a seeded one.
The server stays order-stable and cacheable. REC-001's wording that the shuffle
lives in the route is wrong; this change corrects the story text.
REC-001's wrap E2E tests assume arrival order equals visit order; they are
changed to read the first and last video of the order actually shown, instead of
assuming a catalog position. Alternative: a seed in the URL (breaks caching).

**6. CI migrates and seeds the service container, then starts the app.**
A new step before `pnpm test:e2e` runs the migrations, `setup-roles`, and the seed
script against the service container; the E2E step sets `DATABASE_URL` to the
`app_readonly` role and `pnpm start` reads it. Playwright's `webServer` already
runs only `pnpm start` in CI. The container is per run, so E2E rule 5 ("never a
shared database") holds; feed E2E tests still stub `/api/feed` with `page.route`,
and only `@smoke` hits the real route. Locally nothing changes.
`setup-roles.mts` refuses non-local URLs (`assertLocalDatabase`); the CI URL is
`localhost:5432`, so it passes unchanged. Alternative: keep `@smoke` stubbed,
which would let a broken database route reach `main`.

**7. Seed script and loader share one writer.**
Both live in `scripts/db/`, write through `createDirectDb()`, and never set
`entered_feed_at` (the database does). The seed gives ties by inserting rows in
one transaction and an order by inserting in separate ones (for unit and db tests
and CI). The loader (`scripts/db/load-curated.mts`) reads
`scripts/db/curated-shorts.json`, validates each entry in a pure function
(`validateEntry`, unit tested: title, channel and the four ING-2 facts present;
duplicate IDs; Shorts length, embeddable, English), and inserts with
`on conflict (youtube_id) do nothing`, so a re-run, or a run after a partial
failure, changes nothing already written (ING-3). It fails before any write when
the file is missing or not valid JSON. Each video gets the time of its load
(the database sets it); ties within one load are broken by `id`.
Alternatives: a YouTube Data API call per Short (a key, a quota and a service
that would need an ADR, decided out in the story); an update on conflict
(would change rows).

**8. The loader runs as a manual GitHub Actions workflow.**
`.github/workflows/load-curated.yml`, `workflow_dispatch` only, `if: github.ref ==
'refs/heads/main'` as `migrate.yml` does, with `DATABASE_URL_DIRECT` from secrets
(the only write credential, ADR 0007) and `node --env-file` style env, no new
dependency. The criteria promise what is stored, not that the feed shows it right
away (the 1 hour CDN cache can delay it).

**9. Docs, ADRs and C4.**
No ADR: no new library, framework, service or hosting, and ADR 0007 already
covers the roles and connections. Updated in the same change: C4 containers
(`02-containers.md`: the `s-maxage` "with revalidation" wording becomes a plain
1 hour cache; the batch path gains the manual loader next to the ingestion job)
and level 3 web app (`03-components-web-app.md`: drop "fixture data until
REC-002" and "light shuffle with REC-002", "Reads (from REC-002)" becomes
"Reads"); `docs/api/openapi.yaml` (implementers; a cursor past the end gives an
empty last page, and the 400 description keeps only a cursor that cannot be
decoded); REC-001's Technical context line about the shuffle.

## Risks / Trade-offs

- **CI seeding fights the production build** (service container, roles, env) →
  do it first (task group 1), so the risk shows before other work depends on it.
- **Vercel CDN strips `s-maxage`** → manual check after the first deploy; the
  headers are unit tested on the route either way.
- **Title-only videos fill the first pages** (until REC-008 the catalog is all
  `needs_recipe`) → accepted as known (story #46).
- **A page open at deploy time holds an old offset cursor** → it gets 400 and the
  client treats it as a failed page (REC-018); accepted.
- **New videos can take up to an hour to appear** (CDN cache) → accepted;
  refreshing on ingestion is future work (D-6).
- **The curated list is human work** (finding, checking and writing real Shorts
  with their ING-2 facts) and blocks the production load, not the code.
- **The 5xx path is only tested with an injected failure** → the db tests cover
  the real query, and the smoke test covers a working connection.

## Migration Plan

Merge to `main` through a PR with CI `check` green. No schema change, so no
migration. After the deploy, run the manual checks (CDN `HIT`), then run the
loader workflow once with the real list. Rollback: revert the PR; the table is
untouched and loaded videos can stay.
