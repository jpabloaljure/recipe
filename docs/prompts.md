# Prompts

Prompts used in this session to align the agent setup with `docs/PRD.md`, in
order. They are copied exactly as typed. Answers given through question dialogs
or buttons are marked as such.

## 0. Setup before prompting

Done by hand before the first prompt:

1. **PRD:** wrote the product requirements in `docs/PRD.md` (Easy Recipes from
   YouTube, MVP draft).
2. **OpenSpec:** installed OpenSpec in the repo, which created `openspec/` and
   the `openspec-*` skills.
3. **AGENTS.md:** copied in from an earlier project (FlowSync).
4. **Hook:** copied in `validate-ac.sh`, a guard that blocks closing a story
   without Given/When/Then acceptance criteria.
5. **Two skills**, copied in from the same earlier project:
   - `SKILL.md`: `decompose-prd`, which breaks a PRD into epics and user
     stories.
   - `SKILL 2.md`: `estimate-story`, which estimates a user story.

The copied files still described the earlier project (FlowSync, Linear,
Spanish), so the prompts below adapt them to this PRD.

## 1. Review the decompose-prd skill against the PRD

```
/openspec-explore Lets check this @SKILL.md and review every asumption is there that does not align with PRD
```

## 2. Direction for the fixes (button answer)

```
Recipe-specific
```

## 3. Start with AGENTS.md

```
lets go by steps, lets focus on AGENTS.md aske the questions you need to fixit for this project
```

Answers in the question dialog:

- Modules: `7 modules (Recommended)`
- Linear: `im not using linear. i need you to sugest a file sistem to hold the backlog here for now.`
- Stack: `Remove, mark TBD (Recommended)`
- Hook and symlink: `Keep both, add later`

## 4. Language

```
language is english
```

Answers in the question dialog:

- Backlog layout: `on file per epic`
- Type label for launch work: `Use type:spike`

## 5. Write AGENTS.md

```
write agent.
```

## 6. Create the CLAUDE.md symlink

```
create the symlink CLAUDE.md
```

## 7. Review the validate-ac hook

```
@validate-ac.sh this is the validate, pleace review if the hooke mace sence for this proyect.
```

## 8. Rewrite the hook (button answer)

```
Yes, rewrite it
```

## 9. Update the decompose-prd skill (button answer)

```
Yes, SKILL.md next
```

## 10. Fix the estimation skill and install both skills

```
fix Skil 2 and call it estimate-srory. move both to be able to work.
```

## 11. Run decompose-prd on the PRD (button answer)

```
Yes, run it
```

## 12. Add a general rule for acceptance criteria (BDD)

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

## 13. Split the scenarios that break the rule (button answer)

```
Yes, split them
```

## 14. Move the comment scenarios to a new story

```
"comment scenario is now three" move to a new story
```

### Summary (prompts 12–14)

- **Goal:** make every acceptance-criteria scenario describe one short behavior, and bring the saved backlog in line with that rule.
- **Changes:**
  - `AGENTS.md`: new "Acceptance criteria (BDD) rules" section.
  - `.agents/skills/decompose-prd/SKILL.md` and `backlog/README.md`: point to the rule.
  - `backlog/E02-recipe-every-video.md`: REC-006 layout scenario split in two; REC-008's comment scenarios moved to a new story, REC-017.
  - `backlog/E04-launch-readiness.md`: REC-016 also blocked by REC-017.
  - `backlog/README.md`: next free ID is REC-018.
- **Result:** every story has 3–5 single-behavior scenarios, and no story is flagged `needs-splitting`. E02 now has 6 stories, one over the skill's cap of 5, by choice.

## 15. Require human validation and an estimate before a story can start

```
Now add a restriction for user story validation, if the flag needs-human-validation is present it can not be started or used on open spec and can not be moved to in progres. to be validated by human also have to be estimated.
```

Answers in the question dialog:

- Flag scope: `All AI-generated (Recommended)`
- What counts as estimated: `New Estimate line (Recommended)`
- Enforcement: `Enforce in hook (Recommended)`

### Summary (prompt 15)

