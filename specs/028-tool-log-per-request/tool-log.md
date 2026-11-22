# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T16:56:33Z | claude | Bash | shell | sed -n '1,30p' specs/050-sensitive-allow-kit-folders/60-conclusion.md && echo "---git---" && git status --short |
| 2026-11-22T16:57:06Z | claude | Bash | shell | npm test 2>&1 \| tail -6 |
| 2026-11-22T16:57:11Z | claude | Bash | shell | git add -A && git commit -q -m "docs(spec): conclude request 050" && git log --oneline -6 && git status --short |
| 2026-11-22T19:16:40Z | claude | Bash | shell | cat .light-kit/project-profile.md && echo "=== MAP ===" && cat .light-kit/codebase-map.md |
| 2026-11-22T19:16:42Z | claude | Bash | shell | ls -a .light-kit/ && echo "=== specs ===" && ls specs/ && echo "=== kit/hooks ===" && ls kit/hooks/ && ls kit/hooks/lib/ && ls kit/hooks/checks/ |
| 2026-11-22T19:16:43Z | claude | Bash | shell | cat .light-kit/rules.md && echo "=== usage files ===" && ls ~/.light-kit/hooks/ 2>/dev/null; grep -rn "agent-skill-usage" --include=*.mjs --include=*.json --include=*.md -l . \| head -30 |
| 2026-11-22T19:16:45Z | claude | Read | read | kit/hooks/checks/agent-skill-usage.mjs |
| 2026-11-22T19:16:45Z | claude | Read | read | kit/hooks/record-usage.mjs |
| 2026-11-22T19:16:46Z | claude | Read | read | kit/hooks/lib/usage-stats.mjs |
| 2026-11-22T19:16:46Z | claude | Read | read | tools/backfill-usage.mjs |
| 2026-11-22T19:16:47Z | claude | Bash | shell | ls tests/ && grep -rln "agent-skill-usage" kit tools tests docs README.md \| sort |
| 2026-11-22T19:16:49Z | claude | Bash | shell | ls specs/049-usage-record-script/ && echo "=== 050 ===" && ls specs/050-sensitive-allow-kit-folders/ && echo "=== 042 ===" && ls specs/042-agent-skill-usage/ |
| 2026-11-22T19:16:49Z | claude | Bash | shell | cat specs/042-agent-skill-usage/00-request.md specs/042-agent-skill-usage/10-understanding.md 2>/dev/null; echo "=== plan ==="; head -60 specs/042-agent-skill-usage/40-plan.md |
| 2026-11-22T19:16:52Z | claude | Read | read | kit/hooks/checks/tool-log.mjs |
| 2026-11-22T19:16:52Z | claude | Read | read | specs/028-tool-log-per-request/40-plan.md |
