# Auditing the kit

New models need less hand-holding, so guidance written for an older one becomes dead weight in every session. The `light-audit` skill reviews the kit itself and says what to shorten, merge or remove.

- **Measure:** `node .light-kit/audit/audit.mjs` (or `node kit/audit/audit.mjs --source kit` in this repository) reports what is loaded every session versus on demand, unused skills and agents, stale references, repeated text, and the components worth testing.
- **Judge by purpose:** every agent, skill, workflow and core rule is labelled `compensation` (exists because a model needed it), `structure` (process design), `preference` (your wishes) or `enforcement` (safety). Only compensation gets the necessity test; preferences and safety are never removed on model grounds.
- **Necessity test:** a self-check, then for the costly or doubtful ones a probe: small tasks run twice in an empty folder through the client's non-interactive mode (for example `claude -p`), with and without the component. High confidence needs the probe.
- **Result:** a report in `.light-kit/audits/<date>-<model>.md` with verdicts, evidence, confidence and tokens saved. In this repository, `light-audit --apply` applies the high-confidence ones, one commit each; in an installed kit it never edits generated files (an upgrade would overwrite them), it only reports.
- **When:** the session-start hook reminds you once per model when the model in use differs from the one the kit was last audited with (clients that do not report their model are skipped; turn it off with `audit.remind: false`).
