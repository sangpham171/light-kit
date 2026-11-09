# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-09T12:56:21Z | claude | Bash | shell | git status --short; echo ---; git diff --stat; echo ---; git diff -- specs/031-session-id-secret-false-positive/tool-log.md; echo ---; wc -l specs/017-usage-in-header/tool-log.md specs/032-token-usage |
| 2026-11-09T12:56:56Z | claude | Bash | shell | git add specs/032-token-usage-rewrite && git commit -q -m "docs(specs): conclude request 032" && git add specs/017-usage-in-header/tool-log.md specs/031-session-id-secret-false-positive/tool-log.md && |
