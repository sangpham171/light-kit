---
step: implement
runs:
  - agent: light-developer
    part: rule, exemption, tests and docs
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 11,856 input · 2,792,448 cache read · 0 cache write · 19,392 output · 2,823,696 total
  time: 4m 25s
---

# Implementation

## Changes
- `kit/hooks/lib/secrets.mjs`: the `long random token` rule now skips a run that looks like a path
  (`looksLikePath`: it contains `/` and at least one segment is plain words with no digit). The other
  rules (assignments, bearer, signed token, URL credentials, private key) are untouched.
- `kit/hooks/lib/config.mjs`: builtin `sensitiveAllow` gains `**/kit/hooks/lib/secrets.mjs`, so the
  kit's own detector source is never treated as a secrets file.
- `.light-kit/hooks.config.json`: the same allow at project level, so the currently installed
  user-level hook can read and edit the detector too.
- `tests/hooks.test.mjs`: a session path, a UUID and a hex id pass in prompt, write and output while a
  bare high-entropy string is still blocked; the detector source passes `protect-sensitive-files` and
  `secrets.json` still does not.
- Docs: `kit/hooks/README.md`, `docs/safety-hooks.md`.

## Decisions
- Path test is structural, not a list of prefixes: one word-like segment marks the run as a path. This
  also covers absolute workspace paths and URL routes. Rejected: skipping every run containing `/`
  (would lose base64 tokens), and whitelisting `session-state/` (the next client path would break again).
- The exemption goes in the builtin config so every install gets it; the project entry keeps it working
  until the user-level install is refreshed. Replacing that install (`tools/install.mjs ~`) was denied
  by the permission classifier, so it is left to the user.
- UUIDs and hex ids already did not match the rule (no uppercase, or segments under 40 characters);
  the new tests lock that behavior in so a future rule change does not regress it.

## Verification
- Live probes through `kit/hooks/run.mjs`: a prompt, a write and a tool output holding
  `session-state/<long id>/events.jsonl` pass; a bare 44-character mixed-case string is still blocked in
  a prompt and warned in output; an `api_key = "<token>"` assignment is still blocked.
- `node --test tests/hooks.test.mjs`: 61 passed.
- `npm test`: 165 passed (includes the kit lint).

## Review
Direct workflow, self-review: all existing secret fixtures still block, no new hook id, config key or
dependency; the path test only narrows the random-token rule and leaves the contextual rules intact.

## Deviations
- Plan task 1 named the project config only; the shipped fix is the builtin allow plus the project entry.
