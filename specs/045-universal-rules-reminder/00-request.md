---
step: request
runs:
  - agent: light-orchestrator
    part: request capture
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 2,061 input · 1,086,464 cache read · 0 cache write · 9,357 output · 1,097,882 total
  time: 3m 35s
---

# Request 045 — A universal rules reminder

Date: 2026-11-22
Requested by: the user

## Original request
> no, i don' want DEFECT or VIETNAMESE or any others patterns, it must be something generic and universal

## Conversation context
Follow-up to requests 043 and 044. 043 added an English `DEFECT` regex; 044 added a Vietnamese list and `rules.extraDefectPatterns`. The user rejects every word list: any language-specific pattern is incomplete and will miss other languages.

### Decisions
- Remove `DEFECT`, `VIETNAMESE` and `extraDefectPatterns` entirely. Reason: no finite word list is universal, and a pattern the user must extend is the same trap in another form.
- Make `rules-reminder` a **session-start** reminder with no text matching. It states the rule-recording triggers for the session, in a form the agent understands in any language. Reason: a static instruction is language-neutral and needs no detection; the agent reads the actual user message and judges it.
- Keep the enforcement in the workflow: every workflow has a `rules` step before `conclude`, and `light-rules` names the triggers. Reason: the reminder can only nudge; the checkpoint is what guarantees recording.
- Record the repeated failure in R-003: language-specific detection happened twice (043, 044); the lesson is to use a language-neutral mechanism or let the agent judge.

### Constraints and preferences
- No pattern list, no language list, no per-language configuration.
- The hook stays advisory (`warn`) and silent without `.light-kit/rules.md`.
- The agent, not the hook, decides whether the user's message reports a defect.

### Still open
- None. The hook no longer tries to classify text; that limit is documented.
