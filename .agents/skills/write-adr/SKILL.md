---
name: write-adr
description: Creates or supersedes an Architecture Decision Record in docs/adr/ for Easy Recipes, updates the ADR index, and updates the affected C4 diagrams in docs/architecture/c4/. Use when the user (or an OpenSpec design/task) makes an architecture decision — choosing or replacing a framework, service, database, hosting, external API, or a major structural pattern — or asks to record, write, supersede or list ADRs, or to update the C4 diagrams.
effort: medium
---

# write-adr

You keep the project's architecture record current: one ADR per decision in
`docs/adr/`, and C4 diagrams (Mermaid) in `docs/architecture/c4/` that match
those decisions. Follow `docs/adr/README.md` and
`docs/architecture/README.md`; they win if anything here conflicts.

## When an ADR is needed

Write one when a decision is hard to reverse or shapes the structure:
choosing, adding, replacing or removing a framework, library with
architectural impact, database, hosting, external service or API, or a
pattern that several parts must follow. Do not write ADRs for routine code
choices.

Only record decisions the user has made or approved. If a decision is still
open, add it to "Pending decisions" in `docs/adr/README.md` instead of
creating an ADR (no empty or speculative ADRs).

## Steps

1. **Read** `docs/adr/README.md` (index, pending decisions, rules),
   `docs/adr/template.md`, and the C4 files in `docs/architecture/c4/`.
2. **Number:** take the highest `NNNN` in `docs/adr/` and add 1. Never reuse
   a number.
3. **Write** `docs/adr/NNNN-<kebab-title>.md` from the template:
   - Status `Accepted` if the user decided; `Proposed` if it still needs
     their approval.
   - Context with facts and PRD references; Decision in active voice ("We
     will…"); every alternative considered and why not; positive and
     negative consequences.
   - Links: the OpenSpec change (if any), the C4 diagrams affected, PRD
     sections, related ADRs.
4. **Supersede** (when the decision replaces an earlier one): in the old ADR
   change only the Status line to `Superseded by [NNNN](NNNN-<slug>.md)`.
   Never edit anything else in an Accepted ADR.
5. **Index:** add the row to the table in `docs/adr/README.md`, update any
   superseded row's status, and remove the item from "Pending decisions" if
   this ADR resolves it.
6. **C4 diagrams:** decide which levels the decision affects:
   - external system or user type → Level 1 (`01-system-context.md`)
   - deployable part, database, hosting → Level 2 (`02-containers.md`)
   - major part inside a container → that container's Level 3 file

   Update each affected Mermaid diagram, add the ADR to its "Related ADRs"
   list, and set `Status: Current` only if the diagram now matches built
   code (or, for levels 1–2, the decided architecture). If a new container
   needs a Level 3 diagram, create `03-components-<container>.md` with
   `Status: Proposed` and add it to `docs/architecture/README.md`.
7. **Other docs:** if the decision changes the stack table, update
   `AGENTS.md` ("Stack") and the README's "Tech stack" and "Architecture"
   sections so they agree.
8. **Check:**
   - Every file in `docs/adr/` (except `README.md` and `template.md`) is in
     the index, and the index has no missing files.
   - Every relative link you added resolves.
   - Each diagram you touched still renders (GitHub preview or
     https://mermaid.live). Mermaid C4 is experimental: keep diagrams small,
     and fall back to a `flowchart` with C4-style labels if one won't render.
9. **Doc check:** run the `doc-checker` agent with the files you changed.
   Fix each `problem` it reports, or say why it is not one; check each
   `unsure` item yourself. It only reports; the decisions stay with you.

## Output

List the ADR created (number, title, status), any ADR superseded, the index
and pending-decision changes, and each C4 file updated with what changed.

## Constraints

- Write in English.
- Do not invent decisions, alternatives the user did not consider and you
  cannot justify from the context, or stack choices beyond what was decided.
- Use the Write/Edit tools, not shell commands, for these files.
