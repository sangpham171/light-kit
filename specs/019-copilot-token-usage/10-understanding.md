---
step: understand
runs:
  - agent: light-orchestrator
    model: unknown
    thinking: unknown
    level: medium
usage:
  tokens: unknown input · unknown cache read · unknown cache write · unknown output · unknown total
  time: unknown
---

# Understanding

## Restatement
Copilot token and elapsed-time usage should not remain unknown when the current VS Code profile stores its chat session log outside the default profile's storage folder.

## Root cause
`copilotSessionFile` in `kit/hooks/lib/usage.mjs` searches only `<app>/User/workspaceStorage/<workspace>/chatSessions/<sessionId>.jsonl`. VS Code named profiles keep workspace storage below `<app>/User/profiles/<profile>/workspaceStorage/`, so the session lookup fails and the hook stays silent. The existing test fixture covers only the default-profile path.

## Requirements
1. Find session logs in both default and named VS Code profile storage locations for supported editions.
2. Keep session IDs constrained to safe filename characters.
3. Preserve missing/unreadable-session behavior and existing token/time calculations.
4. Add coverage for profile discovery and retain the existing default-profile test.

## Triage
Scores: scope 1, ambiguity 0, risk 0, novelty 1, impact 0 (total 2)
Workflow: direct
Why: the failure is localized to Copilot session-file discovery; profile storage is a bounded variation of the existing lookup and can be verified with focused tests.

## Routing
- understand: medium — confirm the storage-layout gap and define profile coverage
- implement: medium — adjust local discovery logic and its tests
- review: medium — validate token usage still works end to end
- fix: medium — preserve implementation difficulty
- conclude: easy — summarize the focused change

## Out of scope
- Custom VS Code user-data directories.
- Changes to token and elapsed-time semantics.
