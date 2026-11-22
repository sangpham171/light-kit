# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T15:34:23Z | claude | Bash | shell | git add specs/045-universal-rules-reminder && git commit -m "docs(spec): conclude request 045-universal-rules-reminder" -- specs/045-universal-rules-reminder && git status --short && git log --oneline |
