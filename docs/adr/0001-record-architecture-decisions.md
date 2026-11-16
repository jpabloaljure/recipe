# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-15
- **Deciders:** Project owner

## Context

The PRD (§11) leaves the tech stack and architecture to a separate technical
design. Those decisions are now being made, and the project is planned with
AI agents that need a stable, readable record of what was decided and why.
The delivery also requires architecture diagrams. Decisions written only in
an OpenSpec change's `design.md` are archived with that change and are hard
to find later.

## Decision

We will record each significant architecture decision as an ADR in
`docs/adr/`, using a short MADR-style template, and document the
architecture with C4 diagrams (levels 1–3) written in Mermaid in
`docs/architecture/c4/`. ADRs and diagrams are updated in the same change
that makes the decision, using the `write-adr` skill.

## Alternatives

- **Decisions only in OpenSpec `design.md`:** archived per change; no single
  place to see current decisions.
- **One decisions log file:** hard to supersede or link a single decision.
- **Full MADR template:** more sections than this project needs.
- **Diagrams in Structurizr DSL or PlantUML:** better C4 tooling, but need
  extra tools or a render server. Mermaid renders on GitHub and diffs as
  text.
- **Diagram images:** cannot be diffed or edited by agents.

## Consequences

- **Positive:** decisions and diagrams are versioned with the code, readable
  on GitHub, and editable by agents.
- **Negative:** someone must keep them current; mitigated by the rules in
  `AGENTS.md` and `openspec/config.yaml` that put ADR and C4 updates into
  each change's tasks.
- **Negative:** Mermaid's C4 support is experimental, with limited layout
  control. Fallback: a `flowchart` with C4-style labels.

## Links

- Change: [`choose-tech-stack`](../../openspec/changes/archive/2026-11-15-choose-tech-stack/design.md) (archived)
- C4: [Architecture overview](../architecture/README.md)
