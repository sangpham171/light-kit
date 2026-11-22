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
  time: 1s
---

# Understanding

## Restatement
The sensitive-file check blocks reads, writes and shell access to file names that look secret (`.env`, `credentials`, `secrets.*`, keys). Files inside the folders the kit and the clients own — `.claude`, `.copilot`, `.light-kit`, `specs` — are configuration, instructions and request records, never user secrets. They must be exempt, while the rest of the repository keeps the current protection.

## Prior requests
- `specs/031-session-id-secret-false-positive` — established the pattern: an exemption that is generally valid belongs in the built-in list, with the project file only for what is specific to the project.
- `specs/040-init-updates-existing-kit` — this repository's own `.light-kit/hooks.config.json` is layered on top of the installed defaults.

## Assumptions
- A file named like a secret inside these folders is still not a secret: the folders are generated or kit-managed and are not where user credentials are kept.
- Secret *content* detection is a separate hook and stays unchanged; only the file-name check gets the exemption.

## Open questions (with proposed defaults)
None.

## Requirements
1. `BUILTIN.sensitiveAllow` in `kit/hooks/lib/config.mjs` exempts `**/.claude/**`, `**/.copilot/**`, `**/.light-kit/**` and `**/specs/**`.
2. The repository's `.light-kit/hooks.config.json` carries the same four entries so the already-installed hooks apply them at once.
3. The check keeps blocking a secret-looking file name at the project root and in ordinary source folders.
4. Tests cover both directions; the hook README states the built-in exemptions.

## Acceptance criteria
- A pre-tool read of `credentials` at the project root exits 2; reads of `.claude/credentials`, `.copilot/secrets.json`, `.light-kit/credentials` and `specs/001-x/credentials` exit 0.
- `npm test` passes.

## In scope / Out of scope
- In: the built-in allow list, this repository's hook config, one test, the hook docs.
- Out: changes to secret-content detection, other check lists, the install refresh of `~/.light-kit`.

## Triage
Scores: scope 1, ambiguity 1, risk 1, novelty 1, impact 2 (total 6)
Workflow: direct
Why: one built-in list, one config layer, a test and a doc line.

## Routing
- understand: easy — the lists already exist.
- plan: easy — two data edits, a test, docs.
- implement: easy — no control flow changes.
- review: easy — check the globs match only those folders.

## Agent plan
- request: light-orchestrator — capture the request.
- understand: light-orchestrator — restate and triage.
- plan: light-orchestrator — direct workflow.
- implement: light-orchestrator — lists, config, test, docs.
- verify: `node --test tests/hooks.test.mjs` then `npm test`.
- conclude: light-orchestrator — report the exemption and the refresh follow-up.
