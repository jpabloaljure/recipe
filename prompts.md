# AI usage log

The main prompts used to build Easy Recipes, showing how AI coding assistants
were used in each phase of the project: at most 3 per section, chosen from
initial creation and from the corrections or additions that mattered most.
Each prompt is copied exactly as typed (typos kept) and keeps its number from
the full log, [docs/prompts-log.md](docs/prompts-log.md), where the whole
conversation around it can be read. Prompts from Entrega 2 (working code) are
marked **[Entrega 2]**; the rest come from Entrega 1 (documentation).

## Index

0. [Tools, models and context](#0-tools-models-and-context)
1. [Product overview](#1-product-overview)
2. [System architecture](#2-system-architecture)
3. [Data model](#3-data-model)
4. [API specification](#4-api-specification)
5. [User stories](#5-user-stories)
6. [Work tickets](#6-work-tickets)
7. [Pull requests](#7-pull-requests)
8. [Human adjustments](#8-human-adjustments)

---

## 0. Tools, models and context

### Tools and models

| Tool | Model | Effort | Phase | What it did |
|---|---|---|---|---|
| Claude Code (desktop app) | Opus 5.5 until the cap of 2026-11-21 (Sonnet 5.5 for some steps from 2026-11-20); Sonnet 5.5 from the cap | session default; `high` in `decompose-prd`, `write-adr`, `validate-backlog` until the cap; `medium` from the cap | Entrega 1: PRD → backlog, story validation and estimation, ADRs, C4, data model, API spec. Entrega 2: OpenSpec changes, code, tests, CI, migrations, deployment, PRs | Main agent for planning and building |
| Claude Code (desktop app) | Haiku 5.5 | session default | Some `openspec-explore` sessions | Quick exploration before a decision |
| Claude Code built-in browser | Sonnet 5.5 (the session's model) | `medium` | Entrega 2: the curated list of real Shorts; checks on the production URL | Opened each YouTube watch page and tested each embed in an iframe |
| `story-validator` agent | Same as the session; Opus 5.5 at `high` from 2026-11-19 until the cap; Sonnet 5.5 at `medium` from the cap | see model | Backlog validation | Reviews one story at a time |
| `doc-checker` agent | Haiku 5.5 (from 2026-11-19) | `low` | Docs checks | Checks links and that docs agree; reports only |
| `/code-review` (Claude Code) | The session's model | `high` until the cap; `medium` from the cap | Every code PR | Posts its findings as PR comments before merge |

The project is capped at Sonnet 5.5 and `medium` effort from 2026-11-21
([AGENTS.md › Model routing](AGENTS.md#model-routing)), so REC-019 and
REC-002 were built on Sonnet; REC-001 was built mostly on Opus, before the
cap. Each summary in the full log lists the models used and why. This file
was updated on Opus 5.5, chosen by hand with `/model`, outside the cap.

### Context the agents work with

- **Rules:** `AGENTS.md` (linked as `CLAUDE.md`): stack, backlog format, BDD
  and E2E test rules, story slicing, human validation, model routing, the
  "suggest a path" rule.
- **Skills** (`.agents/skills/`): `decompose-prd`, `validate-story`,
  `validate-backlog`, `estimate-story`, `write-adr` and the `openspec-*`
  workflow (explore, propose, apply, archive).
- **Agents** (`.claude/agents/`): `story-validator` (reviews one story) and
  `doc-checker` (read-only docs checks on Haiku).
- **Hook:** `.claude/hooks/validate-ac.sh` blocks backlog edits that break
  the rules (no `done` without Given/When/Then, no flag removed without a
  team estimate).
- **Settings:** `.claude/settings.json` sets the Sonnet model and caps effort
  at `medium`; `openspec/config.yaml` holds project context for the OpenSpec
  steps.
- **Memory keywords:** `-pstart` starts recording prompts; `pend-` appends
  them to the full log with a Goal/Changes/Result/Models/Why summary and
  merges the PR.

Details: [docs/ai-workflow.md](docs/ai-workflow.md).

### Core workflows by phase

| Phase | Workflow | Where |
|---|---|---|
| Architecture | `openspec-explore` → `openspec-propose` → ADR with `write-adr` and C4 update | §2.1 |
| Stories | `validate-backlog`: validator findings → human picks options → AC approved → AI estimate → team estimate | §5 |
| Code | Validated story → `openspec-explore` → `openspec-propose` (proposal, spec, design, tasks) → `openspec-apply-change` → `/code-review` → close-out and archive | §2.2, §3, §4 |
| Tests | Vitest for logic, database tests on a Postgres service, Playwright for each spec scenario, manual device checks | §2.6 |
| Deployment | Merge to `main` → Vercel deploy → migrations run on Neon → production smoke test | §2.4 |

**What works end to end (Entrega 2).** A home cook opens
[the app](https://recipe-henna-pi.vercel.app) and swipes through 24 real
cooking Shorts that come from Postgres on Neon through `GET /api/feed`
(10 per page, a next cursor, CDN-cached). Stories: REC-001 (swipe feed),
REC-019 (schema and migrations), REC-002 (feed API and curated-list loader).
Recipes are not shown yet (REC-008 waits for the LLM provider decision).

---

## 1. Product overview

**Prompt 1:** (log #1) Adapt a skill copied from an earlier project to this PRD.

```
/openspec-explore Lets check this @SKILL.md and review every asumption is there that does not align with PRD
```

- **Context:** the agent setup (`AGENTS.md`, hook, skills) was copied from an
  earlier project; prompts #1–#10 rewrote it for this PRD.
- **Human adjustment:** chose the recipe-specific direction, the file-based
  backlog instead of Linear, and English for all artifacts.

**Prompt 2:** (log #117) Define what the PRD is for.

```
#27 B. separate story. #28 Revalidate after the E2E pr is done. #22 PRD.md is not the source of truth. but is the document that describe the product at high level. so updated each time is needed in consequence so it does have the main context of the project to be readable to the stakeholders but keep it aligned with the project's reality, code and documentation. For all the rest # do as recommended.
```

- **Context:** answer to the validator's findings while validating REC-002.
- **Human adjustment:** revised the first take (#116, "the PRD does not need
  to be updated"): the PRD is the high-level product description and is
  updated with every product decision. Now a rule in `AGENTS.md`.

**Prompt 3:** (log #142) Change the product scope.

```
#16 Remove manual from the scope of MVP and if could not get the recepi just leave the name (title) on the card. #17 B. #20 the recipe can only have the title if the recipe was not found. and there is no manual adding for MVP add the ready behavior to the draft backlog list but keep the status on the data model model.  All rest # will be A (Recommended)
```

- **Context:** answer to the findings while validating the data model story
  (REC-020).
- **Human adjustment:** videos with no recipe found stay in the feed with
  their title only, and adding recipes by hand left the MVP. The PRD,
  README, C4 diagrams and 8 stories were realigned (#146–#147). In Entrega 2
  this is what production shows: real Shorts with their title only.

---

## 2. System architecture

### 2.1. Architecture diagram

**Prompt 1:** (log #17) Explore the tech stack.

```
/openspec-explore Teck stack selection. Evaluate the teck stach modern and best aproch to pick as teck stack. Limit to the MVP do nod add nothin unnecesary. Kep it simple a possible
```

- **Context:** the agent proposed three stack options (A, B, C) for the MVP.

**Prompt 2:** (log #18) Compare how each option scales.

```
Lets evaluate now the excalability fo the A,B,C  options? Its important to escalate in the future.
```

- **Human adjustment:** chose option B (`/openspec-propose B option is my
  choise`, #19): Next.js on Vercel, Postgres on Neon with Drizzle, ingestion
  on GitHub Actions.

**Prompt 3:** (log #20) Document the architecture.

```
Make sure you are covering the C4 Arquitecture documentation on mermaid. and a proper ADRs files and diagrams. some of them dont exist yet but we should be able to storthem and generatethem and mantaine them along the way.
```

- **Result:** C4 levels 1–3 in Mermaid, ADRs 0001–0004, and the `write-adr`
  skill that keeps them current
  ([docs/architecture/](docs/architecture/README.md), [docs/adr/](docs/adr/README.md)).
  In Entrega 2 the same skill wrote ADR 0007 (database connections, roles
  and migrations), and C4 level 2 moved to `Current`.

### 2.2. Main components

**Prompt 1:** (log #33) Settle how the feed component is built.

```
for the question 2. I changed my mind and now build REC-001 with stub data and leave PERF-2 to other stories. For 15 if we could use library what Technical context aere you sugesting?
```

- **Result:** the feed uses CSS scroll-snap and no carousel library (no new
  library without an ADR).

**Prompt 2:** (log #41, #42) Check the riskiest part on a real phone before
estimating.

```
i have for REC-001 a pendent technical check. Help me to make it
```

```
Slow swipes and watch on youtube work for both, Hard fast fail some go more than one video for show but work well for overlay. the sound and swipe auto play after sond works fine on both.
```

- **Context:** the agent built a throwaway prototype (scroll-snap feed,
  YouTube players, an optional overlay) and checked it in desktop Chrome.
- **Human adjustment:** tested on an Android phone; hard flicks skipped
  videos with the overlay, so the overlay was dropped (#43).

**Prompt 3:** [Entrega 2] (log #313, #314) Plan the feed route that reads the
database.

```
/openspec-explore REC-002
```

```
what are your sugestions for each point.
```

- **Context:** REC-001 had already shipped the `Feed` component with a stub
  `GET /api/feed`; REC-002 replaced the stub with the database.
- **Result:** the OpenSpec change `add-database-feed`: the route reads
  Postgres as the read-only role with a keyset cursor, the client shuffles
  each page, and a loader puts a curated list of real Shorts in the
  database. Built with `/openspec-apply-change` (#321) and merged in PR #59.

### 2.3. Project structure

**Prompt 1:** (log #53) Scaffold the app as its own change.

```
/openspec-propose
```

Question dialog answer: `Scaffold only, first (Recommended)`.

- **Result:** one package for the web app and the ingestion job (ADR 0005),
  CI, and a placeholder deployed to Vercel.

**Prompt 2:** (log #188) Keep the README light without losing content.

```
explore i was told to have the readme as the readme-template. but i don't want to loose the information on the actual readme. as example, things like the project tree i thing are nor require on the readme template. Think in a alternative to keep the information accecible for the project readers. but keep the readme, contributors and other first view documents light and easy to read.
```

**Prompt 3:** (log #189) Set the rule for the README.

```
the only thing any information we dont have yet dont put it. and if the documentation is else were just link to it @readme-template.md this is the readme template. explore do not execute yet
```

- **Result:** the README follows the template with short sections and links;
  the full tree moved to
  [docs/architecture/repository-layout.md](docs/architecture/repository-layout.md).
  Entrega 2 added `src/lib/db/` (schema, client), `src/lib/feed/`,
  `src/lib/catalog/`, the migrations in `src/lib/db/migrations/` and
  `scripts/db/` to that layout.

### 2.4. Infrastructure and deployment

**Prompt 1:** (log #60, #101) Set up Vercel and check production after every
deploy.

```
guide me step by step on 6.2
```

```
B
```

- **Context:** #60 is task 6.2 of the scaffold change, creating the Vercel
  project; the agent guided it and the human did it in Vercel. #101 chose
  option B: run the `@smoke` E2E test against production after each Vercel
  deploy.

**Prompt 2:** [Entrega 2] (log #276, #286) Put the database in production.

```
give me the instructions for 9.1
```

```
Yes, run it
```

- **Context:** task 9.1 of the change `add-video-catalog-schema`. The agent
  wrote the steps; the human created the Neon project (Postgres 17), the
  `app_readonly` role and the secrets (`DATABASE_URL` in Vercel,
  `DATABASE_URL_DIRECT` in GitHub Actions).
- **Result:** a workflow runs the migrations on every merge to `main`. Its
  first run created the tables, triggers and grants on Neon, and a write as
  `app_readonly` was rejected, as designed.

**Prompt 3:** [Entrega 2] (log #329, #330) Fix an empty production feed.

```
Deployed I see now a black screen
```

```
run now
```

- **Context:** after REC-002 merged, the route read the empty production
  database, so the feed had nothing to show.
- **Result:** the agent ran the manual loader workflow (`load-curated.yml`),
  which loaded the curated list into production; the feed then served 24
  real Shorts and the smoke test passed. The empty-feed black screen is
  REC-018's job (error and empty states).

### 2.5. Security

**Prompt 1:** (log #85, #86) Protect `main` before the first merge.

```
Protect main first
```

```
Strict, admins too (Recommended)
```

- **Result:** every change to `main` needs a pull request with CI green,
  admins included.

**Prompt 2:** [Entrega 2] (log #280) Choose the database password.

```
CREATE ROLE app_readonly WITH LOGIN PASSWORD '<your password>'; what password should i use?
```

- **Context:** the app reads the database as `app_readonly`, which can only
  `SELECT`; only migrations and the loader use the owner role (ADR 0007).
- **Human adjustment:** the password generated in #279 had been shown in the
  chat, so it was discarded and replaced; the log leaves the secret out.

**Prompt 3:** [Entrega 2] (log #273) Cap model use.

```
Fix all my use of models to at max use sonet medium for all this project.
```

- **Result:** `.claude/settings.json`, the agents and the skills are capped
  at Sonnet 5.5 and `medium` effort; the cap and its limits are in
  `AGENTS.md › Model routing`.

### 2.6. Tests

**Prompt 1:** (log #70, #71) Add end-to-end testing as its own change.

```
I will need playwright and also some rules for E2E test cases.
```

```
Create a new change proposal for this new precondition before we continue with REC-001.
```

- **Result:** Playwright in Chromium on three screen sizes, 13 E2E rules in
  `AGENTS.md`, and ADR 0006.

**Prompt 2:** (log #89) Check that a failing test blocks the merge.

```
it says som checks where nor successful
```

- **Context:** a throwaway PR (#2) with a failing test; it showed the merge
  is blocked and the report is uploaded.

**Prompt 3:** [Entrega 2] (log #238, #240) Handle a flaky E2E test.

```
Slow the flick
```

```
Yes, fixme on CI
```

- **Context:** the `Hard flick` test failed in about 3 of 8 CI runs; a slower
  flick did not fix it.
- **Human adjustment:** the test is skipped on CI with `test.fixme` and
  tracked as D-9 in the draft backlog, as E2E rule 10 says, instead of
  turning retries on.
- **Result (Entrega 2 tests):** Vitest for the feed logic, cursor, route,
  shuffle and loader rules; 82 database tests on a `postgres:17` service in
  CI, named after the spec scenarios; Playwright for every automatable feed
  scenario; the `@smoke` test against a seeded database in CI and against
  production after deploy.

---

## 3. Data model

**Prompt 1:** (log #140) Validate the data model story.

```
Validate REC-020
```

- **Context:** the `validate-backlog` skill ran the `story-validator` agent
  over four rounds (32 findings).

**Prompt 2:** (log #154, #155) Decide when a video is saved and which key it
has.

```
A, write only after the video is processed
```

```
A, and capture the lines in the stories
```

- **Result:** an internal integer `id` with `youtube_id` unique, no pending
  status;
  [docs/architecture/data-model.md](docs/architecture/data-model.md).

**Prompt 3:** [Entrega 2] (log #264, #265) Build the schema as an OpenSpec
change in two PRs.

```
/openspec-explore REC-019
```

```
2 PR is fine to me, openspec-propose
```

- **Context:** REC-019 was validated over seven rounds (52 findings,
  estimate 8) before this.
- **Result:** the change `add-video-catalog-schema`: the Drizzle schema
  (`video`, `recipe`), four migrations, triggers that set the feed-entry
  time, the read-only role, and the `video-catalog` main spec. The first code
  PR (#52) worked with no Neon; the second (#54) added the workflow that
  runs the migrations in production. The data model moved
  to `Current`.

---

## 4. API specification

**Prompt 1:** (log #164, #165) Validate the API story and question the
endpoint design.

```
Validate REC-021
```

```
before toy continue question. how many endpoint are you considering? and what is your choise between this "GET /api/videos/{youtubeId}" and this "GET /api/videos/{Id}"
```

- **Result:** two endpoints, `GET /api/feed` and
  `GET /api/videos/{youtubeId}`: the single-video endpoint takes the YouTube
  ID.

**Prompt 2:** (log #176) Accept the contract details.

```
I will accept all 5
```

- **Result:** [docs/api/openapi.yaml](docs/api/openapi.yaml) (OpenAPI 3.1)
  with schemas, errors, cache headers and examples.

**Prompt 3:** [Entrega 2] (log #299, #302) Question the edge cases before
building the feed API.

```
Explain A valid cursor with no rows left
```

```
The same YouTube ID twice in the list file how can this happen if is unique?
```

- **Context:** re-validating REC-002 against what REC-001 and REC-019 had
  built.
- **Result:** a stale cursor returns an empty last page instead of an error,
  and the loader keeps the first entry of a repeated YouTube ID and skips the
  next one with a reason (a hand-edited list file can repeat an ID even
  though the database column is unique). `GET /api/feed` is now built as the contract says, and
  `openapi.yaml` names its implementation.

---

## 5. User stories

**Prompt 1:** (log #12) Set the rule for acceptance criteria.

````
Add this as a general rule for AC and BDD "

One behavior per scenario, kept short. Each acceptance-criteria scenario has exactly one `Given`, one `When` and one `Then`.

* `Given`: at most two `And`/`But` steps after it (three preconditions at most).
* `When`: no `And`/`But` after it. It’s one action, written as what the user achieves (`When I save the recipe`), not each click.
* `Then`: at most two `And`/`But` steps after it (three results at most), all coming from the same action.
* Preconditions go under `Given`, even if they’re actions the user took earlier.
* If a scenario needs a second action or more steps than this allows, split it into separate scenarios.
* If a story’s acceptance criteria keep breaking these limits, flag the story `needs-splitting`.

Quick test: if you can’t name the scenario as one behavior without using “and,” split it.

"
````

**Prompt 2:** (log #15) Keep a human in the loop.

```
Now add a restriction for user story validation, if the flag needs-human-validation is present it can not be started or used on open spec and can not be moved to in progres. to be validated by human also have to be estimated.
```

- **Result:** every AI-written story starts flagged
  `needs-human-validation`; the hook enforces it.

**Prompt 3:** (log #27, #206) Validate the backlog story by story, and again
before building.

```
Now lets make an agent that runs the validations of the user storys on the backlog one by one. let me make changes and at the end validate the story. If i want i can sop the validation wher im att and continue later. The agent first have to run the skill and then let me review.
```

```
lets /validate-story  REC-001 to see if still fits.
```

- **Result:** the `validate-backlog` skill and the `story-validator` agent,
  built on a validation prompt turned into a skill (#26). [Entrega 2] Before
  building, REC-001 and REC-002 were re-validated against what had changed:
  REC-001 was reopened (12 findings, estimate 3 → 5) and REC-002 took 12
  re-checks (estimate 8).

---

## 6. Work tickets

**Prompt 1:** (log #126) Ask how tickets are sliced.

```
in the backlog what US holds  the Data model(No implementation), the Api Specification (No implementation). Also ansuwer wether are we separating tickets for DB, Backend, Forntend or our metodology is fullstack?
```

**Prompt 2:** (log #128, #131) Full stack by default, layers when splitting.

```
Item 10 (work tickets per layer) for this specify on agent our full stack aproch when it fit in a story but when the storys needs to be divided use the layer aproch. Explore this
```

```
C I acree and lets do the propouse
```

- **Result:** stories are full-stack slices and split by layer only when
  needed; every story has a `layer:` label ("Story slicing" in `AGENTS.md`).

**Prompt 3:** [Entrega 2] (log #211, #212) Decide where the API route of the
first feature lives.

```
For the cons. backend work in a frontend story, overlaps REC-002, and likely raises the estimate. Can we move the backend side to REC-019 or any other?
```

```
#42 B, keep the route in REC-001
```

- **Result:** REC-001 became a full-stack slice (`layer:fullstack`): the
  swipe feed plus a stub `GET /api/feed`, so the feature worked end to end
  before the database existed. REC-002 later swapped the stub for the
  database with no change to the client. Entrega 2 shipped as three tickets:
  REC-001 (5 points), REC-019 (8) and REC-002 (8).

---

## 7. Pull requests

**Prompt 1:** (log #96, #98) Define the review flow and where the AI review
runs.

```
Explore: I want to have My DoR, DoD, and Contribution Document ready. And on this cover a flow for PR review with a template aditional reviewer will be optional for now. if we dont have that mechanism on github we have to addit.
```

```
lets do local.
```

- **Result:** `CONTRIBUTING.md`, Definition of Ready and Done, a PR template
  and CODEOWNERS; every code PR gets `/code-review --comment` from Claude
  Code (`/code-review medium --comment` from the cap) before merge.
  [Entrega 2] It found 5 issues in REC-001 (PR #43), 9 in REC-019 (PR #52)
  and 7 in REC-002 (PR #59); all were fixed or answered on the PR.

**Prompt 2:** (log #138) Choose OpenSpec or a direct PR for every change.

```
fix the documentation to every time i ask for a change or explore a change it suggest tome the one of the 2 paths with a short justification.
```

- **Result:** the agent recommends a path, with one reason, before any work
  (`CONTRIBUTING.md`, `AGENTS.md`).

**Prompt 3:** (log #95) Automate the prompt-log PRs.

```
When "pend-"  is called, i will review and after review PR an merge. withowt asking. fix the flow. and merge now
```

- **Result:** the `pend-` keyword appends the prompts to the log, opens a
  PR and merges it once CI passes.

---

## 8. Human adjustments

Where the human corrected or redirected the AI:

| What changed | Prompts |
|---|---|
| The copied agent setup was rewritten for this project: recipe-specific rules, file-based backlog, English | #1–#10 |
| Acceptance criteria limited to one behavior per scenario; scenarios split | #12–#14 |
| No story starts without human validation and a team estimate | #15 |
| Changed the REC-001 plan to stub data, leaving PERF-2 to other stories | #33 |
| The swipe overlay was dropped after testing on a real Android phone | #42–#43 |
| End-to-end testing became its own change before the first feature | #71 |
| `main` protected before the first merge | #85–#86 |
| The availability check moved out of the MVP | #112 |
| The PRD's role revised: updated with every product decision | #116–#117 |
| Title-only videos in the feed; no manual recipes in the MVP | #142–#143 |
| Validated stories reopened when the docs did not match the decisions | #147 |
| README rebuilt on the template; nothing unknown, everything else linked | #188–#195 |
| [Entrega 2] REC-001 reopened before building; the stub route kept in it instead of moved to another story | #206–#212 |
| [Entrega 2] The agent raised effort but never lowered it; a rule now tells the human when to lower it | #229–#230 |
| [Entrega 2] The flaky `Hard flick` test skipped on CI and tracked, not retried | #238–#240 |
| [Entrega 2] The human questioned why the change's worktree sat outside the project folder; it was kept after the agent explained it | #266–#267 |
| [Entrega 2] All model use capped at Sonnet 5.5 and `medium` effort | #273 |
| [Entrega 2] A password shown in the chat was discarded and replaced | #279–#280 |
| [Entrega 2] The agent was asked whether it had pulled `main` before re-validating | #297 |
| [Entrega 2] The curated list was collected in a separate session with the built-in browser and handed over with its results table | #309–#322 |
| [Entrega 2] The black screen in production was traced to an empty database; the loader was run | #329–#330 |
| [Entrega 2] The iPhone landscape layout bug found on a real phone was recorded with screenshots as D-11 | #331–#333 |
