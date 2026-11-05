---
step: implement
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 5,761 input · 1,614,208 cache read · 0 cache write · 9,558 output · 1,629,527 total
  time: 6m 7s
---

# Implementation

## What changed
- `kit/hooks/lib/specs.mjs`: exports `currentRequest(active)` — a request at step `implement`, `fix` or `review` first, then the folder modified last. Moved out of `capture-discussion` so the two hooks share one rule.
- `kit/hooks/checks/capture-discussion.mjs`: uses the shared helper instead of its own copy.
- `kit/hooks/checks/tool-log.mjs`: writes `specs/<NNN-slug>/tool-log.md` in the active request folder (`currentRequest(activeRequests(ctx.scope, ctx.root))`). No active request means no file and no created folder; a write of that file is still skipped.
- `tests/hooks.test.mjs`: the two `tool-log` tests now assert the request path, nothing at the `specs/` root, the working-step preference over a newer non-working request, the exclusion of a finished request, redaction, `off`, and the self-write skip.
- Docs: `kit/hooks/README.md`, `docs/safety-hooks.md`, `specs/README.md` name the request folder and the selection rule.

## Verification
- `node --test tests/hooks.test.mjs`: 54 passed.
- `npm test`: 158 passed.
- End-to-end on a generated install with `specs/001-demo` active: the row landed in `specs/001-demo/tool-log.md` and no `specs/tool-log.md` was created.

## Deviations
None.

## Technical debt
- None introduced. The step preference and newest-folder tie-break are now documented once, in the shared helper and the hooks README.
