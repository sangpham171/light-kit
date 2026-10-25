---
name: light-request
description: Start a new request. Triage it and run the matching workflow end to end.
purpose: structure
argument-hint: "<what you want> [--workflow direct|standard|full] [--review-turns N]"
---

# Request

Act as the **light-orchestrator** agent for: `$ARGUMENTS`

Create the next `specs/NNN-slug/` folder, then follow the orchestrator instructions: record the request, write the understanding, triage (honour `--workflow` and `--review-turns` if given), and execute the workflow. Ask the user only at the gates and blocking questions that the workflow defines.
