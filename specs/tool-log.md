# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T14:11:15Z | claude | Bash | shell | sed -i '' 's/^step: review$/step: conclude/; s/^state: in-progress$/state: done/' specs/041-dynamic-agent-selection/status.md && git add specs/041-dynamic-agent-selection && git commit -q -m "docs(spe |
| 2026-11-22T14:11:19Z | claude | Bash | shell | git add .light-kit/usage.json && git commit -q -m "chore(kit): record local usage state" && git log --oneline -10 && git status --porcelain |
