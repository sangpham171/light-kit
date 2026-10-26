---
runs:
  - step: understand
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Understanding

## Restatement
The README is the entry point and should stay short: what light-kit is, how to get started, and the commands. Reference and background material moves to separate files under `docs/`, linked from the README.

## Assumptions
- The `README.md` is the repository's README (the kit source), not a generated project README.
- Markdown only: no code, workflow or installer behavior changes.
- Existing reference files (`kit/hooks/README.md`) stay where they are.
- Plain, functional language, same as the rest of the kit.

## Open questions (with proposed defaults)
None blocking.

## Requirements
1. `README.md` covers: what light-kit is, requirements, install, first steps, a command table and a documentation index.
2. Everything else currently in the README moves to `docs/*.md`, without losing facts.
3. No content is duplicated between the README and the new files.

## Acceptance criteria
- README reads in under two minutes and links to every new document.
- Every section removed from the README exists in exactly one `docs/` file.
- Install commands and flags mentioned are the ones `tools/install.mjs` accepts.
- `npm test` passes.

## In scope / Out of scope
In: `README.md`, new `docs/*.md`.
Out: installer, build, workflows, agents, hooks.

## Triage
Scores: scope 2, ambiguity 0, risk 0, novelty 0, impact 1 (total 3)
Workflow: direct
Why: documentation-only change; no behavior, no unclear decisions.

## Routing
- understand: easy — summarise a clear docs request.
- implement: easy — move and rewrite prose.
- review: easy — check links and lost facts.
- conclude: easy — short summary.
