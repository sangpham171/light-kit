import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Per-request counts of agent and skill calls. The JSON file is the source of truth; the Markdown
// table beside it is rendered from it, so a reader gets a table and a tool gets exact numbers.
// Readers are best-effort like `usage.mjs`: a missing or corrupt file starts empty, never throws.

export const JSON_FILE = 'agent-skill-usage.json';
export const MD_FILE = 'agent-skill-usage.md';
export const VERSION = 1;
export const NO_REQUEST = '(no request)';
// Enough recent call ids to absorb a client re-delivering the same event; no id ever repeats after that.
const RECENT_LIMIT = 200;

const normalize = (v) => String(v ?? '').toLowerCase().replace(/[^a-z]/g, '');
const AGENT_TOOLS = new Set(['task', 'agent', 'subagent', 'runsubagent', 'delegatetoagent', 'delegate']);
const SKILL_TOOLS = new Set(['skill', 'skills', 'invokeskill', 'runskill']);
const NAME_KEYS = {
  agent: ['subagent_type', 'subagentType', 'agent_name', 'agentName', 'agent', 'type', 'name'],
  skill: ['skill', 'skill_name', 'skillName', 'name'],
};

const cleanName = (value) => {
  const name = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  return name || 'unknown';
};

// Which agent or skill a tool call ran, if any. Claude Code uses `Agent` (older builds: `Task`) with
// `subagent_type`, and `Skill` with `skill`; other clients keep their own tool name, so the input
// shape is the fallback. Any other tool returns null.
export function callOf(tool, input) {
  const key = normalize(tool);
  let kind = AGENT_TOOLS.has(key) ? 'agent' : SKILL_TOOLS.has(key) ? 'skill' : '';
  if (!kind && input && typeof input === 'object') {
    if (typeof input.subagent_type === 'string' || typeof input.subagentType === 'string') kind = 'agent';
    else if (typeof input.skill === 'string' || typeof input.skill_name === 'string' || typeof input.skillName === 'string') kind = 'skill';
  }
  if (!kind) return null;
  const value = NAME_KEYS[kind].map((k) => input?.[k]).find((v) => typeof v === 'string' && v.trim());
  return { kind, name: cleanName(value) };
}

const isObject = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v);

// A row from an older or hand-edited file is repaired to this shape, so a stray value can never make
// recordCall or the renderer throw: an unreadable state restarts empty instead of failing every call.
const rowOf = (row) => isObject(row)
  ? {
    first: typeof row.first === 'string' ? row.first : '',
    last: typeof row.last === 'string' ? row.last : '',
    agents: isObject(row.agents) ? row.agents : {},
    skills: isObject(row.skills) ? row.skills : {},
  }
  : null;

export function readStats(file) {
  try {
    const s = JSON.parse(readFileSync(file, 'utf8'));
    if (s?.version !== VERSION || !isObject(s.requests)) throw new Error('unknown version');
    const requests = {};
    for (const [name, row] of Object.entries(s.requests)) {
      const repaired = rowOf(row);
      if (repaired) requests[name] = repaired;
    }
    const recent = Array.isArray(s.recent) ? s.recent.filter((id) => typeof id === 'string') : [];
    return { version: VERSION, recent: recent.slice(-RECENT_LIMIT), requests };
  } catch {
    return { version: VERSION, recent: [], requests: {} };
  }
}

// Temp file plus rename: an interrupted write leaves the previous file intact, never a half file.
export function saveText(file, text) {
  const temp = `${file}.tmp-${process.pid}`;
  writeFileSync(temp, text);
  renameSync(temp, file);
}

export const saveStats = (file, stats) => saveText(file, `${JSON.stringify(stats, null, 2)}\n`);

// The same stats limited to one request, written into that request's folder: the folder carries the
// usage it caused, beside the project-wide aggregate. A derived view, so it is best-effort — a
// missing folder or a failed write is skipped, never thrown, and the aggregate stays the truth.
export function saveRequestStats(requestDir, stats, request) {
  const row = stats.requests?.[request];
  if (!row || !existsSync(requestDir)) return false;
  const view = { version: VERSION, requests: { [request]: row } };
  try {
    saveStats(join(requestDir, JSON_FILE), view);
    saveText(join(requestDir, MD_FILE), renderTable(view, { request }));
    return true;
  } catch {
    return false;
  }
}

