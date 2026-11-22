# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T16:31:00Z | claude | Write | write | specs/048-usage-history/00-request.md |
| 2026-11-22T16:31:03Z | claude | Write | write | specs/048-usage-history/10-understanding.md |
| 2026-11-22T16:31:08Z | claude | Write | write | specs/048-usage-history/40-plan.md |
| 2026-11-22T16:31:08Z | claude | Write | write | specs/048-usage-history/status.md |
| 2026-11-22T16:31:19Z | claude | Write | write | tools/backfill-usage.mjs |
| 2026-11-22T16:31:19Z | claude | Read | read | package.json |
| 2026-11-22T16:31:22Z | claude | Edit | write | tools/backfill-usage.mjs |
| 2026-11-22T16:31:22Z | claude | Edit | write | package.json |
| 2026-11-22T16:31:28Z | claude | Bash | shell | node tools/backfill-usage.mjs --root . --dry-run && git status --short |
| 2026-11-22T16:31:31Z | claude | Bash | shell | sed -n '1,30p' tests/agent-skill-usage.test.mjs |
| 2026-11-22T16:31:37Z | claude | Write | write | tests/backfill-usage.test.mjs |
| 2026-11-22T16:31:41Z | claude | Bash | shell | node --test tests/backfill-usage.test.mjs 2>&1 \| tail -20 |
