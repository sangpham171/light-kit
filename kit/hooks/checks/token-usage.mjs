import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { deltaUsage, formatUsage, totalUsage, usageFromTranscript } from '../lib/usage.mjs';

// Request artifacts carry a "## Token usage" section. After an artifact is written, read how much the
// client processed in this session and report the step's share; the agent fills the section.
// Only clients with a readable session record (Claude Code) are counted; others keep `unknown`.

const ARTIFACT = /(?:^|\/)specs\/([^/]+)\/(\d\d-[^/]+)\.md$/;
const STATE = '.light-kit/usage.json';
const ZERO = { input: 0, output: 0 };

const abs = (ctx, file) => (isAbsolute(file) ? file : join(ctx.cwd, file));

const section = (text) => text.split(/^## /m).find((p) => p.startsWith('Token usage')) ?? '';
const filled = (text) => {
  const body = section(text);
  return /\bTokens?:\s*\d/i.test(body) || /\|\s*\d[\d,]*\s*\|/.test(body);
};

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
  .map(([id, u]) => `| ${id} | ${u.input} | ${u.output} | ${totalUsage(u)} |`)
  .join('\n');

export default {
  id: 'token-usage',
  events: ['post-tool'],
  run(ctx) {
    if (!ctx.kitEnabled || ctx.tool.kind !== 'write' || ctx.client !== 'claude') return null;
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
    const stateFile = join(ctx.scope, STATE);
    const state = readState(stateFile);
    const session = ctx.payload.session_id ?? ctx.payload.sessionId ?? transcript;
    const delta = deltaUsage(current, state.sessions[session] ?? ZERO);
    state.sessions[session] = { input: current.input, output: current.output };

    const [, request, step] = hit.match;
    state.requests[request] ??= { steps: {} };
    const totals = (state.requests[request].steps[step] ??= { ...ZERO });
    totals.input = (Number(totals.input) || 0) + delta.input;
    totals.output = (Number(totals.output) || 0) + delta.output;
    saveState(stateFile, state);

    if (filled(text)) return null;

    const requestTotal = Object.values(state.requests[request].steps)
      .reduce((a, u) => ({ input: a.input + u.input, output: a.output + u.output }), { ...ZERO });
    const where = section(text) ? `In ${hit.rel}, set` : `Add a \`## Token usage\` section to ${hit.rel} and set`;
    return {
      message: [
        `Token usage for ${request} step ${step}: ${formatUsage(delta)} (total ${totalUsage(delta)}).`,
        `Request totals — ${Object.entries(state.requests[request].steps).sort(([a], [b]) => a.localeCompare(b)).map(([id, u]) => `${id} ${formatUsage(u)}`).join('; ')}; overall ${formatUsage(requestTotal)} (total ${totalUsage(requestTotal)}).`,
        `${where} \`Tokens: ${formatUsage(totals)} (total ${totalUsage(totals)})\`.`,
        `In 60-conclusion.md, use one table row per step and the total row:\n${rows(state.requests[request].steps)}\n| **Total** | ${requestTotal.input} | ${requestTotal.output} | ${totalUsage(requestTotal)} |`,
        'Write `unknown` when the client exposes no usage.',
      ].join('\n'),
    };
  },
};
