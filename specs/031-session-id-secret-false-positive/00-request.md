---
step: request
runs:
  - agent: light-orchestrator
    part: request capture and triage
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 66,405 input · 2,000,512 cache read · 0 cache write · 19,938 output · 2,086,855 total
  time: 8m 6s
---

# Request 031 — A session id is not a secret

Date: 2026-11-08
Requested by: the user

## Original request
> the session is usually a random id, so the hooks is usually block it when there is the session id

## Conversation context
| # | User turn | What it established |
|---|---|---|
| 1 | "the session is usually a random id, so the hooks is usually block it when there is the session id" | Report: a random session id is treated as a secret, so the safety hooks block or warn on a legitimate prompt, file write or tool output that contains one. |
| 2 | "why for v in \"0f3a1b2c9d8e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c\" \"sess_9f8e7d6c5b4a39281706f5e4d3c2b1a0XyZ\" ?" | A question about the probe command; the values were synthetic ids used to reproduce the block. No requirement changed. |
| 3 | "ok, rerun the script" | Approved reproducing the block and proceeding with the proposed fix. |

### Decisions
- Fix the long-random-token heuristic so random ids, UUIDs and directory paths are not secrets on their own, while a token in a secret-like context stays detected — the block hits real work — rejected: turning the rule off, or whitelisting each client's session path.
- Let the kit read and edit `kit/hooks/lib/secrets.mjs` again through `sensitive.allow` — the detector source is not a secrets file — rejected: leaving the kit's own source unreadable.

### Constraints and preferences
- Do not weaken real secret detection; existing fixtures must keep being blocked.
- Keep the change dependency-free, with no new hook id or config key.
- Follow the direct workflow for a small, internal fix.

### References
- `kit/hooks/lib/secrets.mjs` (the rule), `kit/hooks/checks/redact-prompt-secrets.mjs`, `block-secrets-in-writes.mjs`, `warn-secret-output.mjs`
- `kit/hooks/lib/config.mjs` (`sensitiveFiles`, `sensitiveAllow`)
- `tests/hooks.test.mjs`, `kit/hooks/README.md`

### Still open
None.
