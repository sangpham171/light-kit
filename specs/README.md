# Request specifications

Each numbered folder records one request. The workflow adds only the artifacts it needs:
request, understanding, discovery, design, plan, implementation and conclusion, plus `status.md`.

`tool-log.md` sits beside the folders: the `tool-log` hook appends one row per tool call there,
so the trail of what the agent actually ran stays with the specs. It is generated, safe to delete,
and can be switched off with `hooks.tool-log: "off"` in `.light-kit/hooks.config.json`.
