---
step: conclude
runs:
  - agent: light-tech-writer
    model: unknown
    thinking: high
    level: easy
usage:
  - step: 00-request
    tokens: 1,508,678 input · 0 cache read · 0 cache write · 14,766 output · 1,523,444 total
    time: 2m 16s
  - step: 10-understanding
    tokens: 0 input · 0 cache read · 0 cache write · 0 output · 0 total
    time: 3s
  - step: 50-implementation
    tokens: 192,432 input · 0 cache read · 0 cache write · 825 output · 193,257 total
    time: 29s
  - step: conclude
    tokens: 398,974 input · 0 cache read · 0 cache write · 1,954 output · 400,928 total
    time: 31s
  - step: total
    tokens: 2,100,084 input · 0 cache read · 0 cache write · 17,545 output · 2,117,629 total
    time: 3m 19s
---

# Conclusion

## Summary
Not a kit bug. Copilot's own records for the DeepSeek sessions carry `cacheReadTokens: 0`, so the kit
reports what the client wrote down. The same code returns 3,971,082 cache reads for the Copilot-hosted
`gpt-6-luna` session on this machine, which rules out a parsing fault.

Cause: DeepSeek runs here as a BYOK provider over an OpenAI-compatible endpoint (`isByok: true`,
`providerType: openai`). Every `session.usage_record` reports `cacheReadTokens: 0` and
`cacheWriteTokens: 0` with `cacheDetailsReported: true`, and the `session.shutdown` summary repeats the
zeros. DeepSeek exposes prompt-cache hits in its own field, which that endpoint does not map to the
OpenAI cached-token field Copilot stores, so the client has nothing to record.

## What changed
Range: `c07688c..HEAD` on `docs/022-copilot-cache-read-zero`

| Commit | Change |
|---|---|
| this commit | Explain in `docs/usage.md` that a `0` cache read can come from the provider, and record request 022 |

## Open items
- Real cache figures for DeepSeek need the provider to return them to Copilot; the kit cannot recover
  what no local record contains.