// Add one call. Returns false when the same tool call was already counted, so a client that delivers
// an event twice does not inflate the numbers.
export function recordCall(stats, { kind, name, request, at, id }) {
  if (id) {
    if (stats.recent.includes(id)) return false;
    stats.recent.push(id);
    if (stats.recent.length > RECENT_LIMIT) stats.recent.splice(0, stats.recent.length - RECENT_LIMIT);
  }
  const row = (stats.requests[request] ??= { first: at, last: at, agents: {}, skills: {} });
  row.first ||= at;
  row.last = at;
  const bag = kind === 'agent' ? (row.agents ??= {}) : (row.skills ??= {});
  bag[name] = (Number(bag[name]) || 0) + 1;
  return true;
}

// Fill the uses a tool call cannot report: the request's artifact headers are the kit's own record of
// which agent did each step, so each agent's count rises to the number of `runs:` entries it has.
// Counts never fall, so a call or a manual record already at or above the header count is not counted
// twice, and a header that is edited later cannot erase a use. Returns how many uses were added.
export function reconcileAgents(stats, request, runs, at) {
  const targets = {};
  for (const run of runs) if (run?.agent) targets[run.agent] = (Number(targets[run.agent]) || 0) + 1;
  if (!Object.keys(targets).length) return 0;
  const row = (stats.requests[request] ??= { first: at, last: at, agents: {}, skills: {} });
  row.agents = isObject(row.agents) ? row.agents : {};
  row.skills = isObject(row.skills) ? row.skills : {};
  row.first = typeof row.first === 'string' && row.first ? row.first : at;
  row.last = typeof row.last === 'string' && row.last ? row.last : at;
  let added = 0;
  for (const [agent, target] of Object.entries(targets)) {
    const current = Number(row.agents[agent]) || 0;
    if (current < target) { row.agents[agent] = target; added += target - current; }
  }
  if (added) row.last = at;
  return added;
}

const namesOf = (requests, field) => {
  const found = new Set();
  for (const row of Object.values(requests)) for (const name of Object.keys(row?.[field] ?? {})) found.add(name);
  return [...found].sort((a, b) => a.localeCompare(b));
};

const count = (row, field, name) => Number(row?.[field]?.[name]) || 0;
const cell = (s) => String(s).replace(/\|/g, '\\|');

const TABLE_HEAD = [
  '# Agent and skill usage',
  '',
  'How often each agent (`A:`) and skill (`S:`) ran, per request. Written by the light-kit',
  '`agent-skill-usage` hook; `agent-skill-usage.json` holds the same data in machine-readable form and',
  'is the source of truth. Safe to delete.',
  '',
].join('\n');

// A request folder's copy is derived from the project-wide file, not the truth, and its single row
// gets a `Total` footer instead of the aggregate's `All requests`.
const requestHead = (request) => [
  '# Agent and skill usage',
  '',
  `How often each agent (\`A:\`) and skill (\`S:\`) ran for ${request}. Written by the light-kit`,
  '`agent-skill-usage` hook from `.light-kit/agent-skill-usage.json`, which is the source of truth.',
  'Safe to delete.',
  '',
].join('\n');

// The table the request asks for: one row per request, the last row the total over all requests.
// A call made before any request was active is reported as `(no request)`, not dropped.
export function renderTable(stats, { request = '' } = {}) {
  const head = request ? requestHead(request) : TABLE_HEAD;
  const agents = namesOf(stats.requests, 'agents');
  const skills = namesOf(stats.requests, 'skills');
  if (!agents.length && !skills.length) return `${head}No agent or skill calls recorded yet.\n`;
  const header = `| Request | ${[...agents.map((n) => `A: ${cell(n)}`), ...skills.map((n) => `S: ${cell(n)}`)].join(' | ')} |`;
  const rule = `|---|${Array(agents.length + skills.length).fill('---:').join('|')}|`;
  const order = Object.keys(stats.requests).filter((r) => r !== NO_REQUEST).sort((a, b) => a.localeCompare(b));
  if (NO_REQUEST in stats.requests) order.push(NO_REQUEST);
  const body = order.map((name) => {
    const row = stats.requests[name] ?? {};
    const values = [...agents.map((n) => count(row, 'agents', n)), ...skills.map((n) => count(row, 'skills', n))];
    return `| ${cell(name)} | ${values.join(' | ')} |`;
  });
  const sum = (field, name) => Object.values(stats.requests).reduce((total, row) => total + count(row, field, name), 0);
  const totals = [...agents.map((n) => sum('agents', n)), ...skills.map((n) => sum('skills', n))];
  return [head, header, rule, ...body, `| ${request ? '**Total**' : '**All requests**'} | ${totals.join(' | ')} |`, ''].join('\n');
}