- **Goal:** no AI-generated story can be started or turned into an OpenSpec change until a human validates it, and validation requires an agreed estimate.
- **Changes:**
  - `AGENTS.md`, `backlog/README.md`: new `needs-human-validation` flag and `**Estimate:**` field, with the rule.
  - `.agents/skills/decompose-prd/SKILL.md`: new stories get the flag and `Estimate: —`.
  - `.agents/skills/estimate-story/SKILL.md`: sets `Estimate` only to the team-agreed size; never removes the flag on its own.
  - `openspec/config.yaml`: context and proposal rule forbidding changes from flagged stories.
  - `.claude/hooks/validate-ac.sh`: blocks flagged stories from `in-progress`/`done`, and blocks removing the flag without a valid `Estimate`.
  - `backlog/E01`–`E04`: all 17 stories flagged, with `Estimate: —`.
- **Result:** the hook passed 8 test cases, and all 17 stories are locked until a human validates and estimates each one. Who removes the flag, and OpenSpec use, rely on the written rules, not the hook.

## 16. Write the project README

```
Evaluate and remake the readme to cover what is in this project any thing that is not defined but is missing leav it as TBD.
```

### Summary (prompt 16)

- **Goal:** a root README that covers everything the project defines, with undefined parts marked TBD.
- **Changes:**
  - `README.md` (new): project info, overview, features, scope, performance targets, backlog, repo structure, AI workflow, open questions.
  - `docs/checklist.md`: overview ✅; README and project info sheet 🟡.
- **Result:** the README is the delivery's entry point. Name, author, URLs, architecture, stack, data model, API spec, work tickets and setup are TBD.

## 17. Explore tech stack options

```
/openspec-explore Teck stack selection. Evaluate the teck stach modern and best aproch to pick as teck stack. Limit to the MVP do nod add nothin unnecesary. Kep it simple a possible
```

## 18. Compare how each option scales

```
Lets evaluate now the excalability fo the A,B,C  options? Its important to escalate in the future.
```

## 19. Choose option B and propose the change

```
/openspec-propose B option is my choise
```

## 20. Add C4 diagrams and ADRs to the change

```
Make sure you are covering the C4 Arquitecture documentation on mermaid. and a proper ADRs files and diagrams. some of them dont exist yet but we should be able to storthem and generatethem and mantaine them along the way.
```

## 21. Approve the revised artifacts (button answer)

```
Yes, write all three
```

## 22. Apply the change (button answer)

```
Yes, apply it
```

## 23. Review before archiving (button answer)

```
Review first
```

## 24. Archive the change

```
archive
```

### Summary (prompts 17–24)

- **Goal:** pick a simple MVP stack that can grow into the PRD roadmap, and document the architecture (C4 + ADRs) in a way that stays current.
- **Changes:**
  - OpenSpec change `choose-tech-stack`: proposed, revised, applied and archived (`openspec/changes/archive/2026-11-15-choose-tech-stack/`).
  - `AGENTS.md`: stack table (Next.js + React 19 on Vercel, Postgres on Neon + Drizzle, ingestion on GitHub Actions, pnpm, Vitest; LLM provider TBD) and ADR/C4 rules.
  - `docs/architecture/`: C4 levels 1–3 in Mermaid (context and containers Current; web app and ingestion components Proposed).
  - `docs/adr/`: template, index with pending decisions, ADRs 0001–0004.
  - `.agents/skills/write-adr/` (+ symlink): creates ADRs and updates C4 diagrams.
  - `openspec/config.yaml`: design/tasks rules requiring ADR and C4 updates.
  - `README.md`, `docs/checklist.md`: architecture and tech stack filled in, both ✅.
- **Result:** option B chosen after comparing simplicity and scaling; all 5 diagrams render and all links resolve. Data model, API spec, work tickets and the LLM provider are next.

## 25. Check whether the architecture is defined

```
/openspec-explore  do we have an arquitecture defined?
```

## 26. Turn a validation prompt into a skill

```
Out of this make a skill to use for a single user story that helps to validate it. "

Tu tarea: identifica edge cases, supuestos implícitos,
escenarios faltantes, y dependencias o riesgos no
mencionados. No reescribas la story, solo lista lo
que falta o lo que asumiste.

"
```

## 27. Design an agent that validates the backlog story by story

```
Now lets make an agent that runs the validations of the user storys on the backlog one by one. let me make changes and at the end validate the story. If i want i can sop the validation wher im att and continue later. The agent first have to run the skill and then let me review.
```

## 28. Ask for an example of using it

```
show me an example of what will be my use of this ?
```

## 29. Create the skills and the agent

```
Write it
```

### Summary (prompts 25–29)

