---
step: implement
runs:
  - agent: light-developer
    model: unknown
    thinking: high
    level: easy
usage:
  tokens: 192,432 input · 0 cache read · 0 cache write · 825 output · 193,257 total
  time: 29s
---

# Implementation

## What changed
| File | Change |
|---|---|
| `docs/usage.md` | The best-effort paragraph now explains that a `0` cache read is the client's own record, and that a BYOK OpenAI-compatible provider can report zero cache reads for a whole session. |

## Decisions
- No code change: `usageFromCopilotEvents` reads `cacheReadTokens` and `cacheWriteTokens` from each
  `session.usage_record`, and the same reader returns millions of cache reads for the Copilot-hosted
  `gpt-6-luna` session on this machine. The zeros are in the DeepSeek records themselves.
- No heuristic to print `unknown` instead of `0`: `cacheDetailsReported` is `true` on the DeepSeek
  records, so nothing local distinguishes "cached, not reported" from "not cached".

## Verification
- `npm test`: 142 pass, 0 fail.
- `usageFromCopilot('6060dcba…')` against this session returns `817,604 input · 0 cache read · 0 cache
  write · 7,719 output · 825,323 total`, equal to the sum of its `session.usage_record` events.
