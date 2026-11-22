# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T16:16:45Z | claude | Bash | shell | npm test 2>&1 \| tail -8 |
| 2026-11-22T16:16:45Z | claude | Bash | shell | head -20 specs/046-usage-state-commit/60-conclusion.md && echo "=== git status ===" && git status --short |
| 2026-11-22T16:16:51Z | claude | Bash | shell | echo "=== specs/tool-log.md diff ==="; git diff -- specs/tool-log.md \| head -40; echo "=== 046 tool-log tail ==="; tail -8 specs/046-usage-state-commit/tool-log.md; echo "=== usage json valid ==="; n |
| 2026-11-22T16:16:57Z | claude | Bash | shell | sed -n '1,80p' kit/hooks/checks/token-usage.mjs |
| 2026-11-22T16:16:59Z | claude | Bash | shell | grep -n "run(ctx\\|ARTIFACT\\|writeFileSync\\|save" kit/hooks/checks/token-usage.mjs \| tail -30 |
| 2026-11-22T16:17:03Z | claude | Bash | shell | git add specs/046-usage-state-commit && git commit -m "docs(spec): log and conclude request 046-usage-state-commit" -- specs/046-usage-state-commit && git log --oneline -1 |
| 2026-11-22T16:17:07Z | claude | Bash | shell | git add .light-kit/agent-skill-usage.json .light-kit/agent-skill-usage.md .light-kit/usage.json && git commit -m "chore(kit): record local usage state" -- .light-kit/agent-skill-usage.json .light-kit/ |
