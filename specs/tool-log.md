# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T19:27:26Z | claude | Bash | shell | node kit/hooks/record-usage.mjs agent light-orchestrator --root . --request 051-agent-skill-usage-per-spec && npm run backfill-usage 2>&1 \| tail -1 && tail -6 specs/051-agent-skill-usage-per-spec/age |
| 2026-11-22T19:27:29Z | claude | Bash | shell | git status --short |
