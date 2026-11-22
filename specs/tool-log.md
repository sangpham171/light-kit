# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T13:19:13Z | claude | Bash | shell | sed -i '' 's/^step: review$/step: conclude/; s/^state: in-progress$/state: done/' specs/039-rules-promotion-threshold/status.md && grep -E '^step:\|^state:' specs/039-rules-promotion-threshold/status. |
| 2026-11-22T13:19:15Z | claude | Bash | shell | sed -n '1,30p' specs/039-rules-promotion-threshold/60-conclusion.md |
| 2026-11-22T13:19:18Z | claude | Bash | shell | git add specs/039-rules-promotion-threshold/60-conclusion.md specs/039-rules-promotion-threshold/status.md specs/039-rules-promotion-threshold/tool-log.md && git commit -q -m "docs(spec): conclude req |
