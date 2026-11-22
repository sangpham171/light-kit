import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { activeRequests, currentRequest } from '../lib/specs.mjs';
import { NO_REQUEST, callOf, readStats, recordCall, renderTable, saveStats } from '../lib/usage-stats.mjs';

// How often each agent and skill ran, per request. One row per agent or skill call, counted against
// the request the session is working on (a call made before a request exists goes to `(no request)`).
// Writes `.light-kit/agent-skill-usage.json` (source of truth) and the rendered table beside it.
// Silent and never blocking, like `tool-log`; unmanaged projects are left untouched.

const JSON_FILE = 'agent-skill-usage.json';
const MD_FILE = 'agent-skill-usage.md';

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

export default {
  id: 'agent-skill-usage',
  events: ['post-tool'],
  run(ctx) {
    const call = callOf(ctx.tool.name, ctx.input);
    if (!call) return null;
    const request = workingRequest(ctx);
    const dir = statsDir(ctx, request);
    if (!dir) return null;

    const file = join(dir, JSON_FILE);
    const stats = readStats(file);
    const id = ctx.payload?.tool_use_id ?? ctx.payload?.toolUseId ?? '';
    const at = new Date().toISOString();
    if (!recordCall(stats, { ...call, request: request?.name ?? NO_REQUEST, at, id })) return null;

    mkdirSync(dir, { recursive: true });
    saveStats(file, stats);
    writeFileSync(join(dir, MD_FILE), renderTable(stats));
    return null;
  },
};
