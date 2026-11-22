---
step: understanding
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 2s
---

# Understanding

## Restatement
Every agent or skill use must update `.light-kit/agent-skill-usage.json`/`.md` when it happens. The hook covers calls the client reports; an installed script plus an always-loaded instruction covers the rest, so no use depends on rebuilding history from session records.

## Prior requests
- `specs/042-agent-skill-usage` — the hook, count rules and files.
- `specs/048-usage-history` — backfilled the calls the hook never saw; this request removes the need to backfill inline uses going forward.

## Assumptions
- The client reports agent and skill calls to the hook; therefore the script is for uses without such a call, not a replacement for the hook.
- A skill read from its installed `SKILL.md` and followed is a skill use; reading the kit's source while editing it is not, and the instruction keeps the agent responsible for that judgment.

## Open questions (with proposed defaults)
- None.

## Requirements
1. `kit/hooks/record-usage.mjs` is installed as `.light-kit/hooks/record-usage.mjs` and records one use: `agent|skill <name>`, attributed to the working request, or `--request <slug>`, else `(no request)`.
2. It writes the same JSON and regenerates the same Markdown table as the hook, and reports what it added in one line.
3. An optional `--id <call-id>` skips a call the hook already counted.
4. The always-loaded instructions tell the agent when and how to call it.
5. Tests and docs cover the script and the instruction.

## Acceptance criteria
- Running `node .light-kit/hooks/record-usage.mjs skill light-rules` in a request increments `skills.light-rules` for that request and updates the table.
- An unknown kind, a missing name or a project without `.light-kit` exits non-zero with a plain message and changes nothing.
- `npm test` passes.

## In scope / Out of scope
- In: the script, its tests, the core instruction, the hook README and the user docs.
- Out: changing the hook's detection, counting non-skill file reads automatically, other clients' skill invocation models.

## Triage
Scores: scope 2, ambiguity 1, risk 1, novelty 1, impact 2 (total 7)
Workflow: direct
Why: one small script over existing libraries plus an instruction line; verified by a focused test.

## Routing
- understand: easy — the gap is the inline use.
- plan: easy — script, instruction, test, docs.
- implement: medium — request resolution and two writers must agree.
- review: easy — self-review against the checklist.

## Agent plan
- request: light-orchestrator — capture the request.
- understand: light-orchestrator — restate and triage.
- plan: light-orchestrator — direct workflow.
- implement: light-orchestrator — script, core line, docs, tests.
- verify: `node --test tests/record-usage.test.mjs` then `npm test`.
- conclude: light-orchestrator — report the command and when to use it.
