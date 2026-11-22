# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T13:09:40Z | claude | Bash | shell | sed -n '1,30p' specs/038-tool-log-stop-commit/60-conclusion.md |
| 2026-11-22T13:09:44Z | claude | Bash | shell | git add -- specs/038-tool-log-stop-commit/60-conclusion.md specs/038-tool-log-stop-commit/status.md && git commit -q -m "docs(spec): conclude request 038" -- specs/038-tool-log-stop-commit/60-conclusi |
| 2026-11-22T13:09:47Z | claude | Bash | shell | printf '{"cwd":"%s","stop_hook_active":false}' "$PWD" \| node ~/.light-kit/hooks/run.mjs --client claude --event stop; echo "exit=$?"; git status --short; git log --oneline -2 |
