---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [ ] 1. Add the generalization rule to `kit/templates/rules.md` (writing-a-rule section) and core rule 15 — level: easy — files: `kit/templates/rules.md`, `kit/instructions/core.md` — verify: `grep -n "general failure mode" kit/templates/rules.md kit/instructions/core.md` — commit: `docs(kit): require general rules`
- [ ] 2. Apply it in `kit/skills/light-rules/SKILL.md` when a rule is added or changed — level: easy — files: `kit/skills/light-rules/SKILL.md` — verify: `grep -n "general failure mode" kit/skills/light-rules/SKILL.md` — commit: `docs(kit): apply the rule-generality check in light-rules`
- [ ] 3. Update `.light-kit/rules.md`: the same guidance, a `pending` R-005 for this correction, and R-004 generalized — level: easy — files: `.light-kit/rules.md` — verify: row R-005 exists; R-004 no longer lists the three hook files in its `Rule` column — commit: `docs(rules): record the rule-generality correction`
- [ ] 4. State it in `docs/usage.md` and pin it with a test — level: easy — files: `docs/usage.md`, `tests/kit.test.mjs` — verify: `npm test` — commit: `test(kit): cover the rule-generality guidance`
- [ ] 5. Refresh the user-level installed copies and finish the request — level: easy — files: `~/.light-kit/templates/rules.md`, `~/.claude/skills/light-rules/SKILL.md` — verify: `npm run install-kit -- ~ --level user --dry-run` then run it; `diff` shows the new text — commit: `docs(spec): conclude request 047`

Each task = one verified, coherent commit.

## Risks
- Core rule 15 is always loaded; keep the added clause to one line.
- The project rules file must not lose evidence while the rule text is generalized.
- The install to the home directory must only refresh marker files.

## Test strategy
- Extend the existing `project rules` test to assert the guidance text in the template and the skill.
- Run `npm test`; the install tests already exercise the template refresh.

## Parallelisable tasks
- Tasks 1 and 2 touch different files; 3 depends on the wording chosen in 1. Run in order for one verified commit each.
