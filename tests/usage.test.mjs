import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deltaUsage, formatUsage, totalUsage, usageFromTranscript } from '../kit/hooks/lib/usage.mjs';

const line = (o) => `${JSON.stringify(o)}\n`;

test('Claude Code: sums every assistant turn, including cached prompt tokens', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  const f = join(d, 'session.jsonl');
  writeFileSync(f,
    line({ type: 'user', message: { role: 'user', content: 'hi' } })
    + line({ type: 'assistant', message: { usage: { input_tokens: 10, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, output_tokens: 4 } } })
    + 'not json\n'
    + line({ type: 'assistant', message: { usage: { input_tokens: 5, output_tokens: 1 } } })
    + line({ type: 'assistant', message: { role: 'assistant', content: 'no usage' } }));
  const u = usageFromTranscript(f);
  assert.deepEqual(u, { input: 20, output: 5, cacheRead: 3, cacheWrite: 2, calls: 2 });
  assert.equal(totalUsage(u), 25);
  assert.equal(formatUsage(u), '20/5');
});

test('missing and unreadable transcripts yield zeros, never an error', () => {
  const d = mkdtempSync(join(tmpdir(), 'light-kit-usage-'));
  assert.deepEqual(usageFromTranscript(join(d, 'missing.jsonl')), { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 });
  assert.deepEqual(usageFromTranscript(''), { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, calls: 0 });
});

test('delta clamps to zero when the record was reset', () => {
  assert.deepEqual(deltaUsage({ input: 120, output: 30 }, { input: 100, output: 20 }), { input: 20, output: 10 });
  assert.deepEqual(deltaUsage({ input: 5, output: 1 }, { input: 100, output: 20 }), { input: 0, output: 0 });
});
