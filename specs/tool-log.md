# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T13:47:30Z | claude | Bash | shell | npm test 2>&1 \| tail -7 |
| 2026-11-22T13:47:33Z | claude | Bash | shell | git add specs/040-init-updates-existing-kit .light-kit/rules.md && git commit -q -m "docs(spec): conclude request 040" && git status --short && git log --oneline -7 |
