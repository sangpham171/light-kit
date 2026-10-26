import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join } from 'node:path';
import { deltaUsage, formatDuration, formatUsage, totalUsage, usageFromTranscript } from '../lib/usage.mjs';

// Request artifacts carry a "## Token usage" section. After an artifact is written, read how much the
// client processed in this session and report the step's share; the agent fills the section.
// Only clients with a readable session record (Claude Code) are counted; others keep `unknown`.

const ARTIFACT = /(?:^|\/)specs\/([^/]+)\/(\d\d-[^/]+)\.md$/;
const STATE = '.light-kit/usage.json';
// User-level install in a project that has not run `init`: keep the state in the kit folder, one file per
// project, so reporting never creates `.light-kit/` in the project (which would look like an `init`).
const USER_STATE = '.light-kit/state';
const ZERO = { input: 0, output: 0, timeMs: 0 };

const abs = (ctx, file) => (isAbsolute(file) ? file : join(ctx.cwd, file));

const statePath = (ctx) => {
  if (ctx.kitEnabled) return join(ctx.scope, STATE);
  const key = createHash('sha1').update(ctx.root).digest('hex').slice(0, 12);
  return join(ctx.kitHome, USER_STATE, `usage-${basename(ctx.root)}-${key}.json`);
};

const section = (text) => text.split(/^## /m).find((p) => p.startsWith('Token usage')) ?? '';
// Both fields must be present: a duration when the transcript carries timestamps, `unknown` when it does not.
const tokensFilled = (body) => /\bTokens?:\s*\d/i.test(body) || /\|\s*\d[\d,]*\s*\|/.test(body);
const filledTime = (value, timeKnown) => /^\d/.test(value) || (!timeKnown && /^unknown\b/i.test(value));
const timeFilled = (body, timeKnown) => {
  const line = body.match(/^Time:\s*(.+)$/im);
  if (line) return filledTime(line[1].trim(), timeKnown);
  const rows = body.matchAll(/^\|\s*[^|\n]+\|\s*[^|\n]+\|\s*[^|\n]+\|\s*[^|\n]+\|\s*([^|\n]+)\|/gm);
  return [...rows].some(([, cell]) => filledTime(cell.trim(), timeKnown));
};
const filled = (text, timeKnown) => {
  const body = section(text);
  return tokensFilled(body) && timeFilled(body, timeKnown);
};
const timeOf = (u) => (u.timed ? formatDuration(u.timeMs) : 'unknown');

const readState = (file) => {
  try {
    const s = JSON.parse(readFileSync(file, 'utf8'));
    return { sessions: s.sessions ?? {}, requests: s.requests ?? {} };
  } catch { return { sessions: {}, requests: {} }; }
};

const saveState = (file, state) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2) + '\n');
};

const rows = (steps) => Object.entries(steps)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, u]) => `| ${id} | ${u.input} | ${u.output} | ${totalUsage(u)} | ${timeOf(u)} |`)
  .join('\n');

export default {
  id: 'token-usage',
  events: ['post-tool'],
  run(ctx) {
    if (ctx.tool.kind !== 'write' || ctx.client !== 'claude') return null; // a spec artifact is enough: no `init` needed
    const transcript = ctx.payload?.transcript_path ?? ctx.payload?.transcriptPath ?? '';
    if (!transcript) return null;
    const hit = ctx.files.map((f) => ({ path: abs(ctx, f), rel: ctx.rel(f).replace(/\\/g, '/') }))
      .map((f) => ({ ...f, match: f.rel.match(ARTIFACT) }))
      .find((f) => f.match);
    if (!hit) return null;

    const current = usageFromTranscript(transcript);
    if (!current.calls) return null;

    let text = '';
    try { text = readFileSync(hit.path, 'utf8'); } catch { return null; }

    // One baseline per session: everything since the previous snapshot belongs to this step.
    const stateFile = statePath(ctx);
    const state = readState(stateFile);
    const session = ctx.payload.session_id ?? ctx.payload.sessionId ?? transcript;
    const delta = deltaUsage(current, state.sessions[session] ?? ZERO);
    state.sessions[session] = { input: current.input, output: current.output, timeMs: current.timeMs };

    const [, request, step] = hit.match;
    state.requests[request] ??= { steps: {} };
    const totals = (state.requests[request].steps[step] ??= { ...ZERO, timed: false });
    totals.input = (Number(totals.input) || 0) + delta.input;
    totals.output = (Number(totals.output) || 0) + delta.output;
    if (delta.timeKnown) {
      totals.timeMs = (Number(totals.timeMs) || 0) + delta.timeMs;
      totals.timed = true;
    }
    saveState(stateFile, state);

    if (filled(text, delta.timeKnown)) return null;

    const steps = state.requests[request].steps;
    const stepList = Object.values(steps);
    const requestTotal = stepList
      .reduce((a, u) => ({ input: a.input + u.input, output: a.output + u.output }), { ...ZERO });
    const requestTimed = stepList.some((u) => u.timed);
    const requestTimeMs = stepList.reduce((a, u) => a + (u.timed ? Number(u.timeMs) || 0 : 0), 0);
    const where = section(text) ? `In ${hit.rel}, set` : `Add a \`## Token usage\` section to ${hit.rel} and set`;
    return {
      message: [
        `Token usage for ${request} step ${step}: ${formatUsage(delta)} (total ${totalUsage(delta)}), time ${delta.timeKnown ? formatDuration(delta.timeMs) : 'unknown'} (step total ${timeOf(totals)}).`,
        `Request totals — ${Object.entries(steps).sort(([a], [b]) => a.localeCompare(b)).map(([id, u]) => `${id} ${formatUsage(u)} ${timeOf(u)}`).join('; ')}; overall ${formatUsage(requestTotal)} (total ${totalUsage(requestTotal)}), time ${requestTimed ? formatDuration(requestTimeMs) : 'unknown'}.`,
        `${where} \`Tokens: ${formatUsage(totals)} (total ${totalUsage(totals)})\` and \`Time: ${timeOf(totals)}\`.`,
        `In 60-conclusion.md, use one table row per step and the total row:\n${rows(steps)}\n| **Total** | ${requestTotal.input} | ${requestTotal.output} | ${totalUsage(requestTotal)} | ${requestTimed ? formatDuration(requestTimeMs) : 'unknown'} |`,
        'Write `unknown` when the client exposes no usage or time.',
      ].join('\n'),
    };
  },
};
