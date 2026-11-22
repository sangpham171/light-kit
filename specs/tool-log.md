# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T11:46:54Z | claude | Bash | shell | git add specs/037-project-rules && git commit -m "docs(spec): conclude request 037" -- specs/037-project-rules && git status --short && git log --oneline 561bba4..HEAD |
| 2026-11-22T11:46:58Z | claude | Bash | shell | git add .light-kit/usage.json && git commit -m "chore(kit): record local usage state" -- .light-kit/usage.json && git status --short && git log --oneline -1 |