- **Goal:** know where the architecture stands, then give the human an interactive, resumable way to validate backlog stories one by one.
- **Changes:**
  - `.agents/skills/validate-story/` (+ symlink): lists edge cases, assumptions, missing scenarios, dependencies/risks and rule breaks for one story, without rewriting it.
  - `.claude/agents/story-validator.md`: read-only agent that runs `validate-story` on one story and tracks resolved/open findings.
  - `.agents/skills/validate-backlog/` (+ symlink): the loop (check → review → `done` → estimate → `validated`, plus `skip`/`stop`), resumable.
  - `backlog/validation-log.md` (new), `AGENTS.md`, `backlog/README.md`: progress log and pointers to the new workflow.
- **Result:** the architecture's shape (C4 levels 1–2, ADRs) is defined, but data model, API contract and operations are not. Story validation is ready to run with `/validate-backlog`; no story has been validated yet.

## 30. Start validating the backlog

```
/validate-backlog
```

## 31. Answer the REC-001 findings

```
1. Yes 2.Add blocked-by:REC-002, REC-003 3. REC-015’ 4. empty feed: just an empty feed message, for the other 2 cases show an Ops something went wrong message. 5. loop back 6. An error with a removed video just load next one. 7 keep layout and remove load to verified in REC-15, 8. don't split keep it as a single navigation test. 9 For MVP keep it as 1 video per gesture and keyboard are not part of the MVP but document those behaviors on a draft-backlog-list.md file to come back on those in the future. 10. scroll the recipe this belong to REC-006. 11. when the user gets to a video and do nothing, nothing happens no time limit for MVP in the feature after some time we could rice a message to tap the screen to start playback (document on draft-backlog-list.md), when the video finished playing back keep infinite playback on itself, when the panel auto opens the vide keeps playing. 12. yes. 13. Landscape same layout as pc browser. for MVP just chrome support. 14. REC-006. Everything regarding the recipe container and layout should be moved to E02. 15. explain the finding better before I decide.
```

## 32. Ask what an ADR is

```
what is ADR? do not write anything yet.
```

## 33. Change the dependency decision and ask about a swipe library

```
for the question 2. I changed my mind and now build REC-001 with stub data and leave PERF-2 to other stories. For 15 if we could use library what Technical context aere you sugesting?
```

## 34. Settle the remaining REC-001 decisions

```
#1: the technical check as a note in Technical context, #15: (a). 10-senario problem do as you recomended.
```

## 35. Re-check REC-001

```
Re-check REC-001 with the validator now?
```

## 36. Answer the re-check findings

```
20 “Does nothing” the rest do as you sugest.
```

## 37. Ask about Fibonacci story points

```
are we using fibonacii story points some were?
```

## 38. Pause validation and plan Fibonacci estimates

```
lets stop here the validation and. MI need to keep the size label: S/M/L/XL, but Estimate wich if i dont understud wrong is the AI estimation should be Fibonacci points (1, 2, 3, 5, 8, 13), and the estimate-story: should give a Fibonacci points (1, 2, 3, 5, 8, 13) as the final team agreement.  Explore this to keep consistency on the skils and documentation. The AI estimation should be made after the AC aproval and before I input the teams estimation so I can ised as part of the team. Do not wrigt yet.
```

## 39. Confirm the estimation choices

```
1 as the recommendation, 2 as the recommendation 3 directly, do not use open specs for this. One more thing follow for the fibonacci estimations the fibonacci use that was on the SKILL 2.md  file deleted. do not wright yet but the validation log pendant.
```

## 40. Apply the Fibonacci change

```
Yes, write it
```

### Summary (prompts 30–40)

- **Goal:** validate the first story with the new workflow, and switch estimation to Fibonacci points with an AI estimate before the team's.
- **Changes:**
  - `backlog/E01-browse-feed.md`: REC-001 refined (5 scenarios, stub data, CSS scroll-snap with no library, technical check note); new REC-018 for empty/error/unavailable states; REC-002 notes the end-of-catalog signal.
  - `backlog/E02`, `E03`: REC-006, REC-007 and REC-014 took the scenarios moved out of REC-001.
  - `backlog/draft-backlog-list.md` (new): post-MVP ideas D-1 to D-4.
  - Estimation: new `AI estimate` field; `AI estimate` and team `Estimate` in Fibonacci points (spikes in hours), made only after criteria approval; `size:*` stays t-shirt. Updated in `AGENTS.md`, both READMEs, `estimate-story` (rewritten from the original SKILL 2.md rules), `decompose-prd`, `validate-backlog`, the hook, all 18 stories and the validation log.
