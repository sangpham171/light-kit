# Agent and skill usage

How often each agent (`A:`) and skill (`S:`) ran, per request. Written by the light-kit
`agent-skill-usage` hook; `agent-skill-usage.json` holds the same data in machine-readable form and
is the source of truth. Safe to delete.

| Request | A: claude-code-guide | A: light-developer | A: light-orchestrator | A: light-reviewer | A: light-tech-lead | A: light-tech-writer | A: light-tester | S: light-hooks-config | S: light-request | S: light-request-branch | S: light-rules | S: light-triage |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 005-readme-install-details | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 006-token-usage-unknown | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 010-token-usage-format | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 011-cache-token-usage | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 012-cache-usage-templates | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 032-token-usage-rewrite | 0 | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 034-brainstorm-skill | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 035-brainstorm-output-file | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 036-brainstormer-agent | 0 | 0 | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 |
| 037-project-rules | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 038-tool-log-stop-commit | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 039-rules-promotion-threshold | 0 | 1 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 040-init-updates-existing-kit | 0 | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| 041-dynamic-agent-selection | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 042-agent-skill-usage | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 043-rule-triggers | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 044-multilingual-rules-reminder | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 045-universal-rules-reminder | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 049-usage-record-script | 0 | 1 | 2 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 050-sensitive-allow-kit-folders | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| 051-agent-skill-usage-per-spec | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| (no request) | 1 | 0 | 0 | 2 | 0 | 0 | 1 | 1 | 4 | 1 | 1 | 1 |
| **All requests** | 1 | 4 | 5 | 21 | 3 | 2 | 8 | 1 | 4 | 2 | 1 | 1 |
