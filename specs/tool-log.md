# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T16:41:49Z | claude | Bash | shell | git status --short && git add -A specs && git commit -q -m "docs(spec): log the frontmatter fix in request 049" && git log --oneline -12 && echo --- && git status --short |
| 2026-11-22T16:41:52Z | claude | Bash | shell | git add .light-kit/usage.json && git commit -q -m "chore(stats): record usage state" && git status --short && git log --oneline -1 |
