---
step: understand
runs:
  - agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: medium
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 5s
---

# Understanding

## Restatement
A request that comes out of plan mode or a discussion is the whole exchange. The kit must keep that exchange in `00-request.md`, always write the plan to `40-plan.md`, and always log the work in `50-implementation.md`, instead of recording only the final "implement" message and skipping the plan.

## Assumptions
- The agent still has the session in context when the user says "implement"; the gap is that it writes only the last message.
- An automatic nudge at prompt time is the right place to catch the "implement" instruction, since instructions alone were missed.

## Open questions (with proposed defaults)
- New artifact for the transcript? Default: no, extend `00-request.md` (matches the user's words, no extra workflow file).
- Warn or block on a missing plan? Default: warn, like `require-spec`; blocking would stop legitimate direct work.

## Requirements
1. `00-request.md` records the conversation: every user turn (verbatim or faithfully condensed), what each established, decisions with why and rejected options, constraints, references, and what is still open.
2. Before changing code, the agent writes `00-request.md`, `10-understanding.md` and `40-plan.md`, then logs work in `50-implementation.md`. Never implement straight from the chat.
3. Every workflow writes `40-plan.md`, including `direct` (compact plan).
4. A prompt hook warns when an implement instruction arrives without an active request or without a plan.
5. Skills, agents, templates, the hook, docs and tests carry the rule.

## Acceptance criteria
- An installed project's instructions contain the conversation rule; the `light-conversation-capture` skill exists in every client's skill folder.
- `00-request.md` template has a `## Conversation context` section.
- `direct` workflow writes `40-plan.md` before implementing.
- The hook warns on "implement it" with no request, warns when the active request has no `40-plan.md`, and is silent when the plan exists.
- `npm test` passes, including the new kit and hook tests.

## In scope / Out of scope
In: kit instructions, templates, skills, agents, workflows, one hook, docs, tests.
Out: client-specific transcript readers, a new artifact file, changing the client plan-mode behavior itself.

## Triage
Scores: scope 2, ambiguity 1, risk 0, novelty 1, impact 0 (total 4)
Workflow: standard
Why: several kit components change together; the pattern exists and the outcome is testable.

## Routing
- understand: easy — the request is clear.
- discover: easy — read the kit structure and tests.
- plan: medium — order the coupled changes.
- implement: medium — instructions, a hook and tests.
- verify-and-review: medium — hook payload shapes vary by client.
- fix: easy — small corrections expected.
- conclude: easy — short summary.
