import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { IDLE_MS, copilotSessionFile, deltaUsage, formatCount, formatDuration, formatUsage, totalUsage, usageFromCopilotSession, usageFromTranscript } from '../kit/hooks/lib/usage.mjs';

const line = (o) => `${JSON.stringify(o)}\n`;
const empty = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0, timeMs: 0, timeKnown: false };

test('Claude Code: keeps cache reads and writes separate from input', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  const f = join(d, 'session.jsonl');
  writeFileSync(f,
    line({ type: 'user', message: { role: 'user', content: 'hi' } })
    + line({ type: 'assistant', message: { usage: { input_tokens: 10, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, output_tokens: 4 } } })
    + 'not json\n'
    + line({ type: 'assistant', message: { usage: { input_tokens: 5, output_tokens: 1 } } })
    + line({ type: 'assistant', message: { role: 'assistant', content: 'no usage' } }));
  const u = usageFromTranscript(f);
  assert.deepEqual(u, { ...empty, input: 15, output: 5, cacheRead: 3, cacheWrite: 2, calls: 2 });
  assert.equal(totalUsage(u), 25);
  assert.equal(formatUsage(u), '15 input · 3 cache read · 2 cache write · 5 output · 25 total');
});

test('one turn splits into its four figures and the total they add up to', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  const f = join(d, 'session.jsonl');
  writeFileSync(f, line({ type: 'assistant', message: { id: 'm1', usage: {
    input_tokens: 10, output_tokens: 4, cache_read_input_tokens: 3, cache_creation_input_tokens: 2,
  } } }));
  const u = usageFromTranscript(f);
  assert.deepEqual(u, { ...empty, input: 10, output: 4, cacheRead: 3, cacheWrite: 2, calls: 1 });
  assert.equal(totalUsage(u), 19);
});

test('formatting labels each figure and groups thousands', () => {
  assert.equal(
    formatUsage({ input: 63_200, cacheRead: 4_400_000, cacheWrite: 1100, output: 36_700 }),
    '63,200 input · 4,400,000 cache read · 1,100 cache write · 36,700 output · 4,501,000 total');
  assert.equal(formatUsage({ input: 0, output: 0 }), '0 input · 0 cache read · 0 cache write · 0 output · 0 total');
  assert.equal(formatCount(999), '999');
  assert.equal(formatCount(1000), '1,000');
  assert.equal(formatCount(1_234.6), '1,235');
  assert.equal(formatCount(-5), '0');
  assert.equal(formatCount('x'), '0');
});

test('Claude Code: active time sums entry gaps and ignores idle gaps', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  const f = join(d, 'session.jsonl');
  writeFileSync(f,
    line({ type: 'user', timestamp: '2026-01-01T00:00:00Z' })
    + line({ type: 'assistant', timestamp: '2026-01-01T00:00:10Z', message: { usage: { input_tokens: 1, output_tokens: 1 } } })
    + line({ type: 'user', timestamp: '2026-01-01T00:00:40Z' }) // a 30 s tool run
    + line({ type: 'user', timestamp: '2026-01-01T05:00:00Z' }) // 4 h away: idle
    + line({ type: 'assistant', timestamp: '2026-01-01T05:00:05Z', message: { usage: { input_tokens: 1, output_tokens: 1 } } }));
  const u = usageFromTranscript(f);
  assert.equal(u.timeKnown, true);
  assert.equal(u.timeMs, 45_000); // 10 s + 30 s + 5 s; the idle gap is ignored
  assert.ok(IDLE_MS === 15 * 60 * 1000);
});

test('Claude Code: a message repeated for several content blocks counts once', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  const f = join(d, 'session.jsonl');
  const block = { type: 'assistant', message: { id: 'm1', usage: { input_tokens: 10, output_tokens: 1 } } };
  writeFileSync(f,
    line(block)
    + line(block) // the same response, another content block
    + line({ type: 'assistant', message: { id: 'm2', usage: { input_tokens: 5, output_tokens: 2 } } })
    + line({ type: 'assistant', message: { usage: { input_tokens: 1, output_tokens: 1 } } })); // no id: its own entry
  const u = usageFromTranscript(f);
  assert.equal(u.input, 16);
  assert.equal(u.output, 4);
  assert.equal(u.calls, 3);
});

test('missing and unreadable transcripts yield zeros, never an error', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  assert.deepEqual(usageFromTranscript(join(d, 'missing.jsonl')), empty);
  assert.deepEqual(usageFromTranscript(''), empty);
});

const op = (o) => line(o);

