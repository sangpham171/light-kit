---
step: understand
runs:
  - agent: light-orchestrator
    model: deepseek-flash
    thinking: unknown
    level: easy
usage:
  tokens: 152 input · 55,168 cache read · 0 cache write · 400 output · 55,720 total
  time: 15s
---

# Understanding

## Restatement
The Copilot CLI hook file light-kit generates names its command only in `command`. Copilot CLI runs that as a cross-platform fallback, but its reference names `bash` as the field for Unix command hooks. Add `bash` to each generated Copilot hook entry, keeping `command` for Windows.

## Assumptions
- "bash as command" means the `bash` field of a command hook, as documented by Copilot, not a change of the hook event names or matchers.
- Other clients are out of scope; their files already use the field names those clients read.

## Requirements
1. Every generated `.github/hooks/light-kit.json` entry (project and user level) contains `bash` with the same command text as `command`.
2. Existing hooks of the user in that file are still kept, and a re-run stays a no-op.
3. Tests cover the new field.

## Triage
Scores: scope 1, ambiguity 0, risk 1, novelty 0, impact 0 (total 2)
Workflow: direct
Why: one field in the hook generator plus a test; the outcome is clear and the change is internal.
