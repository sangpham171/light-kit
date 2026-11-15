---
step: understand
runs:
  - agent: light-orchestrator
    part: restatement, requirements, decision and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 1s
---

# Understanding

## Restatement
Add a reusable capability that takes an idea from the user and explores it in several independent directions, including cases and consequences the user did not mention, before any request is planned or implemented. The user leaves open whether this should be an agent or a skill.

## Prior requests
Scanned `specs/` by folder name; the nearest matches are:
- `024-skill-commands`: settled that every command is a skill, so no client needs a prompt file. This request follows the same rule.
- `025-conversation-capture`: captures a discussion into `00-request.md`. Brainstorming output is conversation context, so it should be written there rather than in a new artifact.
- `033-prior-spec-scan`: guidance on reading earlier requests before understanding and discovery; applied above.

No earlier request adds a divergent-thinking or brainstorming capability. Verified against the current `kit/skills/`, `kit/agents/` and `kit/instructions/core.md`.

## Decision: skill, not agent
Chosen: a skill, `light-brainstorm`.

- Brainstorming needs a live exchange with the user; a subagent cannot talk to the user and returns only a report.
- Skills install for every supported client; agents are subagent-only, and Copilot and Cursor have no parallel subagents in this kit.
- The kit's commands are already skills (`024-skill-commands`), so the capability is invoked the same way as the rest.
- An agent would add a workflow role and a file-writing artifact that the current flow does not need.

Rejected: a `light-brainstormer` agent (interaction and portability limits above). A skill may still use subagents for independent directions when the client supports them.

## Assumptions
- The capability belongs in `kit/skills/`, so generated client files receive it automatically.
- Brainstorming is pre-planning work; it never edits code or replaces `20-discovery.md`, `30-design.md` or `40-plan.md`.
- With an existing request folder, the output belongs in `00-request.md` as a `## Brainstorm` section; without one, the map is returned in the reply and the user is offered `light-request`.

## Open questions (with proposed defaults)
None. The only ambiguity (agent or skill) is decided above with a recorded reason.

## Requirements
1. Add `kit/skills/light-brainstorm/SKILL.md`, available through the existing skill generation for every client.
2. The skill first frames the idea as a problem (job, users, success, constraints, hidden assumptions) instead of accepting the proposed solution as given.
3. It explores the idea along explicit, non-overlapping directions: stakeholders, journey and lifecycle, alternatives, option space, scale and cost extremes, failure and misuse, second-order effects, and similar existing work.
4. It hunts deliberately for unmentioned cases using inversion/pre-mortem, assumption inventory, constraint removal and addition, and analogy.
5. It separates divergence from convergence: generate without judging first, then cluster, compare trade-offs and rank by impact and uncertainty.
6. It ends with a structured idea map: framing, directions and options with trade-offs, cases the user did not mention, assumptions and how to verify them, decision-changing open questions with proposed defaults, and a recommended next step.
7. It asks only questions that change the decision, batched in one message, each with a default; it never implements.
8. With an active request folder it appends `## Brainstorm` to `00-request.md`; otherwise it presents the map and offers `light-request`.
9. List the skill in the command documentation (`kit/instructions/core.md`, `README.md`, `docs/usage.md`) and point to it from `light-request` for vague ideas.
10. Cover the generated skill and the wiring with tests.

## Acceptance criteria
- `npm test` passes.
- Every client build includes `light-brainstorm`.
- The generated skill contains the framing step, the directions, divergence before convergence, the idea-map sections and the no-implementation rule.
- `CLAUDE.md`, `README.md` and `docs/usage.md` list the command, and generated `light-request` mentions `light-brainstorm`.

## In scope / Out of scope
In scope: the skill, its documentation entries, the pointer from `light-request`, tests.

Out of scope: a new agent, a new workflow step, a new request artifact file, automatic brainstorming on every ambiguous request.

## Triage
Scores: scope 1, ambiguity 1, risk 0, novelty 2, impact 1 (total 5)
Workflow: standard
Why: one new kit component with some open design choices and no user-visible risk; a new capability, so it is not `direct`.

## Routing
- understand: easy — the request is one message; the decision is already recorded.
- discover: easy — inspect the skill/agent generation and documentation lists.
- plan: medium — the exploration method and its output contract need design.
- implement: medium — one new skill plus documentation and tests.
- verify-and-review: medium — check the generated files for all clients and the wording of the method.
- fix: easy — expected to be wording or lint fixes.
- conclude: easy — short summary.
