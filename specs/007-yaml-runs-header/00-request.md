---
runs:
  - step: request
    agent: light-orchestrator
    model: deepseek-flash[1m]
    thinking: unknown
    level: easy
---

# Request 007 — `runs:` header is not valid YAML

Date: 2026-10-26
Requested by: light

## Original request
fix the header in templates. there is parsing problem. Here is an exemple:

```
Failed to parse frontmatter
Nested mappings are not allowed in compact mappings at line 2, column 11:

  - step: <step> | agent: <agent> | model: <model id> | thinking: <reasoning se…
          ^
```

## Token usage
Tokens: 1230544/31052 (total 1261596)
