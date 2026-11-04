---
step: implement
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 1,520 input · 466,816 cache read · 0 cache write · 1,876 output · 470,212 total
  time: 1m 53s
---

# Implementation

## What changed
- `tools/build.mjs`: generated Copilot hook entries now carry `bash` with the same text as `command`, so Copilot CLI uses the explicit Unix command field and keeps `command` as the Windows fallback.
- `tests/hooks.test.mjs`: new test asserts every generated Copilot hook entry has `type: "command"` and `bash === command`.

## Verification
- `node --test tests/hooks.test.mjs`: 52 passed.
- `npm test`: 156 passed.
- Manual check: `hookRegistration('copilot')` yields `{ type: 'command', command: 'node .light-kit/hooks/run.mjs --client copilot --event pre-tool', bash: '…', timeoutSec: 60 }`.

## Deviations
None.

## Technical debt
None introduced.
