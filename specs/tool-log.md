# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T21:19:51Z | claude | Bash | shell | node --input-type=module -e ' import { readFileSync, readdirSync } from "node:fs"; import { join } from "node:path"; import { runsOf } from "./kit/hooks/lib/runs.mjs"; import { readStats, reconcileAge |
| 2026-11-22T21:19:56Z | claude | Bash | shell | git status --short && echo "---" && node -e 'const s=require("./.light-kit/agent-skill-usage.json"); console.log(JSON.stringify(s.requests["053-usage-record-reconcile"],null,2))' |
