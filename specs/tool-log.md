# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T16:17:20Z | claude | Bash | shell | git add specs/046-usage-state-commit/40-plan.md && git commit -m "docs(spec): tick request 046 plan" -- specs/046-usage-state-commit/40-plan.md && git add .light-kit/usage.json && git commit -m "chore |
| 2026-11-22T16:17:23Z | claude | Bash | shell | git diff --stat; echo "=== shared log exists? ==="; ls -la specs/tool-log.md 2>&1; echo "=== 046 log tail ==="; tail -6 specs/046-usage-state-commit/tool-log.md; echo "=== diff spec log ==="; git diff |
| 2026-11-22T16:17:30Z | claude | Bash | shell | git add specs/tool-log.md specs/046-usage-state-commit/tool-log.md && git commit -m "chore(spec): record tool-call logs" -- specs/tool-log.md specs/046-usage-state-commit/tool-log.md && git status --s |
| 2026-11-22T16:17:35Z | claude | Bash | shell | git ls-tree --name-only HEAD .light-kit/ \| grep -E "agent-skill\|usage\|models\|hooks.config" && node -e "const s=JSON.parse(require('fs').readFileSync('.light-kit/agent-skill-usage.json','utf8'));co |