- **Result:** REC-001's 20 findings are resolved and it is paused `in review` before criteria approval. The hook passes 11 test cases for the new estimates. The context is large, so the next step is to resume validation in a new session.


## 41. Run the REC-001 technical check

```
i have for REC-001 a pendent technical check. Help me to make it
```

## 42. Report the Android results

```
Slow swipes and watch on youtube work for both, Hard fast fail some go more than one video for show but work well for overlay. the sound and swipe auto play after sond works fine on both.
```

Answers in the question dialog:

- Flick fail: `Red overlay page skipped`

## 43. Drop the overlay (button answer)

```
Drop the overlay
```

### Summary (prompts 41–43)

- **Goal:** run REC-001's pending technical check (swipes over the YouTube player, taps to unmute and the YouTube link, one video per flick) before estimating.
- **Changes:**
  - Throwaway prototype (scroll-snap feed, YouTube IFrame players, optional overlay, on-screen log) in the session scratchpad, not in the repo; checked in desktop Chrome by the agent and in Android Chrome by the human.
  - `backlog/E01-browse-feed.md`: REC-001 Technical context now uses plain scroll-snap with no overlay, own unmute button and "Watch on YouTube" link, and records the check results; Estimation notes get a dated update.
  - `backlog/validation-log.md`: REC-001 row records the results and the decision.
- **Result:** all checks pass without the overlay; with it, hard flicks on Android skipped videos, so it was dropped. REC-001 is ready to resume validation at acceptance-criteria approval.


## 44. Resume backlog validation

```
/validate-backlog
```

## 45. Ask for recommendations on REC-001's new findings

```
give me your recomendations
```

## 46. Apply the recommendations

```
keep going
```

## 47. Apply the follow-up fixes (button answer)

```
Yes, apply them
```

## 48. Approve REC-001's acceptance criteria (button answer)

```
AC approved
```

## 49. Team estimate for REC-001 (button answer)

```
3
```

## 50. Validate REC-001 (button answer)

```
validated
```

## 51. Stop the session

```
stop
```

### Summary (prompts 44–51)

- **Goal:** finish validating REC-001 after its technical check, then start REC-002.
- **Changes:**
  - `backlog/E01-browse-feed.md`: REC-001 Technical context aligned with the no-overlay decision (no app-owned YouTube button; tap behavior owned by REC-003; Chrome on Android and desktop only; three-player re-check handed to REC-004/REC-015; check wording fixed); size reasoning rewritten (`size:M` kept); AI estimate 3, team Estimate 3, `needs-human-validation` removed.
  - `backlog/README.md`: new "Decided" section with the supported-browser decision (iOS out of scope).
  - `backlog/validation-log.md`: REC-001 `validated`; REC-002 `in review` with 13 open findings.
- **Result:** REC-001 is validated (1 of 18). REC-002's first check returned "needs refinement" (shuffle vs CDN cache, stable paged order, end-of-catalog AC, split the availability check); the session stopped before reviewing them. Findings #27 and #29 are carried to REC-003, REC-004 and REC-015.


## 52. Explore REC-001 before proposing a change

```
/openspec-explore REC-001
```

## 53. Propose the change

```
/openspec-propose
```

Question dialog answer: `Scaffold only, first (Recommended)`.

## 54. Check that git init is planned

```
did you add the git init to initialite git for this proyect?
```

## 55. Apply the scaffold change

```
/openspec-apply-change
```

## 56. Install pnpm from the terminal

```
can you use a terminal and instalit?
```

## 57. First commit (button answer)

```
Commit the working tree changes with a sensible message.
```

## 58. Repository description

```
generate Repo description.
```

## 59. Push to the GitHub repository

```
this is te repo "https://github.com/jpabloaljure/recipe.git" use terminal an go ahead.
```

## 60. Guide for the Vercel project (task 6.2)

```
guide me step by step on 6.2
```

## 61. Ask for the local Node version

```
what is my actual node version?
```

## 62. Move to Node 26

```
lets update to node 26 that is the latest on vercel
```

## 63. Vercel engines warning