test('Copilot in VS Code: reads tokens and elapsed time from the chat session operation log', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  const f = join(d, 'session.jsonl');
  // `kind: 2` pushes a new request onto the array; the earlier request keeps its fields and result.
  writeFileSync(f,
    op({ kind: 0, v: { requests: [] } })
    + op({ kind: 2, k: ['requests'], v: [{ requestId: 'r1', timestamp: 1000 }] })
    + op({ kind: 1, k: ['requests', 0, 'promptTokens'], v: 12000 })
    + op({ kind: 1, k: ['requests', 0, 'completionTokens'], v: 800 })
    + op({ kind: 1, k: ['requests', 0, 'result'], v: { timings: { firstProgress: 100, totalElapsed: 4200 } } })
    + op({ kind: 2, k: ['requests'], v: [{ requestId: 'r2', timestamp: 9000 }] })
    + op({ kind: 1, k: ['requests', 1, 'promptTokens'], v: 30000 })
    + op({ kind: 1, k: ['requests', 1, 'completionTokens'], v: 1200 }));
  assert.deepEqual(usageFromCopilotSession(f, { now: 12_000 }),
    { ...empty, input: 42_000, output: 2000, calls: 2, timeMs: 7200, timeKnown: true });
  assert.deepEqual(usageFromCopilotSession(f, { now: 9000 }),
    { ...empty, input: 42_000, output: 2000, calls: 2, timeMs: 4200, timeKnown: true }); // running request, no time yet
});

test('Copilot in VS Code: a patch updates the request it names', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  const f = join(d, 'session.jsonl');
  writeFileSync(f,
    op({ kind: 0, v: { requests: [{ timestamp: 500, promptTokens: 100, completionTokens: 10 }] } })
    + op({ kind: 1, k: ['requests', 0, 'promptTokens'], v: 250 })
    + op({ kind: 1, k: ['requests', 0, 'completionTokens'], v: 40 }));
  assert.deepEqual(usageFromCopilotSession(f, { now: 0 }),
    { ...empty, input: 250, output: 40, calls: 1, timeMs: 0, timeKnown: false });
});

test('Copilot in VS Code: missing session logs yield zeros, never an error', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  assert.deepEqual(usageFromCopilotSession(join(d, 'missing.jsonl')), empty);
  assert.deepEqual(usageFromCopilotSession(''), empty);
});

test('Copilot in VS Code: finds the chat session log by id across VS Code editions', () => {
  const home = mkdtempSync(join(tmpdir(), 'light-kit-home-'));
  const id = '421df64e-9f9c-4370-ae1a-405b845ab668';
  const dir = join(home, 'Library/Application Support/Code/User/workspaceStorage/b94b0b5dbf52284596e423d9a5ebe5f9/chatSessions');
  mkdirSync(dir, { recursive: true });
  const f = join(dir, `${id}.jsonl`);
  writeFileSync(f, '');
  assert.equal(copilotSessionFile(id, { home, platform: 'darwin' }), f);
  assert.equal(copilotSessionFile('missing', { home, platform: 'darwin' }), '');
  assert.equal(copilotSessionFile('', { home, platform: 'darwin' }), '');
});

test('delta carries tokens, cache and time, clamping both when the record was reset', () => {
  assert.deepEqual(
    deltaUsage(
      { input: 120, output: 30, cacheRead: 400, cacheWrite: 50, timeMs: 5000, timeKnown: true },
      { input: 100, output: 20, cacheRead: 300, cacheWrite: 40, timeMs: 2000 }),
    { input: 20, output: 10, cacheRead: 100, cacheWrite: 10, timeMs: 3000, timeKnown: true });
  assert.deepEqual(
    deltaUsage({ input: 5, output: 1, timeMs: 0, timeKnown: true }, { input: 100, output: 20, timeMs: 9000 }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, timeMs: 0, timeKnown: true });
  assert.deepEqual(
    deltaUsage(
      { input: 5, output: 1, cacheRead: 100, cacheWrite: 50, timeMs: 0, timeKnown: true },
      { input: 0, output: 0, cacheRead: 9000, cacheWrite: 5000, timeMs: 0 }),
    { input: 5, output: 1, cacheRead: 0, cacheWrite: 0, timeMs: 0, timeKnown: true }); // a reset clamps cache too
  assert.deepEqual(deltaUsage({ input: 5, output: 1, timeMs: 0 }),
    { input: 5, output: 1, cacheRead: 0, cacheWrite: 0, timeMs: 0, timeKnown: false });
});

test('durations read at second resolution', () => {
  assert.equal(formatDuration(0), '0s');
  assert.equal(formatDuration(45_900), '45s');
  assert.equal(formatDuration(125_000), '2m 5s');
  assert.equal(formatDuration(120_000), '2m');
  assert.equal(formatDuration(3_844_000), '1h 4m');
  assert.equal(formatDuration(3_600_000), '1h');
  assert.equal(formatDuration(-5), '0s');
  assert.equal(formatDuration(undefined), '0s');
});
