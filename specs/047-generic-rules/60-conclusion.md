---
step: conclusion
runs:
  - agent: light-tech-writer
    part: conclusion
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 34,960 input · 378,752 cache read · 0 cache write · 6,710 output · 420,422 total
    time: 2m 2s
  - step: 10-understanding
    tokens: 1,349 input · 40,704 cache read · 0 cache write · 1,420 output · 43,473 total
    time: 5s
  - step: 40-plan
    tokens: 314 input · 54,528 cache read · 0 cache write · 113 output · 54,955 total
    time: 1s
  - step: 50-implementation
    tokens: 4,899 input · 713,984 cache read · 0 cache write · 5,821 output · 724,704 total
    time: 1m 22s
  - step: 60-conclusion
    tokens: 997 input · 107,648 cache read · 0 cache write · 1,976 output · 110,621 total
    time: 9s
  - step: total
    tokens: 42,519 input · 1,295,616 cache read · 0 cache write · 16,040 output · 1,354,175 total
    time: 3m 41s
---

# Conclusion

## Summary
A learned rule now states the general failure mode, not the single incident. The requirement lives in the rules template, the `light-rules` skill, core rule 15, the user docs and this project's rules file, and a test pins it.

## What changed
Range: `c8938c164ec1f82806a51cdb78ee7392f418eda3..HEAD` on `docs/047-generic-rules`
- `kit/templates/rules.md` — the rule-writing section requires the general failure mode and widening a one-case rule to its class.
- `kit/skills/light-rules/SKILL.md` — a new **Writing a rule** section; step 4 points at it.
- `kit/instructions/core.md` — rule 15 adds the same constraint in one clause.
- `docs/usage.md` — tells the user the same rule.
- `.light-kit/rules.md` — same guidance, new `pending` R-005, and R-004 generalized (state and count unchanged).
- `tests/kit.test.mjs` — asserts the guidance in the template, the skill and the generated core block.

## Verification evidence
`npm test`: 207 pass, 0 fail. Template and skill copies installed at user level diff clean against the sources.

## Deferred technical debt and open findings
- TD-1: the guidance is repeated in three kit files by design (see `50-implementation.md`).
- R-005 is `pending`; the next two violated tasks make it mandatory.
- Earlier open debt (042, 004/006, 027, 036, 038, 039/040, 041) is untouched and still open.

## Follow-ups
- None.
