# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T16:56:33Z | claude | Bash | shell | sed -n '1,30p' specs/050-sensitive-allow-kit-folders/60-conclusion.md && echo "---git---" && git status --short |
| 2026-11-22T16:57:06Z | claude | Bash | shell | npm test 2>&1 \| tail -6 |
