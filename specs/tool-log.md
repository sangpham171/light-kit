# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T14:54:33Z | claude | Bash | shell | npm test 2>&1 \| tail -5 && git add specs/042-agent-skill-usage .light-kit/rules.md .light-kit/usage.json && git commit -q -m "docs(spec): conclude request 042" && git log --oneline -1 && git status - |
| 2026-11-22T14:54:36Z | claude | Bash | shell | git log --oneline af6bed1..HEAD && echo "---" && sed -n '1,12p' specs/042-agent-skill-usage/status.md |