```
step 7 ive got this warning. "Warning: Detected "engines": { "node": ">=26" } in your `package.json` that will automatically upgrade when a new major Node.js Version is released. Learn More: https://vercel.link/node-version"
```

## 64. Production URL

```
recipe-henna-pi.vercel.app
```

## 65. Confirm the device check (button answer)

```
Yes, both OK
```

### Summary (prompts 52–65)

- **Goal:** scaffold the app as its own OpenSpec change before REC-001, put it on GitHub with CI, deploy it to Vercel, and archive the change.
- **Changes:**
  - `openspec/changes/archive/2026-11-16-scaffold-web-app/`: proposal, design (7 decisions; Decision 5 moved from Node 24 to Node 26 during apply), tasks (18 of 18 done).
  - `docs/adr/0005-single-package-repository-layout.md`: new ADR (one package at the repo root); indexed in `docs/adr/README.md` and listed in the C4 level 2 diagram's related ADRs.
  - App scaffold: `package.json` (Next.js 16, React 19, TypeScript strict, Vitest; `engines.node` `26.x`), `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.nvmrc` (`26`), `.gitignore`, `src/app/` (placeholder page), `src/lib/site.ts` with its test, `.claude/launch.json`.
  - `.github/workflows/ci.yml`: typecheck, test and build; automatic setup-node cache turned off, pnpm installed with npm (Node 26 has no Corepack).
  - `README.md` (getting started, repository and deployed URL rows) and `docs/checklist.md` (git repo row done, URLs filled in).
