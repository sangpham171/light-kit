# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T10:59:44Z | claude | Bash | shell | sed -i '' 's/^state: in-progress$/state: done/' specs/036-brainstormer-agent/status.md && git add specs/036-brainstormer-agent && git commit -m "docs(spec): conclude request 036" && git status --short |
| 2026-11-22T10:59:48Z | claude | Bash | shell | git add .light-kit/usage.json specs/034-brainstorm-skill/tool-log.md specs/035-brainstorm-output-file/tool-log.md && git commit -m "chore(kit): record local usage and tool logs" && git status --short  |
