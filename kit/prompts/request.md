---
name: request
description: Start a new request. Triage it and run the matching workflow end to end.
argument-hint: "<what you want> [--workflow direct|standard|full]"
---

# Request

Act as the **orchestrator** agent for: `$ARGUMENTS`

Create the next `specs/NNN-slug/` folder, then follow the orchestrator instructions: record the request, write the understanding, triage (honour `--workflow` if given), and execute the workflow. Ask the user only at the gates and blocking questions that the workflow defines.
