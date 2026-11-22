import { readFileSync, renameSync, writeFileSync } from 'node:fs';

// Per-request counts of agent and skill calls. The JSON file is the source of truth; the Markdown
// table beside it is rendered from it, so a reader gets a table and a tool gets exact numbers.
// Readers are best-effort like `usage.mjs`: a missing or corrupt file starts empty, never throws.

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

// The table the request asks for: one row per request, the last row the total over all requests.
// A call made before any request was active is reported as `(no request)`, not dropped.
export function renderTable(stats) {
  const agents = namesOf(stats.requests, 'agents');
  const skills = namesOf(stats.requests, 'skills');
  if (!agents.length && !skills.length) return `${TABLE_HEAD}No agent or skill calls recorded yet.\n`;
  const header = `| Request | ${[...agents.map((n) => `A: ${cell(n)}`), ...skills.map((n) => `S: ${cell(n)}`)].join(' | ')} |`;
  const rule = `|---|${Array(agents.length + skills.length).fill('---:').join('|')}|`;
  const order = Object.keys(stats.requests).filter((r) => r !== NO_REQUEST).sort((a, b) => a.localeCompare(b));
  if (NO_REQUEST in stats.requests) order.push(NO_REQUEST);
  const body = order.map((request) => {
    const row = stats.requests[request] ?? {};
    const values = [...agents.map((n) => count(row, 'agents', n)), ...skills.map((n) => count(row, 'skills', n))];
    return `| ${cell(request)} | ${values.join(' | ')} |`;
  });
  const sum = (field, name) => Object.values(stats.requests).reduce((total, row) => total + count(row, field, name), 0);
  const totals = [...agents.map((n) => sum('agents', n)), ...skills.map((n) => sum('skills', n))];
  return [TABLE_HEAD, header, rule, ...body, `| **All requests** | ${totals.join(' | ')} |`, ''].join('\n');
}
