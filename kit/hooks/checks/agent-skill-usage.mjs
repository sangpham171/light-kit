import { existsSync, mkdirSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { activeRequests, currentRequest, listProjectDirs, listRequests } from '../lib/specs.mjs';
import { runsOf } from '../lib/runs.mjs';
import { JSON_FILE, MD_FILE, NO_REQUEST, callOf, readStats, reconcileAgents, recordCall, renderTable, saveRequestStats, saveStats, saveText } from '../lib/usage-stats.mjs';

// How often each agent and skill ran, per request. One count per agent or skill call, against the
// request the session is working on (a call before a request exists goes to `(no request)`).
// Writes `.light-kit/agent-skill-usage.json` (source of truth) and the rendered table beside it, plus
// the same pair inside the request's own `specs/<NNN-slug>/` folder for every real request.
//
// A tool call is not the only record of a use. An agent role the session performed itself leaves no
// call, but the artifact it writes credits it in its `runs:` header; a skill applied by reading its
// installed `SKILL.md` leaves that read. Both are counted, and a count never falls, so a call or a
// manual `record-usage` already counted is not counted twice. On stop, every tracked or active
// request is reconciled once more, so a header written by a client the hook does not see is caught.
//
// Silent and never blocking, like `tool-log`; unmanaged projects are left untouched.

const ARTIFACT = /(^|\/)specs\/([^/]+)\/(\d\d-[^/]+\.md)$/;
const SKILL_FILE = /(^|\/)\.(?:claude|github|copilot|agents)\/skills\/(light-[a-z0-9-]+)\/SKILL\.md$/i;
const SPEC_REF = /specs\/([A-Za-z0-9][\w.-]*)/g;

// Same working-request rule as `tool-log`: a statusless folder is a leftover, not a request.
const workingRequest = (ctx) => currentRequest(
  activeRequests(ctx.scope, ctx.root).filter((r) => existsSync(join(r.home, 'specs', r.name, 'status.md'))),
);

// The project folder that owns the stats: the active request's project when there is one, else the
// current scope. A user-level install in a project without `.light-kit` writes nothing.
const statsDir = (ctx, request) => {
  if (request?.home && existsSync(join(request.home, '.light-kit'))) return join(request.home, '.light-kit');
  return ctx.kitEnabled ? join(ctx.scope, '.light-kit') : '';
};

const real = (path) => { try { return realpathSync(path); } catch { return resolve(path); } };
const roots = (ctx) => {
  const seen = new Set();
  return [ctx.scope, ctx.root, ...listProjectDirs(ctx.root)].filter(Boolean).filter((path) => {
    const key = real(path);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const within = (home, path) => {
  const rel = relative(home, path);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
};

// A request the call itself names: agent and skill prompts usually write `specs/<NNN-slug>`. Only an
// active request qualifies, and the most frequently named one wins, so a passing reference cannot
// capture the call when the session is working on another request. Two workspace projects can share
// a slug, so the project that contains the working folder wins a tie, then the first root (scope).
const namedRequest = (ctx, input) => {
  const text = ['prompt', 'description', 'args'].map((k) => input?.[k]).filter((v) => typeof v === 'string').join('\n');
  if (!text) return null;
  const active = activeRequests(...roots(ctx));
  if (!active.length) return null;
  const counts = new Map();
  // A sentence-ending period is not part of the slug.
  for (const match of text.matchAll(SPEC_REF)) {
    const name = match[1].replace(/[.-]+$/, '');
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  }
  let best = null;
  let score = 0;
  for (const request of active) {
    const count = counts.get(request.name);
    if (!count) continue;
    const ranked = count * 2 + (within(request.home, ctx.cwd) ? 1 : 0);
    if (ranked > score) { best = { home: request.home, name: request.name }; score = ranked; }
  }
  return best;
};

// The request whose artifact a written path belongs to: `.../specs/<name>/NN-*.md`.
const requestOfFile = (ctx, file) => {
  const rel = ctx.rel(file).replace(/\\/g, '/');
  const match = rel.match(ARTIFACT);
  if (!match) return null;
  const abs = file.startsWith('/') ? file : resolve(ctx.cwd, file);
  const home = dirname(dirname(dirname(abs)));
  return existsSync(join(home, 'specs', match[2])) ? { home, name: match[2] } : null;
};

const writtenRequest = (ctx) => {
  for (const file of ctx.files) {
    const request = requestOfFile(ctx, file);
    if (request) return request;
  }
  return null;
};

// A skill applied by reading its installed file. The kit source (`kit/skills/`) does not count: it is
// edited, not applied.
const skillRead = (ctx) => {
  if (ctx.tool.kind !== 'read') return null;
  for (const file of ctx.files) {
    const match = ctx.rel(file).replace(/\\/g, '/').match(SKILL_FILE);
    if (match) return { kind: 'skill', name: match[2] };
  }
  return null;
};

const artifactFiles = (home, name) => {
  try { return readdirSync(join(home, 'specs', name)).filter((f) => /^\d\d-[^/]+\.md$/.test(f)); } catch { return []; }
};

// Parse only the header; the file is read once and `runsOf` stops at its first `usage:` line.
const runsIn = (home, name) => artifactFiles(home, name).flatMap((file) => {
  try { return runsOf(readFileSync(join(home, 'specs', name, file), 'utf8')); } catch { return []; }
});

const writeStats = (dir, stats) => {
  mkdirSync(dir, { recursive: true });
  saveStats(join(dir, JSON_FILE), stats);
  saveText(join(dir, MD_FILE), renderTable(stats));
};

const reconcile = (ctx, request, at) => {
  if (!request) return false;
  const dir = statsDir(ctx, request);
  if (!dir) return false;
  const runs = runsIn(request.home, request.name);
  if (!runs.length) return false;
  try {
    const stats = readStats(join(dir, JSON_FILE));
    if (!reconcileAgents(stats, request.name, runs, at)) return false;
    writeStats(dir, stats);
    saveRequestStats(join(request.home, 'specs', request.name), stats, request.name);
    return true;
  } catch { return false; } // best-effort: a failed write must never reach the client
};

// On stop, catch what no tool event reached: a header written by a client or subagent whose calls the
// hook did not see. Only requests already tracked or still active are reconciled, so the mechanism
// does not invent history for requests that predate it (R-006).
const reconcileAll = (ctx, at) => {
  for (const home of roots(ctx)) {
    const dir = join(home, '.light-kit');
    if (!existsSync(dir)) continue;
    try {
      const stats = readStats(join(dir, JSON_FILE));
      const changed = [];
      for (const request of listRequests(home)) {
        const tracked = Object.prototype.hasOwnProperty.call(stats.requests, request.name);
        const active = request.understood && request.state !== 'done'
          && existsSync(join(home, 'specs', request.name, 'status.md'));
        if (!tracked && !active) continue;
        if (reconcileAgents(stats, request.name, runsIn(home, request.name), at)) changed.push(request.name);
      }
      if (!changed.length) continue;
      writeStats(dir, stats);
      for (const name of changed) saveRequestStats(join(home, 'specs', name), stats, name);
    } catch { /* one unreadable or unwritable home must not stop the others */ }
  }
};

export default {
  id: 'agent-skill-usage',
  events: ['post-tool', 'stop'],
  run(ctx) {
    const at = new Date().toISOString();
    if (ctx.event === 'stop') { reconcileAll(ctx, at); return null; }

    const call = callOf(ctx.tool.name, ctx.input) ?? skillRead(ctx);
    const request = call ? namedRequest(ctx, ctx.input) ?? workingRequest(ctx) : null;
    if (call) {
      const dir = statsDir(ctx, request);
      if (dir) {
        const stats = readStats(join(dir, JSON_FILE));
        const id = ctx.payload?.tool_use_id ?? ctx.payload?.toolUseId ?? '';
        if (recordCall(stats, { ...call, request: request?.name ?? NO_REQUEST, at, id })) {
          try { writeStats(dir, stats); } catch { /* best-effort: never reach the client */ }
          if (request) saveRequestStats(join(request.home, 'specs', request.name), stats, request.name);
        }
      }
    }

    // Reconcile the request the call served and the request whose artifact was just written: a
    // subagent's header arrives with the `Agent` call, the session's own role with the artifact.
    const targets = [request, writtenRequest(ctx)].filter(Boolean);
    const seen = new Set();
    for (const target of targets) {
      const key = `${target.home}\u0000${target.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      reconcile(ctx, target, at);
    }
    return null;
  },
};
