import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { copilotSessionFile, deltaUsage, formatDuration, formatUsage, totalUsage, usageFromCopilotSession, usageFromTranscript } from '../lib/usage.mjs';

// Request artifacts carry a `usage:` list in their header. After an artifact is written, read how much
// the client processed in this session and report the step's share; the agent fills the row.
// Clients with a readable session record (Claude Code, Copilot in VS Code) are counted; Cursor and
// Codex keep `unknown`.

const ARTIFACT = /(?:^|\/)specs\/([^/]+)\/(\d\d-[^/]+)\.md$/;
const STATE = '.light-kit/usage.json';
// User-level install in a project that has not run `init`: keep the state in the kit folder, one file per
// project, so reporting never creates `.light-kit/` in the project (which would look like an `init`).
const USER_STATE = '.light-kit/state';
const ZERO = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, timeMs: 0 };
// Bumped when the counting changes. A file from an older version restarts: comparing figures on
// different scales (each response counted twice, or input that folded in cache reads) would attribute
// a whole step to the wrong bucket. Version 3 splits cache reads and writes out of input.
const STATE_VERSION = 3;

const abs = (ctx, file) => (isAbsolute(file) ? file : join(ctx.cwd, file));

const statePath = (ctx) => {
  if (ctx.kitEnabled) return join(ctx.scope, STATE);
  const key = createHash('sha1').update(ctx.root).digest('hex').slice(0, 12);
  return join(ctx.kitHome, USER_STATE, `usage-${basename(ctx.root)}-${key}.json`);
};

// The artifact header carries a `usage:` list: one `step` row per step, with `tokens` and `time`.
// Artifacts written before the move carry a trailing `## Token usage` section instead.
const headerOf = (text) => text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
const usageRows = (text) => {
  const lines = headerOf(text).split('\n');
  const start = lines.findIndex((line) => /^usage:\s*$/.test(line));
  if (start === -1) return [];
  return lines.slice(start + 1).join('\n').split(/\n(?=\s*- )/).filter((b) => /^\s*- /.test(b));
};
const field = (block, name) => block.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, 'm'))?.[1]?.trim() ?? '';
const section = (text) => text.split(/^## /m).find((p) => p.startsWith('Token usage')) ?? '';
// Both fields must be present: a duration when the transcript carries timestamps, `unknown` when it does not.
const filledTime = (value, timeKnown) => /^\d/.test(value) || (!timeKnown && /^unknown\b/i.test(value));
const filledTokens = (value) => /\d[\d,]*/.test(value);
const legacyTokensFilled = (body) => /\bTokens?:\s*\d/i.test(body) || /\|\s*\d[\d,]*\s*\|/.test(body);
const legacyTimeFilled = (body, timeKnown) => {
  const line = body.match(/^Time:\s*(.+)$/im);
  if (line) return filledTime(line[1].trim(), timeKnown);
  // Read the Time column from the header: a table without one is unfilled, even when its last cell is
  // a number. Rows are matched to the header's width, so 5-column and 7-column tables both work.
  const table = [...body.matchAll(/^\|(.+)\|\s*$/gm)].map(([, r]) => r.split('|').map((c) => c.trim()));
  const header = table.find((cells) => cells.some((c) => /^time$/i.test(c)));
  if (!header) return false;
  const index = header.findIndex((c) => /^time$/i.test(c));
  return table.some((cells) => cells.length === header.length && filledTime(cells[index], timeKnown));
};
const filled = (text, timeKnown) => {
  const rows = usageRows(text);
  if (rows.length) return rows.some((row) => filledTokens(field(row, 'tokens')) && filledTime(field(row, 'time'), timeKnown));
  const body = section(text);
  return legacyTokensFilled(body) && legacyTimeFilled(body, timeKnown);
};
const timeOf = (u) => (u.timed ? formatDuration(u.timeMs) : 'unknown');

const readState = (file) => {
  try {
    const s = JSON.parse(readFileSync(file, 'utf8'));
    if (s.version !== STATE_VERSION) return { sessions: {}, requests: {} };
    return { sessions: s.sessions ?? {}, requests: s.requests ?? {} };
  } catch { return { sessions: {}, requests: {} }; }
};

const saveState = (file, state) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify({ version: STATE_VERSION, ...state }, null, 2) + '\n');
};

const yamlRow = (id, u, time) => `  - step: ${id}\n    tokens: ${formatUsage(u)}\n    time: ${time}`;
const rows = (steps) => Object.entries(steps)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, u]) => yamlRow(id, u, timeOf(u)))
  .join('\n');

