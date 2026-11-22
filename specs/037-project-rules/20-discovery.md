---
step: discover
runs:
  - agent: light-tech-lead
    part: codebase discovery
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Discovery

## Prior requests
Checked `034`–`036` (brainstorming) and `029` (artifact attribution); no earlier rules work. The current source was verified: no template, no skill body, no core rule and no audit entry.

## Findings

### Where the kit keeps the behaviour
- `kit/instructions/core.md` — always-loaded rules 1–14; section `## Project knowledge` lists `.light-kit/*` files; no rules file yet. `tools/build.mjs` `instructionBlock()` appends the generated `## Kit files` line.
- `kit/audit/rules.json` — a purpose for every `##` section and every numbered rule. `tools/build.mjs` `lint()` fails when one is missing.
- `kit/templates/` — every file is installed as a seed (`build.mjs` marks templates `seed: true`; `install.mjs` never overwrites a seed that exists).
- `kit/skills/light-init/SKILL.md` — seeds `project-profile.md` and `hooks.config.json`; needs the rules file in both the project and workspace branches.
- `kit/skills/light-implement/SKILL.md` — per-task execution; the natural before/after checkpoint.
- `kit/agents/light-orchestrator.md` — first task of a request and the final step; the natural request-level checkpoint.
- `kit/skills/light-review-checklist/SKILL.md` — reviewer checks; reports a violated rule as a finding.

### The empty skill folder
`kit/skills/light-rules/` exists but has no `SKILL.md`. `kit/audit/audit.mjs` `fromSource()` lists skill directories and reads each `SKILL.md`, so the audit (and `tests/audit.test.mjs`) currently fails with `ENOENT`. Adding the skill fixes the baseline failure.

### Tests and conventions
- `tests/audit.test.mjs` hardcodes `count(rep, 'rule') === 14` in two places; rule 15 requires updating both to 15 (or deriving from the core text).
- `tests/kit.test.mjs` follows the pattern "install into a temp dir, read the generated files, assert wiring"; a new test belongs there.
- The suite is `npm test` (Node test runner, 177 tests).

### Constraints
- No dependencies; two-space indentation; Conventional Commits.
- Generated files must not be edited by hand; sources are `kit/` and `tools/`.
- `Usage`/`model` values in artifact headers stay `unknown` when the session does not report them.

## Risks
- Wording drift between the template, the skill and core rule 15: keep the counting and promotion semantics in one shape.
- Adding a 15th rule without its audit purpose makes `lint()` fail; adding the skill without a `purpose` does the same.
- The generated client files still contain the old core block until the next install; tests must assert the build output, not `~/.claude`.
