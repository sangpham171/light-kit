// Record one agent or skill use in `.light-kit/agent-skill-usage.json` and its Markdown table.
// node .light-kit/hooks/record-usage.mjs <agent|skill> <name> [--request <slug>] [--id <call-id>] [--root <dir>]
//
// The `agent-skill-usage` hook records every call the client reports on its agent or skill tool.
// This command covers the uses that never become such a call — a skill applied by reading its file,
// or a step performed under an agent role by the session itself — so the stats do not depend on
// rebuilding history later. Both paths share `usage-stats.mjs`: the JSON stays the source of truth
// and the table is rendered from it.
//
// `--id` is the client's tool-call id when the caller has one: a use already recorded (by the hook or
// an earlier call) is skipped, so a use is never counted twice.
import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSON_FILE, MD_FILE, NO_REQUEST, readStats, recordCall, renderTable, saveRequestStats, saveStats, saveText } from './lib/usage-stats.mjs';
import { activeRequests, currentRequest } from './lib/specs.mjs';

const KINDS = new Set(['agent', 'skill']);

const cleanName = (value) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);

// The nearest folder above `start` that carries `.light-kit`, like the hook's project scope.
export function projectRoot(start = process.cwd()) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, '.light-kit'))) return dir;
    const up = dirname(dir);
    if (up === dir) return '';
    dir = up;
  }
}

const workingRequest = (root) => currentRequest(
  activeRequests(root).filter((r) => existsSync(join(root, 'specs', r.name, 'status.md'))),
);

// Record one use and write both files. Returns what happened so the CLI and tests can report it.
export function recordUsage({ kind, name, root = projectRoot(), request, id = '', at = new Date().toISOString() } = {}) {
  const type = String(kind ?? '').toLowerCase();
  if (!KINDS.has(type)) throw new Error('the first argument must be "agent" or "skill"');
  const used = cleanName(name);
  if (!used) throw new Error('give the agent or skill name as the second argument');
  const project = root ? resolve(root) : '';
  if (!project) throw new Error(`${process.cwd()} is not in a light-kit project (no .light-kit folder)`);
  const dir = join(project, '.light-kit');
  if (!existsSync(dir)) throw new Error(`${project} has no .light-kit folder`);

  let owner = NO_REQUEST;
  let requestDir = '';
  if (request) {
    if (!existsSync(join(project, 'specs', request))) throw new Error(`no specs/${request} folder in ${project}`);
    owner = request;
    requestDir = join(project, 'specs', request);
  } else {
    const working = workingRequest(project);
    owner = working?.name ?? NO_REQUEST;
    requestDir = working ? join(project, 'specs', working.name) : '';
  }

  const file = join(dir, JSON_FILE);
  const stats = readStats(file);
  const before = Number(stats.requests[owner]?.[type === 'agent' ? 'agents' : 'skills']?.[used]) || 0;
  const added = recordCall(stats, { kind: type, name: used, request: owner, at, id });
  if (added) {
    mkdirSync(dir, { recursive: true });
    saveStats(file, stats);
    saveText(join(dir, MD_FILE), renderTable(stats));
    if (requestDir) saveRequestStats(requestDir, stats, owner);
  }
  const total = Number(stats.requests[owner]?.[type === 'agent' ? 'agents' : 'skills']?.[used]) || before;
  return { added, kind: type, name: used, request: owner, total, file };
}

// Compare real paths: `/var/...` and `/private/var/...` are the same file, and a temp folder is
// reached through both spellings.
const isEntry = () => {
  if (!process.argv[1]) return false;
  try { return realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
};

if (isEntry()) {
  try {
    const args = process.argv.slice(2);
    const positional = [];
    const options = { root: '', request: '', id: '' };
    for (let i = 0; i < args.length; i += 1) {
      const a = args[i];
      if (a === '--root' || a === '--request' || a === '--id') options[a.slice(2)] = args[++i] ?? '';
      else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
      else positional.push(a);
    }
    const result = recordUsage({
      kind: positional[0], name: positional[1],
      root: options.root || projectRoot(), request: options.request, id: options.id,
    });
    console.log(result.added
      ? `recorded ${result.kind} ${result.name} for ${result.request} (${result.total} total)`
      : `${result.kind} ${result.name} was already recorded for ${result.request}`);
  } catch (e) {
    console.error(`record-usage: ${e.message}`);
    process.exitCode = 1;
  }
}
