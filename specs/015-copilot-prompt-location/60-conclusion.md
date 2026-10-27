---
runs:
  - step: conclude
    agent: light-tech-writer
    model: deepseek-v4-flash
    thinking: unknown
    level: easy
---

# Conclusion

## Summary
A user-level Copilot install now puts the kit's `/light-*` prompt files where Copilot Chat reads them: the prompt folder of every VS Code edition and profile in your home folder. The ten files left in `~/.copilot/prompts` by the previous version are removed.

## What changed
Range: `2a9b365..0501adc` on `fix/015-copilot-prompt-location`

| Commit | Change |
|---|---|
| `ca0353e` | Copilot prompts map to the VS Code prompt folders; `build()` receives the home folder; old `.copilot/prompts` files are swept by install and uninstall |
| `d30165e` | User-level tests assert the new folders, the fallback path and the sweep |
| `57f2bf5`, `0501adc` | Docs, README and installer note; review nits |

## Verification evidence
- `npm test` — 122/122.
- Real `install --level user`: 11 files written, 10 obsolete prompt files removed; `~/Library/Application Support/Code/User/prompts` holds the 10 `light-*.prompt.md` files, `~/.copilot/prompts` no longer exists.
- Reload the VS Code window to pick the prompts up; they appear as `/light-*` in Local chat sessions.

## Token usage
| Step | Input | Cache read | Cache write | Output | Total | Time |
|---|---|---|---|---|---|---|
| request | unknown | unknown | unknown | unknown | unknown | unknown |
| understand | unknown | unknown | unknown | unknown | unknown | unknown |
| discover | unknown | unknown | unknown | unknown | unknown | unknown |
| plan | unknown | unknown | unknown | unknown | unknown | unknown |
| implement | unknown | unknown | unknown | unknown | unknown | unknown |
| verify-and-review | unknown | unknown | unknown | unknown | unknown | unknown |
| fix | unknown | unknown | unknown | unknown | unknown | unknown |
| conclude | unknown | unknown | unknown | unknown | unknown | unknown |
| **Total** | | | | | unknown | unknown |

## Deferred technical debt and open findings
None.

## Follow-ups
- Prompt files run only in Local sessions of Copilot Chat; the Copilot harness (CLI/app) does not use prompt files, so no prompt folder is installed under `~/.copilot`.
- Machines with several VS Code profiles get one copy per profile; changing one does not update the others (re-run the installer).
