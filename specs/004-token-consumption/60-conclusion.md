---
runs:
  - step: conclude
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Conclusion

## Summary
Every request artifact now carries a `## Token usage` section for its step, and `60-conclusion.md` carries one row per step plus the overall total. For Claude Code, a new `token-usage` hook reads the session transcript after an artifact is written and reports the numbers; other clients keep `unknown`.

## What changed
Range: `5535dc4ea735be828bfea70ee228f11ca2bee3ec..HEAD` on `feat/004-token-consumption`
- `kit/hooks/lib/usage.mjs` — fail-soft transcript reader (input incl. cache, output, cache split) and delta helper.
- `kit/hooks/checks/token-usage.mjs` — post-write check: per-session baseline in `.light-kit/usage.json`, per-request and per-step totals, a message with the numbers and the conclusion rows.
- `kit/hooks/checks/index.mjs`, `kit/hooks/lib/config.mjs`, `kit/hooks/hooks.config.json` — registered, `warn` by default.
- Seven artifact templates, `kit/instructions/core.md` — the section, the table, and rule 12.
- `kit/hooks/README.md`, `docs/usage.md`, `docs/safety-hooks.md`, `kit/skills/light-hooks-config/SKILL.md` — coverage and limits.
- `tests/usage.test.mjs`, `tests/hooks.test.mjs`, `tests/kit.test.mjs` — reader, integration, filled-section and template tests.
- Commits: `2fe2063`, `23b81bc`, `e41cbcf`, `e0775b6`.

## Verification evidence
- `npm test`: 106 tests, 106 pass (6 new).
- Reader tests cover summation including cache tokens, malformed and missing transcripts, and delta clamping.
- Integration tests install the kit in a temp project, write a spec artifact with a transcript, assert the reported delta and the state totals, and assert silence once the section is filled, for other clients, and for non-artifact files.
- The conclusion test checks that a table row with step ids but `unknown` cells is still reported as open.

## Token usage
| Step | Input | Output | Total |
|---|---|---|---|
| request | unknown | unknown | unknown |
| understand | unknown | unknown | unknown |
| discover | unknown | unknown | unknown |
| plan | unknown | unknown | unknown |
| implement | unknown | unknown | unknown |
| verify-and-review | unknown | unknown | unknown |
| conclude | unknown | unknown | unknown |
| **Total** | 10179925 | 166261 | 10346186 |

The total is the session transcript at the time this file was written (input includes 9,944,320 cached prompt tokens). Per-step values are `unknown` because the kit is not installed in this repository, so the new hook did not run while these artifacts were written; the next requests in an installed project will fill them.

## Deferred technical debt and open findings
- TD-1: only Claude Code exposes a readable usage source; Copilot, Cursor and Codex stay `unknown`. Deferred.
- TD-2: usage in a separate subagent transcript is not counted. Deferred; verify on a session that fans out.
- TD-3: the final edit that fills a section is counted in the totals but not in the recorded value. Deferred.
- TD-4: `.light-kit/usage.json` keeps one entry per session indefinitely. Deferred.
- TD-5: artifacts written in one assistant message attribute all tokens to the first. Deferred.

## Follow-ups
- Reinstall the kit (`node tools/install.mjs --level user`, or the project install) so the new hook, templates and rule reach the clients.
- On the first installed request, confirm the hook's message and the filled sections read well; add the cached share to the display if users ask for it.
