# Agent and skill usage

How often each agent (`A:`) and skill (`S:`) ran, per request. Written by the light-kit
`agent-skill-usage` hook; `agent-skill-usage.json` holds the same data in machine-readable form and
is the source of truth. Safe to delete.

| Request | A: light-reviewer | S: light-hooks-config |
|---|---:|---:|
| 043-rule-triggers | 1 | 0 |
| 044-multilingual-rules-reminder | 1 | 0 |
| 045-universal-rules-reminder | 1 | 0 |
| (no request) | 0 | 1 |
| **All requests** | 3 | 1 |
