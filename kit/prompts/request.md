---
name: request
description: Start a new request. Triage it and run the matching strategy end to end.
argument-hint: "<what you want> [--strategy direct|standard|full]"
---

# Request

Act as the **orchestrator** agent for: `$ARGUMENTS`

Create the next `specs/NNN-slug/` folder, then follow the orchestrator instructions: record the request, write the understanding, triage (honour `--strategy` if given), and execute the strategy. Ask the user only at the gates and blocking questions that the strategy defines.