export default {
  id: 'token-usage',
  events: ['post-tool'],
  run(ctx) {
    if (ctx.tool.kind !== 'write') return null; // a spec artifact is enough: no `init` needed
    if (ctx.client !== 'claude' && ctx.client !== 'copilot') return null;
    const hit = ctx.files.map((f) => ({ path: abs(ctx, f), rel: ctx.rel(f).replace(/\\/g, '/') }))
      .map((f) => ({ ...f, match: f.rel.match(ARTIFACT) }))
      .find((f) => f.match);
    if (!hit) return null;

    const payload = ctx.payload ?? {};
    const session = payload.session_id ?? payload.sessionId ?? '';
    const transcript = payload.transcript_path ?? payload.transcriptPath ?? '';
    let current;
    if (ctx.client === 'claude') {
      if (!transcript) return null;
      current = usageFromTranscript(transcript);
    } else {
      if (!session) return null;
      // VS Code sends its own Copilot transcript path, which holds no token figures; the usage lives in
      // the chat session operation log, found by session id.
      const file = copilotSessionFile(session, { home: homedir() });
      if (!file) return null;
      const stamp = typeof payload.timestamp === 'string' ? Date.parse(payload.timestamp) : Number(payload.timestamp);
      current = usageFromCopilotSession(file, { now: Number.isFinite(stamp) ? stamp : Date.now() });
    }
    if (!current.calls) return null;

    let text = '';
    try { text = readFileSync(hit.path, 'utf8'); } catch { return null; }

    // One baseline per session: everything since the previous snapshot belongs to this step. Copilot
    // sessions share an id space with nothing else, so their key is namespaced.
    const stateFile = statePath(ctx);
    const state = readState(stateFile);
    const sessionKey = ctx.client === 'copilot' ? `copilot:${session}` : (session || transcript);
    const delta = deltaUsage(current, state.sessions[sessionKey] ?? ZERO);
    state.sessions[sessionKey] = {
      input: current.input, output: current.output,
      cacheRead: current.cacheRead, cacheWrite: current.cacheWrite,
      timeMs: current.timeMs,
    };

    const [, request, step] = hit.match;
    state.requests[request] ??= { steps: {} };
    const totals = (state.requests[request].steps[step] ??= { ...ZERO, timed: false });
    totals.input = (Number(totals.input) || 0) + delta.input;
    totals.output = (Number(totals.output) || 0) + delta.output;
    totals.cacheRead = (Number(totals.cacheRead) || 0) + delta.cacheRead;
    totals.cacheWrite = (Number(totals.cacheWrite) || 0) + delta.cacheWrite;
    if (delta.timeKnown) {
      totals.timeMs = (Number(totals.timeMs) || 0) + delta.timeMs;
      totals.timed = true;
    }
    saveState(stateFile, state);

    if (filled(text, delta.timeKnown)) return null;

    const steps = state.requests[request].steps;
    const stepList = Object.values(steps);
    const requestTotal = stepList.reduce((a, u) => ({
      input: a.input + (Number(u.input) || 0),
      output: a.output + (Number(u.output) || 0),
      cacheRead: a.cacheRead + (Number(u.cacheRead) || 0),
      cacheWrite: a.cacheWrite + (Number(u.cacheWrite) || 0),
    }), { ...ZERO });
    const requestTimed = stepList.some((u) => u.timed);
    const requestTimeMs = stepList.reduce((a, u) => a + (u.timed ? Number(u.timeMs) || 0 : 0), 0);
    const where = usageRows(text).length
      ? `In ${hit.rel}, set the \`usage:\` row`
      : `Add a \`usage:\` row to the header of ${hit.rel}`;
    const requestTime = requestTimed ? formatDuration(requestTimeMs) : 'unknown';
    // The conclusion holds every step, so the single-step suggestion would be wrong there.
    const conclusion = step === '60-conclusion';
    return {
      message: [
        `Token usage — ${request}, step ${step}`,
        `This write: ${formatUsage(delta)} · time ${delta.timeKnown ? formatDuration(delta.timeMs) : 'unknown'}`,
        `Step total: ${formatUsage(totals)} · time ${timeOf(totals)}`,
        `Request total: ${formatUsage(requestTotal)} · time ${requestTime}`,
        conclusion
          ? `In ${hit.rel}, fill the \`usage:\` list with the rows below.`
          : `${where}:\n${yamlRow(step, totals, timeOf(totals))}`,
        conclusion ? 'Use one row per step plus the total row:' : 'Rows for 60-conclusion.md, one per step plus the total row:',
        rows(steps),
        yamlRow('total', requestTotal, requestTime),
        'Write `unknown` when the client exposes no usage or time.',
      ].join('\n'),
    };
  },
};
