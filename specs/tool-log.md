# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-18T13:55:24Z | claude | Bash | shell | git add specs/035-brainstorm-output-file/60-conclusion.md specs/035-brainstorm-output-file/status.md && git commit -m "docs(spec): conclude request 035" && git status --short |
