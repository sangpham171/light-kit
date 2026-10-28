# Model routing

Use a strong model where the work is hard and a cheap one where it is not. `.light-kit/models.json` maps three difficulty tiers to models, using the names your client accepts, for example `easy` to a small model, `medium` to a mid one, `hard` to the strongest:
```json
{ "easy": "", "medium": "", "hard": "", "claude": { "easy": "", "medium": "", "hard": "" } }
```
Top-level values apply to every client; a client's own section (`claude`, `codex`, `copilot`, `cursor`) wins. **Empty means the client's own default model**, so nothing changes until you fill it in. At user, workspace and project level the nearest file wins per key.

- **Agents have no fixed tier.** The difficulty belongs to the task, so the same `light-developer` runs on the easy model for one task and the hard model for the next.
- **The level is decided per request, not stored anywhere.** Right after triage the orchestrator rates every step of the chosen workflow for this request, using the triage scores (a hard design only when scope, novelty, impact or risk is high; an easy conclusion unless the change is cross-cutting), and writes the ratings in the `## Routing` section of `10-understanding.md`. It re-rates when facts change (more ambiguity found, a design turns out simple).
- **Plan tasks** get their own level from the tech-lead (easy: mechanical or fully specified; medium: ordinary logic in one component; hard: spans components, unclear, new design, security, data migration, public interfaces; when unsure, the higher). The orchestrator can raise a task's level, never lower the tech-lead's.
- **Who routes:** the orchestrator (`light-model-routing` skill) calls each agent with the model of that task's tier. Reviews run at least as strong as the strongest tier used to write the code, and a fix runs on its task's tier or higher.
- **Escalation:** a task that fails its checks twice, or that the agent reports as harder than planned, is rerun one tier higher, never lower. The model and any escalation are noted per task in `50-implementation.md`. If the hardest tier fails twice it stops and reports.
- **Where it works:** it needs a client where the caller can pick the model for each agent call. Claude Code can (the subagent call has a model parameter that overrides the agent's own setting), and the orchestrator must be the main session, which `light-request` makes it. Where a client has no per-call model choice, or rejects a name, the work simply runs on the client's model and the orchestrator says so once.
