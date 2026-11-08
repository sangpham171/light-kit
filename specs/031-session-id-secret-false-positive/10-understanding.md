---
step: understand
runs:
  - agent: light-orchestrator
    part: understanding and triage
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 793 input · 255,232 cache read · 0 cache write · 3,881 output · 259,906 total
  time: 25s
---

# Understanding

## Restatement
The secret detector's "long random token" rule matches strings that are identifiers, not credentials:
a Copilot session path (`session-state/<long id>/events.jsonl`) in a prompt is blocked, the same text
in a file write is blocked, and tool output containing it is warned about. Random ids and directory
paths must stop matching on their own; a token that sits in a secret-like context (an assignment, a
known credential prefix, a private key) must keep matching.

Separately, `protect-sensitive-files` matches `secrets.*`, so the kit's own detector source
`kit/hooks/lib/secrets.mjs` cannot be read or edited by an agent. It holds no secret; exempt it.

## Assumptions
- A session id is an opaque identifier (UUID, hex or base64url string), often inside a path; it never
  authenticates anything by itself.
- The false positive is the token shape, not the hook: the three checks share `findSecrets`.

## Open questions (with proposed defaults)
None.

## Requirements
1. The long-random-token rule does not match a UUID, a bare random id, or a path whose segments are
   ordinary words plus an id.
2. A long random string in a secret context (assignment to a secret-looking name, bearer/authorization
   value) is still found; the existing secret fixtures (API key, private key, URL credentials, bearer
   token, `password:`/`secret:` assignment) keep being blocked.
3. `kit/hooks/lib/secrets.mjs` is readable and editable in this repository.
4. No new dependency, hook id or config key; the rule stays one shared implementation for the three checks.

## Acceptance criteria
- A prompt containing a session path with a long mixed-case id is not blocked.
- Prompts, writes and outputs containing a UUID or a bare random id are not blocked or warned.
- The fixtures in `tests/hooks.test.mjs` for real secrets stay blocked, and new tests cover the ids
  and the path.
- Reading `kit/hooks/lib/secrets.mjs` through the hook returns success.
- `npm test` passes.

## In scope / Out of scope
- In: `kit/hooks/lib/secrets.mjs`, `.light-kit/hooks.config.json`, `tests/hooks.test.mjs`, the hook README
  wording for the rule.
- Out: changing hook modes, other heuristics (private key, URL credentials, assignments) and client payload
  handling.

## Triage
Scores: scope 1, ambiguity 0, risk 1, novelty 0, impact 0 (total 2)
Workflow: direct
Why: one shared rule, one narrow config exemption and tests; the change is internal and revertible, and
the existing secret fixtures guard against a looser detector.

## Routing
- understand: easy — restate a reproduced bug.
- plan: easy — two files plus tests.
- implement: easy — narrow the regex and add fixtures.
- review: easy — verify no real fixture regresses.
- fix: easy — one review turn.
- conclude: easy — short summary.
