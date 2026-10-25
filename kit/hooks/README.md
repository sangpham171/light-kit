# light-kit hooks

Automatic guardrails that run inside your AI client. One script (`run.mjs`) serves every client; each client's hook file just calls it with `--client` and `--event`. Requires Node 18+ on the machine running the client. Internal errors never block the agent.

## What they do
| Hook | Event | Default | Purpose |
|---|---|---|---|
| `protect-sensitive-files` | before a tool runs | block | No reading or editing files that hold secrets (including via shell commands). Templates are allowed. |
| `block-secrets-in-writes` | before a file is written | block | Reject content that contains secrets (keys, credentials in URLs, token assignments, long random tokens). |
| `redact-prompt-secrets` | prompt submitted | block | Stop secrets from being sent to the model. |
| `guard-dangerous-commands` | before a shell command | block | Mass deletion, force push, hard reset, piping downloads into a shell, destructive database statements, environment dumps, printing secret variables, skipping verification. |
| `protect-paths` | before a write or mutating command | block | Version-control internals, hook files, and paths you declare protected. |
| `require-spec` | before a write | warn | Remind the agent to start a request before changing code. |
| `post-edit-quality` | after a write | warn | Run your format and lint commands on the edited file. |
| `warn-secret-output` | after a tool | warn | Tell the agent when output contains a secret. |
| `session-context` | session start | warn | Point the agent at the profile, the codebase map and the active request. |
| `verify-on-stop` | agent finishing | off | Run your verify command; if it fails, make the agent keep working (once). |
| `audit-log` | tool use | off | Append redacted tool activity to `.light-kit/audit.log`. |

`warn` means "tell the agent and continue". `off` disables a hook.

## Make them fit your project
Edit `.light-kit/hooks.config.json` (the `init` command does this for you, using the `hooks-config` skill). Lists in the config **add to** the built-in defaults.

| Key | Purpose |
|---|---|
| `hooks.<name>` | `block`, `warn` or `off` |
| `sensitive.extraFiles` / `sensitive.allow` | globs for more sensitive files / safe templates |
| `sensitive.extraEnvKeywords` | words that mark an environment variable as secret |
| `secrets.extraPatterns` | extra regexes for your own credential formats |
| `commands.extraDeny` / `commands.allow` | regexes for extra blocked commands / exceptions |
| `protect.paths` | globs for generated, vendored or locked paths |
| `spec.exempt` | globs that may change without an active request |
| `quality.format` / `quality.lint` | commands for one file; `{file}` is replaced by its path |
| `verify.command` | one command that verifies the whole project |
| `audit.file` | log location |

Globs without `/` match file names anywhere; globs with `/` match from the project root.

## Client support
Claude Code (`.claude/settings.json`), Codex (`.codex/hooks.json`; run `/hooks` once to trust them), Cursor (`.cursor/hooks.json`) and Copilot (`.github/hooks/light-kit.json`; no stop hook). Your own hooks in those files are kept. Blocking uses exit code 2 with the reason on stderr.
