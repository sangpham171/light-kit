---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding, triage and agent plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 480 input · 300,928 cache read · 0 cache write · 1,986 output · 303,394 total
  time: 8s
---

# Understanding

## Restatement
`rules-reminder` matches only English words, so a Vietnamese (or any non-English) defect report does not trigger the reminder. Add built-in Vietnamese patterns and a configurable `rules.extraDefectPatterns` list for any other language; document that the built-in set is not exhaustive and that the `light-rules` instructions still apply in every language.

## Prior requests
- `043-rule-triggers` created the hook, its English `DEFECT` list and its tests.
- `042-agent-skill-usage` established the tolerant config and hook-test patterns.
- `037-project-rules` established the skill and the rules file.
No prior request covers language-specific heuristics.

## Assumptions
- The hook is advisory; an extra match costs one line, while a miss hides the reminder.
- A project can tune its config without changing the kit.
- The user's own language is Vietnamese, so a starter set is worth shipping.

## Requirements
1. Add built-in Vietnamese defect patterns to `rules-reminder`.
2. Add `rules.extraDefectPatterns` to the config loader, the kit config seed and the project config template.
3. Compile extra patterns with `regexes`, so an invalid regex is dropped and never throws.
4. Document the English/Vietnamese default, the config key and an example for another language.
5. Keep a plain Vietnamese feature request ("thêm nút xuất") silent.
6. Add a pending rule for English-only user-input heuristics.

## Acceptance criteria
- "xuất dữ liệu vẫn không hoạt động" warns without extra config.
- "thêm nút xuất" stays silent.
- A Spanish prompt stays silent without config, and warns after `rules.extraDefectPatterns: ["no funciona"]`.
- An invalid extra regex does not throw and does not block the hook.
- `npm test` passes.

## In scope / Out of scope
- In: the hook patterns, config key and templates, docs, tests, the project rule.
- Out: a built-in set for every language, model-based classification, a per-language setting in the project profile.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 1, impact 1 (total 3)
Workflow: standard
Why: one hook and its config, a clear outcome; standard keeps the plan and review for a change to user-facing agent behaviour.

## Routing
- understand: easy — a precise follow-up.
- discover: easy — the hook, config and tests were read in request 043.
- plan: easy — known files.
- implement: easy — patterns, config key, docs and tests.
- verify-and-review: medium — false positives in two languages, invalid regex handling.
- conclude: easy — summarize.

## Agent plan
- understand: light-orchestrator — baseline.
- discover: light-orchestrator — inline; skip `light-tech-lead` and `20-discovery.md` (reason: the sources were read in 043).
- plan: light-orchestrator — compact plan.
- implement: light-orchestrator — edits in the main session.
- verify-and-review: light-reviewer — independent read of the diff.
- fix: light-orchestrator — apply review findings.
- conclude: light-orchestrator — final summary.
