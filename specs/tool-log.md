# Tool call log

Appended by the light-kit `tool-log` hook after each tool call: one row per call, newest last.
Calls made before a request folder exists stay in `specs/tool-log.md` and move into the request
folder when it is created. Targets are the edited files, or the shell command. Tool output is not
stored. Safe to delete.

| Time | Client | Tool | Kind | Target |
|---|---|---|---|---|
| 2026-11-22T19:41:17Z | claude | Bash | shell | git status --porcelain && echo "--- conclusion header ---" && sed -n '1,30p' specs/052-version-bump-hook/60-conclusion.md && echo "--- version ---" && node -e "console.log(require('./package.json').ve |
| 2026-11-22T19:41:22Z | claude | Edit | write | .light-kit/codebase-map.md |
| 2026-11-22T19:41:22Z | claude | Edit | write | .light-kit/codebase-map.md |
| 2026-11-22T19:41:26Z | claude | Bash | shell | git add specs/052-version-bump-hook/status.md specs/052-version-bump-hook/50-implementation.md specs/052-version-bump-hook/60-conclusion.md specs/052-version-bump-hook/tool-log.md .light-kit/usage.jso |
