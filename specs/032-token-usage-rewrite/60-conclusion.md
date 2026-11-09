---
step: conclude
runs:
  - agent: light-orchestrator
    part: final summary and usage record
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  - step: 00-request
    tokens: 54,206 input · 776,064 cache read · 0 cache write · 13,308 output · 843,578 total
    time: 2m 53s
  - step: 10-understanding
    tokens: 684 input · 126,976 cache read · 0 cache write · 1,514 output · 129,174 total
    time: 11s
  - step: 40-plan
    tokens: 11,528 input · 896,128 cache read · 0 cache write · 7,073 output · 914,729 total
    time: 1m
  - step: 50-implementation
    tokens: 19,830 input · 1,422,720 cache read · 0 cache write · 8,958 output · 1,451,508 total
    time: 15m 57s
  - step: 60-conclusion
    tokens: 2,162 input · 348,672 cache read · 0 cache write · 5,386 output · 356,220 total
    time: 21s
  - step: total
    tokens: 88,410 input · 3,570,560 cache read · 0 cache write · 36,239 output · 3,695,209 total
    time: 20m 24s
---

# Conclusion

The `token-usage` hook no longer asks the agent to copy its numbers. After saving the per-request
state, it rewrites the artifact that was just written: the step's `tokens:` and `time:` in the header,
and in `60-conclusion.md` the whole `usage:` list, one sorted row per recorded step plus `total`. The
informational message remains only as a fallback — no header `usage:` entry, an unfilled legacy
`## Token usage` section, or a failed write.

## What changed
Range: `b1e77f4..f33c643` on `fix/032-token-usage-rewrite`

- `kit/hooks/checks/token-usage.mjs`: `rewriteUsage()` replaces the header `usage:` entry in place,
  step block or conclusion list, returns nothing on success, and falls back to the message otherwise;
  the header branch of the old fill check was removed with its dead helpers.
- `tests/hooks.test.mjs`: the rewrite cases assert the file and empty output; new cases cover the three
  fallbacks, legacy sections, a following header key, blank-line preservation, unindented conclusion
  rows, byte-for-byte preservation, idempotence and a write failure.
- `kit/hooks/README.md`, `docs/usage.md`, `kit/instructions/core.md`: the hook fills the entry; the
  message is fallback only.
- Spec artifacts for request 032.

## Verification evidence
- `node --test --test-name-pattern='token-usage' tests/hooks.test.mjs` — 23/23 pass.
- `npm test` — 174/174 pass, including after the review fixes.
- Review round 1 of 1: 1 should-fix (unindented conclusion rows) and 1 nit (blank-line coverage)
  found and fixed; no finding left open.

## Deferred technical debt and open findings
- TD-2 (noticed, pre-existing): the header rewrite matches `\n` only, so a CRLF artifact is left on
  the legacy/message path, as before.

## Follow-ups
- The live user-level hook install still runs the old code; reinstall the hooks to use the new
  behaviour in this workspace.
- The safety hooks warned about YAML front matter and spec paths that look like secrets during this
  request; no credential was involved. Worth a separate look if it recurs.
- The last checkpoint commits the request artifacts, the tool logs and `.light-kit/usage.json`, so the
  working tree is left clean as the user asked.
