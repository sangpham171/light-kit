---
step: discover
runs:
  - agent: light-tech-lead
    part: discovery
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 1,747 input · 47,616 cache read · 0 cache write · 2,455 output · 51,818 total
  time: 6s
---

# Discovery

## Prior requests
See `10-understanding.md`. `024-skill-commands` fixes the rule that commands are skills; `025-conversation-capture` fixes where discussion output goes. No brainstorming capability exists.

## Relevant code
- `tools/build.mjs:37-68` — `loadKit` reads every folder under `kit/skills/` and uses `SKILL.md`; `lint` requires `name`, `description` and a `purpose` of `compensation`, `preference`, `enforcement` or `structure`.
- `tools/build.mjs:119-150` — skills are generated per client: `.claude/skills/<name>/SKILL.md`, `.github/skills/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md`, `.cursor/rules/<name>.mdc`. No registration list exists, so a new folder is enough.
- `tests/kit.test.mjs:31-43` — every key command must exist as a skill for every client and skill bodies must not contain `$ARGUMENTS`.
- `tests/kit.test.mjs` — install-based tests read generated files, which is the pattern to follow.
- `kit/instructions/core.md` — `## Commands` lists the user-facing commands.
- `README.md` — `## Commands` table.
- `docs/usage.md` — `## Names` paragraph lists the command skills.
- `kit/skills/light-request/SKILL.md` — entry point for a new request; the natural place to point to brainstorming when the idea is vague.
- `kit/skills/light-conversation-capture/SKILL.md` — output pattern for capturing a discussion into `00-request.md`.

## Conventions
- Skill frontmatter: `name`, `description`, `purpose`; imperative body, short sections.
- Client-neutral wording; the build adds client-specific notes itself.
- Two-space indentation in JavaScript; tests use `node:test` and `node:assert/strict`.

## Constraints
- No dependencies.
- `npm test` runs the kit lint and must stay clean.
- A skill appears in every client without extra tooling.

## Reuse candidates
- Existing skill file layout and description style.
- `light-conversation-capture`'s rule that a `00-request.md` section carries discussion output.
- The request template's `Still open` convention (open question plus proposed default).

## Unknowns / risks
- None blocking. The main risk is a vague skill that lists topics without forcing divergence; the body must give a concrete output contract and an explicit no-implementation rule.
