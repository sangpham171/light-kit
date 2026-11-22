---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding, triage and agent plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Understanding

## Restatement
Remove every word list from `rules-reminder`. Replace the prompt-time text heuristic with a generic, language-neutral reminder emitted at session start: the agent is told the rule-recording triggers once, then judges the user's actual message in any language. The workflow `rules` step remains the enforcement point.

## Prior requests
- `043-rule-triggers` created the hook with the English `DEFECT` list.
- `044-multilingual-rules-reminder` added Vietnamese and `rules.extraDefectPatterns`.
- Both approaches were rejected by the user as incomplete by construction. No prior request uses a non-text signal for this reminder.

## Assumptions
- There is no reliable, language-neutral way to classify a prompt as a defect report from its text alone. A static instruction plus the agent's understanding is the general solution.
- A session-start reminder is low-noise and reaches the agent before any report in the session.
- The `rules` workflow step and core rule 15 already require recording; the hook is a nudge, not the guarantee.

## Requirements
1. Delete `DEFECT`, `VIETNAMESE` and the `extraDefectPatterns` config key.
2. `rules-reminder` runs on `session-start`, with no text matching, when `.light-kit/rules.md` exists.
3. Its message names the triggers generically: a user-reported bug or regression, a failed check, a review/tester/security finding, and a correction.
4. Remove the config key from the kit seed, the project template, the config loader and the hooks-config skill.
5. Update docs and tests to the session-start behaviour.
6. Update R-003 to the repeated failure and the language-neutral lesson.

## Acceptance criteria
- A session-start event in a project with `.light-kit/rules.md` emits a message naming `light-rules`.
- The same event without a rules file emits nothing.
- `hooks: {"rules-reminder": "off"}` emits nothing.
- A prompt event emits nothing (the hook no longer reads prompts).
- `extraDefectPatterns` appears nowhere in the kit, templates or docs.
- `npm test` passes.

## In scope / Out of scope
- In: the hook rewrite, config removal, skill row removal, docs, tests, R-003.
- Out: detecting defects from text, any language list, model calls from hooks, a new state file.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 1, impact 1 (total 3)
Workflow: standard
Why: one hook and its config surface; the direction is explicit, and the change removes code rather than adding it.

## Routing
- understand: easy — a precise correction.
- discover: easy — the hook, config and tests are known.
- plan: easy — removal and one event change.
- implement: easy — smaller than the code it replaces.
- verify-and-review: medium — removal must leave no orphan config or docs.
- conclude: easy — summarize.

## Agent plan
- understand: light-orchestrator — baseline.
- discover: light-orchestrator — inline; skip `light-tech-lead` and `20-discovery.md` (reason: the files were read in 043/044).
- plan: light-orchestrator — compact plan.
- implement: light-orchestrator — edits in the main session.
- verify-and-review: light-reviewer — independent read of the removal.
- fix: light-orchestrator — apply review findings.
- conclude: light-orchestrator — final summary.
