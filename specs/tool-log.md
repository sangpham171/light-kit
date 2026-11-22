# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T15:12:57Z | claude | Bash | shell | git add specs/043-rule-triggers && git commit -m "docs(spec): conclude request 043-rule-triggers" -- specs/043-rule-triggers && git status --short && git log --oneline -10 |
| 2026-11-22T15:13:00Z | claude | Bash | shell | git diff --stat 832be2a5360c84f132cc1e7b52ca9e3f60ced6a9..HEAD |
