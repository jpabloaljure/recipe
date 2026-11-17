# Definition of Ready

A backlog story is **ready** when it may become an OpenSpec change
(`openspec-propose`). Each item links the rule that defines it; the rules
live in [AGENTS.md](../../AGENTS.md), not here.

## Checklist

- [ ] **Backlog format.** User story sentence, one label of each kind and a
  PRD trace. See [Backlog](../../AGENTS.md#backlog) and
  [Labels](../../AGENTS.md#labels-every-story-always-one-of-each).
- [ ] **Acceptance criteria approved.** Given/When/Then within the limits in
  [Acceptance criteria (BDD) rules](../../AGENTS.md#acceptance-criteria-bdd-rules),
  approved by a human.
- [ ] **Validated and estimated.** `needs-human-validation` removed and a
  team `Estimate` set. See
  [Backlog quality rules](../../AGENTS.md#backlog-quality-rules); the hook
  `.claude/hooks/validate-ac.sh` enforces it.
- [ ] **Small enough.** Not flagged `needs-splitting`; estimate within the
  scale in [Estimation](../../AGENTS.md#estimation).
- [ ] **Not blocked.** Every `blocked-by:REC-NNN` story is `done`.
- [ ] **Context known.** Dependencies, risks and open decisions are written
  in the story's Technical context, and any spike that de-risks the story is
  `done`.
- [ ] **Scope edges named.** Out-of-scope items name the stories that own
  them.

## Spikes

A `type:spike` story needs only the first five items. Its estimate is a
timebox (`spike <N>h`).

## Next

Once ready, the story becomes an OpenSpec change and follows
[CONTRIBUTING.md](../../CONTRIBUTING.md) until it meets the
[Definition of Done](definition-of-done.md).
