---
step: plan
runs:
  - agent: light-tech-lead
    part: task list and verification strategy
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
  time: 0s
---

# Plan

- [ ] 1. Exempt the kit's own detector source from `sensitiveFiles` — level: easy — files: `.light-kit/hooks.config.json` — verify: the hook allows a read of `kit/hooks/lib/secrets.mjs` — commit: `fix(hooks): let the kit read its own secret detector`
- [ ] 2. Narrow the long-random-token rule so ids and paths no longer match — level: easy — files: `kit/hooks/lib/secrets.mjs` — verify: a prompt with a session path passes, real fixtures still blocked — commit: `fix(hooks): stop treating session ids and paths as secrets`
- [ ] 3. Cover ids, UUIDs and session paths in the hooks tests — level: easy — files: `tests/hooks.test.mjs` — verify: `node --test tests/hooks.test.mjs` — commit: `test(hooks): cover session ids and paths`
- [ ] 4. Describe the scoped rule and run the full suite — level: easy — files: `kit/hooks/README.md`, `specs/031-session-id-secret-false-positive/50-implementation.md` — verify: `npm test` — commit: `docs(hooks): scope the random-token rule`

Each task = one verified, coherent commit.

## Risks
- A too-loose rule could let a real token through: the existing fixtures must keep failing.
- The exemption is a project config: other projects keep `secrets.*` protected.

## Test strategy
- Focused hooks tests: UUID, bare id and a session path pass in prompt, write and output; the current
  secret fixtures stay blocked. Then `npm test`.

## Parallelisable tasks
None.
