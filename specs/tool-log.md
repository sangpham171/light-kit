# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-12T19:37:00Z | claude | Bash | shell | sed -n 1,40p specs/033-prior-spec-scan/60-conclusion.md |
| 2026-11-12T19:37:03Z | claude | Bash | shell | sed -n 1,14p specs/033-prior-spec-scan/50-implementation.md && git status --porcelain |
