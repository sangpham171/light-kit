# Request specifications

Each numbered folder records one request. The workflow adds only the artifacts it needs:
request, understanding, discovery, design, plan, implementation and conclusion, plus `status.md`.

`tool-log.md` collects one row per tool call. Before a request folder exists the log lives at
`specs/tool-log.md`; the call that creates `specs/<NNN-slug>/` moves it into that folder, where the
rest of the request's calls are appended. When the agent stops, the hook commits any tool log still
uncommitted (`chore(spec): record tool-call logs`), leaving other work in progress alone. It is
generated, safe to delete, and can be switched off with `hooks.tool-log: "off"` in
`.light-kit/hooks.config.json`.
