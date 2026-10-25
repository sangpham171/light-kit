// Single entry point for every client's hooks: node run.mjs --client <claude|copilot|cursor|codex> --event <pre-tool|post-tool|prompt|session-start|stop>
// Reads the client's JSON payload on stdin, runs the enabled checks, answers in the client's format.
// Internal errors fail open (exit 0) so a bug here can never brick the agent.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { normalize } from './lib/normalize.mjs';
import { loadConfig, installRootOf } from './lib/config.mjs';
import { respond } from './lib/emit.mjs';
import { CHECKS } from './checks/index.mjs';

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? '' : process.argv[i + 1]; };

const REGISTRATION = { claude: '.claude/settings.json', codex: '.codex/hooks.json', cursor: '.cursor/hooks.json', copilot: '.github/hooks/light-kit.json' };
const ownRegistration = (client, root) => {
  const f = join(root, REGISTRATION[client] ?? '-');
  try { return existsSync(f) && readFileSync(f, 'utf8').includes('.light-kit/hooks/run.mjs'); } catch { return false; }
};

try {
  const client = arg('client'), event = arg('event');
  let payload = {};
  try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
  const ctx = normalize(client, event, payload, installRootOf(import.meta.url));
  // User-level install: a project that carries its own hook registration for this client handles itself.
  if (ctx.userLevel && ctx.kitEnabled && ownRegistration(client, ctx.root)) process.exit(0);
  const cfg = loadConfig(ctx.layers);
  const denies = [], notes = [];
  let stopBlock = '';
  for (const check of CHECKS) {
    const mode = cfg.modes[check.id];
    if (mode === 'off' || !check.events.includes(event)) continue;
    let res;
    try { res = check.run(ctx, cfg); } catch (e) { process.stderr.write(`light-kit: ${check.id} errored (ignored): ${e.message}\n`); continue; }
    if (!res?.message) continue;
    if (mode === 'block' && event === 'stop') stopBlock += `${res.message}\n`;
    else if (mode === 'block') denies.push(`[${check.id}] ${res.message}`);
    else notes.push(['session-context', 'audit-reminder'].includes(check.id) ? res.message : `light-kit warning [${check.id}]: ${res.message}`);
  }
  const out = respond(ctx, { denies, notes, stopBlock: stopBlock.trim() });
  if (out.stdout) process.stdout.write(out.stdout);
  if (out.stderr) process.stderr.write(out.stderr);
  process.exitCode = out.code;
} catch (e) {
  process.stderr.write(`light-kit hook error (ignored): ${e.message}\n`);
}
