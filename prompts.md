# AI usage log

The main prompts used to build Easy Recipes, showing how AI coding assistants
were used in each phase of the project: at most 3 per section, chosen from
initial creation and from the corrections or additions that mattered most.
Each prompt is copied exactly as typed (typos kept) and keeps its number from
the full log, [docs/prompts-log.md](docs/prompts-log.md), where the whole
conversation around it can be read.

## Index

0. [Tools and models](#0-tools-and-models)
1. [Product overview](#1-product-overview)
2. [System architecture](#2-system-architecture)
3. [Data model](#3-data-model)
4. [API specification](#4-api-specification)
5. [User stories](#5-user-stories)
6. [Work tickets](#6-work-tickets)
7. [Pull requests](#7-pull-requests)
8. [Human adjustments](#8-human-adjustments)

---

## 0. Tools and models

| Tool | Model | Phase | What it did |
|---|---|---|---|
| Claude Code (desktop app) | Opus 5.5 | Definition: PRD → backlog, story validation and estimation, architecture (ADRs, C4), data model, API spec, OpenSpec changes, scaffold, CI, PRs | Main agent for planning and building |
| Claude Code (desktop app) | Haiku 5.5 | Some `openspec-explore` sessions | Quick exploration before a decision |
| `story-validator` agent | Same as the session | Backlog validation | Reviews one story at a time |

**How the AI is set up.** `AGENTS.md` (linked as `CLAUDE.md`) holds the
project rules every agent follows. Skills automate the repeatable steps:
`decompose-prd`, `validate-story`, `validate-backlog`, `estimate-story`,
`write-adr` and the `openspec-*` workflow. A hook (`validate-ac.sh`) blocks
backlog edits that break the rules, and every code PR gets a local AI review
before merge. Details: [docs/ai-workflow.md](docs/ai-workflow.md).

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
  README, C4 diagrams and 8 stories were realigned (#146–#147).

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

### 2.2. Main components

**Prompt 1:** (log #33) Settle how the feed component is built.

```
for the question 2. I changed my mind and now build REC-001 with stub data and leave PERF-2 to other stories. For 15 if we could use library what Technical context aere you sugesting?
```

- **Result:** the feed uses CSS scroll-snap and no carousel library (no new
  library without an ADR).

**Prompt 2:** (log #41) Check the riskiest part before estimating.

```
i have for REC-001 a pendent technical check. Help me to make it
```

- **Context:** the agent built a throwaway prototype (scroll-snap feed,
  YouTube players, an optional overlay) and checked it in desktop Chrome.

**Prompt 3:** (log #42) Report the results from a real phone.

```
Slow swipes and watch on youtube work for both, Hard fast fail some go more than one video for show but work well for overlay. the sound and swipe auto play after sond works fine on both.
```

- **Human adjustment:** tested on an Android phone; hard flicks skipped
  videos with the overlay, so the overlay was dropped (#43).

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

### 2.4. Infrastructure and deployment

**Prompt 1:** (log #60) Set up the Vercel project.

```
guide me step by step on 6.2
```

- **Context:** task 6.2 of the scaffold change, creating the Vercel project;
  the agent guided it step by step and the human did it in Vercel.

**Prompt 2:** (log #96) Define the delivery flow.

```
Explore: I want to have My DoR, DoD, and Contribution Document ready. And on this cover a flow for PR review with a template aditional reviewer will be optional for now. if we dont have that mechanism on github we have to addit.
```

- **Result:** `CONTRIBUTING.md`, Definition of Ready and Done, a PR
  template and CODEOWNERS.

**Prompt 3:** (log #101) Check production after every deploy.

```
B
```

- **Context:** option B of the agent's proposal: run the `@smoke` E2E test
  against production automatically after each Vercel deploy, instead of by
  hand.

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

### 2.6. Tests

**Prompt 1:** (log #70) Add end-to-end testing.

```
I will need playwright and also some rules for E2E test cases.
```

**Prompt 2:** (log #71) Make it its own change.

```
Create a new change proposal for this new precondition before we continue with REC-001.
```

- **Result:** Playwright in Chromium on three screen sizes, 13 E2E rules in
  `AGENTS.md`, and ADR 0006.

**Prompt 3:** (log #89) Check that a failing test blocks the merge.

```
it says som checks where nor successful
```

- **Context:** a throwaway PR (#2) with a failing test; it showed the merge
  is blocked and the report is uploaded.

---

## 3. Data model

**Prompt 1:** (log #140) Validate the data model story.

```
Validate REC-020
```

- **Context:** the `validate-backlog` skill ran the `story-validator` agent
  over four rounds (32 findings).

**Prompt 2:** (log #154) Decide when a video is saved.

```
A, write only after the video is processed
```

**Prompt 3:** (log #155) Choose the key and record the decisions.

```
A, and capture the lines in the stories
```

- **Result:** an internal integer `id` with `youtube_id` unique, no pending
  status;
  [docs/architecture/data-model.md](docs/architecture/data-model.md).

---

## 4. API specification

**Prompt 1:** (log #164) Validate the API story.

```
Validate REC-021
```

**Prompt 2:** (log #165) Question the endpoint design.

```
before toy continue question. how many endpoint are you considering? and what is your choise between this "GET /api/videos/{youtubeId}" and this "GET /api/videos/{Id}"
```

- **Result:** two endpoints, `GET /api/feed` and
  `GET /api/videos/{youtubeId}`: the single-video endpoint takes the YouTube
  ID.

**Prompt 3:** (log #176) Accept the contract details.

```
I will accept all 5
```

- **Result:** [docs/api/openapi.yaml](docs/api/openapi.yaml) (OpenAPI 3.1)
  with schemas, errors, cache headers and examples.

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

**Prompt 3:** (log #27) Validate the backlog story by story.

```
Now lets make an agent that runs the validations of the user storys on the backlog one by one. let me make changes and at the end validate the story. If i want i can sop the validation wher im att and continue later. The agent first have to run the skill and then let me review.
```

- **Result:** the `validate-backlog` skill and the `story-validator` agent,
  built on a validation prompt turned into a skill (#26).

---

## 6. Work tickets

**Prompt 1:** (log #126) Ask how tickets are sliced.

```
in the backlog what US holds  the Data model(No implementation), the Api Specification (No implementation). Also ansuwer wether are we separating tickets for DB, Backend, Forntend or our metodology is fullstack?
```

**Prompt 2:** (log #128) Full stack by default, layers when splitting.

```
Item 10 (work tickets per layer) for this specify on agent our full stack aproch when it fit in a story but when the storys needs to be divided use the layer aproch. Explore this
```

**Prompt 3:** (log #131) Choose and propose.

```
C I acree and lets do the propouse
```

- **Result:** stories are full-stack slices and split by layer only when
  needed; every story has a `layer:` label ("Story slicing" in `AGENTS.md`).

---

## 7. Pull requests

**Prompt 1:** (log #98) Choose where the AI review runs.

```
lets do local.
```

- **Result:** every code PR gets `/code-review --comment` from Claude Code
  before merge; on its first PR (#5) it posted 6 comments, all fixed or
  answered.

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