- **Result:** the repo is on [GitHub](https://github.com/jpabloaljure/recipe) with green CI, and the placeholder is live at [recipe-henna-pi.vercel.app](https://recipe-henna-pi.vercel.app), checked on Android and desktop Chrome. The change is archived; next is an OpenSpec change for REC-001.

## 66. Start a proposal with no input

```
/openspec-propose
```

## 67. Propose the change for REC-001

```
/openspec-propose REC-001
```

## 68. Testing and stub slides (dialog answers)

```
Testing: Pure logic + device checks (Recommended)
Stub slides: Plain YouTube embed (Recommended)
```

## 69. Ask whether the plan has E2E tests

```
Is this plan using e2e test cases that diserve to cover the functionality? do not change plan yet
```

## 70. Ask for Playwright and E2E rules

```
I will need playwright and also some rules for E2E test cases.
```

## 71. Make E2E testing its own change

```
Create a new change proposal for this new precondition before we continue with REC-001.
```

## 72. Ask for the testing workflow

```
questions. With this plan implemented what will be the testing work flow. Mention Test dev and test QA, smoke test, sanity test and Regression. when and how on the workflow with open spec. Be concise.
```

## 73. Ask why CI runs on pull requests

```
why you say every push and pull? i understand every push but why also on every pull? Short explain
```

## 74. Apply the E2E change

```
Ok lets /openspec-apply-change
```

## 75. Who downloads Chromium (dialog answer)

```
You run it (Recommended)
```

## 76. Desktop gestures (dialog answer)

```
Touch swipe everywhere (Recommended)
```

## 77. Open the pull request (button answer)

```
Open a PR
```

## 78. Install the GitHub CLI

```
lets install gh
```

## 79. Ask where the sign-in tab is

```
where is that?
```

## 80. Answer the sign-in prompt

```
Y
```

## 81. Ask why the terminal tab takes no input

```
why i cant writ on it?
```

## 82. Docker image for Linux debugging (dialog answer)

```
[No preference]
```

## 83. Turn on Auto-fix for PR #1 (button answer)

```
Yes, turn it on
```

## 84. Ask whether to merge

```
shall i merge now?
```

## 85. Protect main before merging (button answer)

```
Protect main first
```

## 86. How strict the protection is (dialog answer)

```
Strict, admins too (Recommended)
```

## 87. Merge PR #1 (button answer)

```
Merge it
```

## 88. Run the failing-test check (button answer)

```
Run the check
```

## 89. Report the failed checks on PR #2

```
it says som checks where nor successful
```

## 90. Archive the E2E change (button answer)

```
Archive it
```

## 91. Turn on Auto-fix for PR #3 (button answer)

```
Yes, turn it on
```

## 92. Merge PR #3

```
merge
```

### Summary (prompts 66–92)

- **Goal:** plan REC-001 (vertical swipe feed), then, before building it, add end-to-end testing with Playwright and project rules for E2E test cases as their own OpenSpec change; get it through CI on GitHub, protect `main`, and archive the change.
- **Changes:**
  - `openspec/changes/add-vertical-swipe-feed/`: REC-001 plan (proposal, `feed` spec with 8 requirements, design, tasks); not committed yet, waiting for its E2E tasks.
  - `openspec/changes/archive/2026-11-16-add-e2e-testing/`: proposal, design (7 decisions; gestures changed twice during apply), tasks (15 of 15 done).
  - `docs/adr/0006-playwright-end-to-end-tests.md`: new ADR (Playwright, Chromium only); indexed in `docs/adr/README.md`; README ADR table now also lists 0005.
  - `playwright.config.ts` (3 projects, production build, no retries), `e2e/support/` (network guard, raw CDP touch-swipe helpers, `onlyOn`, self-tests), `e2e/app/smoke.spec.ts`; `@playwright/test` 1.65.1 and a `test:e2e` script in `package.json`; `.gitignore`.
  - `.github/workflows/ci.yml`: cached Chromium install, E2E run, report upload on failure.
  - `AGENTS.md` (13 E2E test rules, stack table), `openspec/config.yaml` (tasks rule: an E2E test or a manual check per spec scenario), `README.md` (stack, Getting started), `docs/checklist.md`.
  - GitHub: `gh` installed and signed in; `main` protected (CI `check` required, up to date, PR required, admins included).
- **Result:** PR #1 (E2E setup) and PR #3 (archive) are merged with green CI. Throwaway PR #2 showed that a failing E2E test blocks the merge and uploads the report. The swipe helpers needed two fixes found on the way: the mouse wheel doesn't follow scroll-snap in headless Chromium, and `synthesizeScrollGesture` doesn't scroll on Linux, so they now send raw touch events (360 of 360 runs on macOS and Linux). Next: add REC-001's E2E tasks to `add-vertical-swipe-feed`.

## 93. Log the whole session (dialog answer)

```
Whole session (Recommended)
```

## 94. Open the prompt-log PR (button answer)

```
Yes, open a PR
```

## 95. Fix the pend- flow and merge

```
When "pend-"  is called, i will review and after review PR an merge. withowt asking. fix the flow. and merge now
```

## 96. Explore DoR, DoD and a contribution guide

```
Explore: I want to have My DoR, DoD, and Contribution Document ready. And on this cover a flow for PR review with a template aditional reviewer will be optional for now. if we dont have that mechanism on github we have to addit.
```

## 97. Ask where the AI review runs

```
AI review how is made? on a tool on gh or localy?
```

## 98. Choose the local AI review

```
lets do local.
```

## 99. Choose separate DoR and DoD files

```
Option B
```

## 100. Accept the production @smoke check

```
production check with @smoke its ok
```

## 101. Run the production check automatically

```
B
```

## 102. Create the change

```
yes, create the change
```

## 103. Apply the change (button answer)

```
Apply it
```

## 104. Trigger for the production smoke (dialog answer)

```
Vercel status on main (Recommended)
```

## 105. Approve the GitHub settings (dialog answer)

```
Apply them (Recommended)
```

## 106. Ask what is left

```
what is missing and whay is nor done?
```

## 107. Merge PR #5

```
merge it
```

## 108. Archive the change (button answer)

```
Archive it
```

## 109. Merge PR #7 (button answer)

```
Yes, merge it
```

### Summary (prompts 93–109)

- **Goal:** fix the `pend-` flow so prompt logs merge without asking, then set up a Definition of Ready, a Definition of Done and a contribution flow (PR template, local AI review, optional human review, production smoke check) as an OpenSpec change, and ship it through that same flow.
- **Changes:**
  - `docs/prompts.md`: prompts 66–92 logged (PR #4); the `pend-` memory now commits, opens the PR and merges without asking.
  - `CONTRIBUTING.md`, `docs/process/definition-of-ready.md`, `docs/process/definition-of-done.md`: the flow and the two checklists, linking the rules in `AGENTS.md`.
  - `.github/pull_request_template.md`, `.github/CODEOWNERS` (`* @jpabloaljure`).
  - `.github/workflows/smoke-production.yml`: `@smoke` against production when the `Vercel` commit status turns green on `main` (Vercel sends no deployment events here); `playwright.config.ts` gains `BASE_URL`.
  - `AGENTS.md` ("Contributing" section), `README.md`, `docs/checklist.md`.
  - `openspec/changes/archive/2026-11-16-add-contribution-workflow/`: proposal, design (8 decisions), tasks (12 of 12).
  - GitHub: conversation resolution required, merge commits only, head branches deleted after merge; `gh` token gained the `workflow` scope.
- **Result:** PR #5 went through the new flow: CI green, AI review posted 6 comments (4 fixed, 2 answered), all resolved, merged; the production smoke passed on merge commit `4a923e2` and the branch was deleted automatically. PR #7 archived the change, and its new-PR page showed the template filling the body. Next: add E2E tasks and a DoD close-out to REC-001 (`add-vertical-swipe-feed`).

## 110. Resume backlog validation

```
/validate-backlog
```

## 111. Ask for suggestions on the key findings

```
what are your sugestions for 1,2,7,4
```

## 112. Move the availability check out of the MVP

```
4# move this out of MVP keep on the draft back backlog List. 1, 2 ,7 stick with your sugestion.
```

## 113. Options as a separate step after findings

```
Fix this agent flow so you gave me the suggestions and alternatives. for me to deside. Always build the suggestions/alternatives choice after building the findings. not at the same time.
```

## 114. Build the options (button answer)

```
Yes, build options
```

## 115. Next-page failure and cache choices

```
#18 REC-018 owns we will handle there. #15 + #5 Go with C for MVP and draft backloaded for future improvement.
```

## 116. PRD role, first take

```
#22. PRD its an initial document that does not need to be updated. with those missing behaviours that are not on the Epics, we can add them to the draft.backlog.list.  Or correct if im wrong with this rezoning. All the rest do as recomended.
```

## 117. Schema story, deferred E2E check, PRD role revised

```
#27 B. separate story. #28 Revalidate after the E2E pr is done. #22 PRD.md is not the source of truth. but is the document that describe the product at high level. so updated each time is needed in consequence so it does have the main context of the project to be readable to the stakeholders but keep it aligned with the project's reality, code and documentation. For all the rest # do as recommended.
```

## 118. Accept the recommended options

```
all A
```

## 119. Tied ready times

```
#38 A
```

## 120. Paging skips nothing

```
#39 A
```

## 121. Approve REC-002's acceptance criteria (button answer)

```
AC approved
```

## 122. Team estimate for REC-002 (button answer)

```
5
```

## 123. Which prompts to log (dialog answer)

```
From /validate-backlog
```

## 124. Validate REC-002

```
REC-002 validate
```

## 125. Redo the prompt log on the updated main

```
lets rebse with master nad do pend again here
```

### Summary (prompts 110–125)

- **Goal:** validate REC-002 (feed shows only ready videos, newest first with variety) with the `validate-backlog` flow, change that flow so options come after the findings as their own step, then start REC-003.
- **Changes:**
  - `.agents/skills/validate-backlog/SKILL.md`: new Options step (a recommended option A plus alternatives for each finding, built after the findings) and an `#N A` choice command. `validate-story` and the `story-validator` agent now list findings only.
  - `backlog/E01-browse-feed.md`: REC-002 rewritten (10 ACs; client shuffles within each page; cursor on ready time and id; page size 10; 1-hour cache, `no-store` for empty and error responses) and validated at 5 points. New story REC-019 (database schema and migration; the database sets the ready time). REC-018 now owns next-page failures and reaching the end while a page is loading.
  - `backlog/E03-save-and-share.md`: REC-014 owns how a deep-linked video joins the feed.
  - `backlog/draft-backlog-list.md`: D-5 (periodic availability check) and D-6 (refresh the cache after ingestion).
  - `backlog/README.md`, `AGENTS.md`: the PRD is the high-level description for stakeholders, not the source of truth, and is updated whenever a decision changes the product (Decided 2, 3). `docs/PRD.md` v0.2 aligned (API-2, PERF-6, §9, §10).
  - `backlog/validation-log.md`: REC-002 validated (findings #1–#39); REC-003 in review.
- **Result:** REC-002 is validated (AI estimate 5, team estimate 5) and stays blocked by REC-019; #28 (E2E data and a predictable shuffle) is to be re-checked. REC-003's first check found 16 findings, with options waiting for a choice. The first prompt-log PR (#6) clashed with prompts 93–109 logged from another session, so this log replaces it. The backlog and skill changes are not committed yet.
