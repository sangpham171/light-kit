# Request specifications

Each numbered folder records one request. The workflow adds only the artifacts it needs:
request, understanding, discovery, design, plan, implementation and conclusion, plus `status.md`.

`tool-log.md` sits inside each request folder: the `tool-log` hook appends one row per tool call
there, so the trail of what the agent actually ran stays with that request. It is written only while
the request is active, generated, safe to delete, and can be switched off with
`hooks.tool-log: "off"` in `.light-kit/hooks.config.json`.
