---
step: plan
runs:
  - agent: light-tech-lead
    part: implementation plan
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
usage:
  tokens: 230 input · 140,544 cache read · 0 cache write · 1,398 output · 142,172 total
  time: 3s
---

# Plan

- [ ] 1. Add `kit/hooks/record-usage.mjs`: resolve the project root and working request, record one agent or skill use through `usage-stats.mjs`, write both files, print one line — level: medium — files: `kit/hooks/record-usage.mjs` — verify: run it by hand in a temp project; JSON and MD gain one use — commit: `feat(hooks): add the usage record command`
- [ ] 2. Add the always-loaded instruction to call it when the hook cannot see a use — level: easy — files: `kit/instructions/core.md` — verify: `grep -n "record-usage" kit/instructions/core.md` — commit: `docs(kit): instruct agents to record the uses the hook cannot see`
- [ ] 3. Test the script: agent and skill kinds, request attribution, `--request`, `--id` dedupe, unknown kind, no `.light-kit` — level: easy — files: `tests/record-usage.test.mjs` — verify: `node --test tests/record-usage.test.mjs` — commit: `test(hooks): cover the usage record command`
- [ ] 4. Document the command and the once-per-use rule in the hook docs — level: easy — files: `kit/hooks/README.md`, `docs/safety-hooks.md` — verify: `npm test` — commit: `docs(kit): document the usage record command`
- [ ] 5. Conclude the request and commit the state files — level: easy — files: `specs/049-usage-record-script/*` — verify: `npm test` — commit: `docs(spec): conclude request 049`

Each task = one verified, coherent commit.

## Risks
- The script and the hook must write the same file shape; reuse `readStats`/`recordCall`/`renderTable` instead of duplicating.
- The instruction must not make a delegated call count twice: it applies only when the client made no agent or skill tool call.
- Request resolution must match the hook's: the same working-request rule.

## Test strategy
- Focused `node --test tests/record-usage.test.mjs` in temp projects with and without a request folder.
- `npm test` for the installed output and the always-loaded text.

## Parallelisable tasks
- Tasks 1 and 2 touch different files; 3 depends on 1; 4 depends on 1 and 2. Run in order.
