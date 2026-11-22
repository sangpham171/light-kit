---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 66,852 input · 1,678,080 cache read · 0 cache write · 20,366 output · 1,765,298 total
  time: 4m 47s
---

# Request 043 — Rule triggers beyond the review

Date: 2026-11-22
Requested by: the user

## Original request
> it seems the rules is now written only after the reviewer agent. I want the rules is written in others cases: like user request a bug from a previous request, or something still not work, or others thing ...

## Conversation context
One-message request: the user reports observed behaviour (rules were only added from review findings) and asks for other triggers.

### Decisions
- Name the triggers explicitly in `light-rules` and the rules template: a user-reported bug or regression, a failed test/build/lint/manual check, a review or tester finding, a user correction, a defect found while implementing, and a request caused by earlier work. Reason: the generic "after a task" wording did not fire outside the review checklist.
- Add a `rules-reminder` prompt hook for defect-like user messages. Reason: a user saying something still does not work is the case with no other checkpoint, and a prompt-time reminder is the only client-independent way to catch it. Default `warn`, configurable `off`, silent when the project has no `.light-kit/rules.md`.
- Add a `rules` step before `conclude` in every workflow. Reason: recording becomes a visible checkpoint that does not depend on the reviewer finding anything.
- Keep the "new repeatable error" guard and the requirement that a rule be specific. Reason: not every one-off defect deserves a rule.

### Constraints and preferences
- A review is one trigger, not the only one.
- Record the rule in the same request or exchange as the failure, with the user report and the earlier request as evidence.
- Never delete, demote or rewrite a `confirmed` rule.

### Still open
- None. The trigger list and the hook scope are recorded above with their reasons.
