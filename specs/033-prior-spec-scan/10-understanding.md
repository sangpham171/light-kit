---
step: understand
runs:
  - agent: light-orchestrator
    part: restatement, requirements and triage
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 1s
---

# Understanding

## Restatement
Before writing `10-understanding.md` or `20-discovery.md`, an agent should look for earlier requests that cover the same, similar or related work. To keep the token cost low, it guesses relevance from folder names in `specs/` and opens a candidate folder from the end backwards: `60-conclusion.md` first, `50-implementation.md` only when implementation detail is needed, then `20-discovery.md`. It reads only the files a question sends it to. Whatever it takes from earlier specs is then verified against the current codebase.

Note: the request says `30-discovery`; the artifact is `20-discovery.md`. Treated as a typo.

## Assumptions
- The guidance belongs in the kit's canonical files under `kit/`, so every generated client gets it.
- "30-discovery" means `20-discovery.md`.
- Recording the checked requests in the artifact is useful; one short section in each template is enough.

## Open questions (with proposed defaults)
None.

## Requirements
1. The `light-discovery` skill tells the discovery agent to scan `specs/` for related requests by folder name before exploring the code.
2. It gives the reverse reading order: `60-conclusion.md`, then `50-implementation.md` only when needed, then `20-discovery.md`; other artifacts are skipped unless a specific question needs them.
3. The orchestrator that writes `10-understanding.md` and the business analyst that adds requirements get the same instruction.
4. The `10-understanding.md` and `20-discovery.md` templates each gain a `Prior requests` section recording what was checked and reused or contradicted.
5. The guidance treats earlier specs as leads, not facts: claims taken from them are verified against the current code before use.
6. A kit test asserts the guidance is present in the generated client files and templates.

## Acceptance criteria
- Given a fresh install, when a client reads `light-discovery`, then it names the folder-name scan, the `60 → 50 → 20` order and the verification step.
- Given a fresh install, when a client reads the orchestrator or business-analyst agent, then it names the same scan.
- Given a fresh install, when a client reads the templates, then both have a `Prior requests` section.
- Given the change, when `npm test` runs, then it passes.

## In scope / Out of scope
- In scope: `kit/skills/light-discovery`, `kit/agents/light-orchestrator.md`, `kit/agents/light-business-analyst.md`, `kit/templates/10-understanding.md`, `kit/templates/20-discovery.md`, `tests/kit.test.mjs`.
- Out of scope: changing the workflow step order or adding a new skill; rewriting old specs.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 0, impact 0 (total 1)
Workflow: direct
Why: A clear, internal documentation change touching one component, with no behaviour or data impact.

## Routing
- understand: easy — restates a clear request.
- plan: easy — a short list of documentation edits.
- implement: easy — edits text and one test.
- review: easy — checks wording and tests.
- conclude: easy — short summary.
