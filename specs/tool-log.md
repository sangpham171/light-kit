# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-15T21:43:46Z | claude | Bash | shell | sed -n 1,32p specs/034-brainstorm-skill/60-conclusion.md && echo '---status---' && git status --short |
