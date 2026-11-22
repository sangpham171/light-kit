---
step: 10-understanding
runs:
  - agent: light-orchestrator
    part: defect analysis, rules trigger and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 178 input · 124,672 cache read · 0 cache write · 1,280 output · 126,130 total
  time: 6s
---

# Understanding

## What is wrong

The 095 session performed the implementation itself under the light-developer role, signed
`50-implementation.md` with `agent: light-developer`, and never ran `record-usage.mjs` for it. The
hook only sees `Agent`/`Task`/`Skill` tool calls; a role performed inline, or a skill applied by
reading its file, depends on a manual command. Nothing verifies that the agents an artifact credits
exist in `agent-skill-usage.json`, so the omission is silent and repeatable for any agent or skill.

A second defect surfaced in the same session: the light-reviewer `Agent` call was recorded under
`083-component-selector-ui` although its prompt named `specs/095-generated-app-section-layout`; the
session moved the row by hand. `currentRequest` sorts active requests by folder mtime and cannot know
which request a subagent serves, although the call's own prompt usually names it.

## Evidence

| Fact | Source |
|---|---|
| `50-implementation.md` credits `light-developer` | `ai-it-team/specs/095-generated-app-section-layout/50-implementation.md` |
| Usage row has no `light-developer` | `ai-it-team/.light-kit/agent-skill-usage.json` |
| The only agent tool call in the session was light-reviewer | transcript `3637b17b-…jsonl`, `call_00_WdDFLndxFBtP8esusT2v7610` |
| Reviewer prompt names `specs/095-…` | same call input |
| Reviewer row first landed under 083 | session command at 2026-11-22T20:42:56Z |

## Earlier requests checked

- `042-agent-skill-usage` — introduced the hook and manual command; no reconciliation.
- `048-usage-history` — first record must state where history starts (R-006).
- `049-usage-record-script` — the manual command shares `usage-stats.mjs`.
- `051-agent-skill-usage-per-spec` — per-request copies; review fixed the off switch and path equality.
- `052-version-bump-hook` — unrelated, no open debt that this change touches.

No earlier decision rules out deriving counts from artifact headers.

## Rules applied

- R-002 — reconcile must sanitize a malformed row, never throw.
- R-004 — commit the usage state this request writes.
- R-006 — reconciliation only extends requests already tracked or still active, so old history is not invented.
- R-007 — dedupe project homes by real path.
- R-009 — every new assertion gets a fixture that can violate it.
- R-010 — the off switch must disable reconciliation too.
- R-011 (added by this request) — derive recorded state from an existing record instead of relying on a manual step.

`rules: R-011 added pending; no confirmed rule blocks the change.`

## Acceptance

1. A request artifact whose header credits an agent, written without any tool call for that agent, is counted once for that request.
2. A header run already covered by an `Agent` call or a manual record is not counted twice; two header runs for one agent count twice.
3. An agent or skill call whose input names `specs/<slug>` is attributed to that request even when another active request was touched later.
4. Reading an installed `light-*` `SKILL.md` counts as that skill's use; reading the kit source under `kit/skills/` does not.
5. Stop reconciles every tracked or active request in the project(s), and writing nothing when the hook is off.
6. Existing tests pass; `npm test` is clean.

## Agent plan

Standard workflow; no shape change needed.

| Step | Agent | Note |
|---|---|---|
| understand | light-orchestrator | skip brainstorm: precise, familiar defect |
| discover | light-tech-lead | `20-discovery.md`; analysis already done here |
| plan | light-tech-lead | `40-plan.md` |
| implement | light-developer | hook, lib, tests, docs |
| verify-and-review | light-tester, light-reviewer | focused tests then `npm test` |
| fix | light-developer | review findings |
| rules | light-orchestrator | `light-rules` |
| conclude | light-tech-writer | `60-conclusion.md` |

## Triage

Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 1 (total 6)
Workflow: standard
Why: the change touches the hook, a shared lib, the manual command's source, tests and docs, but the
defect and the desired behavior are clear and the change is backward compatible.
