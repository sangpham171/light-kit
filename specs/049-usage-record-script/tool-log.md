# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T16:35:43Z | claude | Write | write | specs/049-usage-record-script/00-request.md |
| 2026-11-22T16:35:47Z | claude | Write | write | specs/049-usage-record-script/10-understanding.md |
| 2026-11-22T16:35:51Z | claude | Write | write | specs/049-usage-record-script/40-plan.md |
| 2026-11-22T16:35:51Z | claude | Write | write | specs/049-usage-record-script/status.md |
| 2026-11-22T16:36:01Z | claude | Write | write | kit/hooks/record-usage.mjs |
| 2026-11-22T16:36:06Z | claude | Edit | write | kit/hooks/record-usage.mjs |
| 2026-11-22T16:36:10Z | claude | Bash | shell | TMP=$(mktemp -d) && mkdir -p "$TMP/.light-kit" "$TMP/specs/001-demo" && printf -- '---\nworkflow: direct\nstep: implement\nstate: in progress\n---\n' > "$TMP/specs/001-demo/status.md" && touch "$TMP/s |
| 2026-11-22T16:36:13Z | claude | Edit | write | kit/instructions/core.md |
| 2026-11-22T16:36:21Z | claude | Write | write | tests/record-usage.test.mjs |
| 2026-11-22T16:36:24Z | claude | Bash | shell | node --test tests/record-usage.test.mjs 2>&1 \| tail -16 |
| 2026-11-22T16:36:30Z | claude | Edit | write | kit/hooks/README.md |
| 2026-11-22T16:36:31Z | claude | Edit | write | kit/hooks/README.md |
| 2026-11-22T16:36:31Z | claude | Edit | write | docs/safety-hooks.md |
| 2026-11-22T16:36:33Z | claude | Edit | write | .light-kit/codebase-map.md |
| 2026-11-22T16:37:03Z | claude | Bash | shell | npm test 2>&1 \| tail -8 |
