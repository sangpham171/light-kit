import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectEffort, effortFromCodex, effortFromTranscript, effortFromVscode } from '../kit/hooks/lib/effort.mjs';

const tmp = (prefix) => mkdtempSync(join(tmpdir(), prefix));
const line = (o) => `${JSON.stringify(o)}\n`;

test('Claude Code: reads the newest effort from the transcript', () => {
  const d = tmp('light-kit-effort-');
  const f = join(d, 'session.jsonl');
  writeFileSync(f, line({ type: 'user' }) + line({ type: 'assistant', effort: 'low' }) + line({ type: 'assistant', effort: 'high' }));
  assert.equal(effortFromTranscript(f), 'high');
  assert.equal(detectEffort({ client: 'claude', payload: { transcript_path: f } }), 'high');
});

test('Claude Code: falls back to the request metadata, and misses quietly', () => {
  const d = tmp('light-kit-effort-');
  const f = join(d, 'session.jsonl');
  writeFileSync(f, line({ type: 'api-request', params: { output_config: { effort: 'medium' } } }));
  assert.equal(effortFromTranscript(f), 'medium');
  assert.equal(effortFromTranscript(join(d, 'missing.jsonl')), '');
  assert.equal(detectEffort({ client: 'claude', payload: {} }), '');
});

test('Codex: reads model_reasoning_effort from config.toml', () => {
  const home = tmp('light-kit-effort-home-');
  mkdirSync(join(home, '.codex'), { recursive: true });
  writeFileSync(join(home, '.codex/config.toml'), 'model = "gpt-5"\nmodel_reasoning_effort = "high" # comment\n');
  assert.equal(effortFromCodex(home), 'high');
  assert.equal(detectEffort({ client: 'codex' }, { home }), 'high');
  assert.equal(effortFromCodex(home, { CODEX_HOME: join(home, 'missing') }), '');
});

test('Copilot: reads the VS Code model configuration and prefers the session model', () => {
  const home = tmp('light-kit-effort-home-');
  mkdirSync(join(home, 'Library/Application Support/Code/User/globalStorage'), { recursive: true });
  writeFileSync(join(home, 'Library/Application Support/Code/User/globalStorage/state.vscdb'), '');
  const query = () => JSON.stringify({ 'deepseek/deepseek-v4-pro': {}, 'deepseek/deepseek-v4-flash': { reasoningEffort: 'high' }, 'openai/gpt-5': { reasoningEffort: 'max' } });
  const opts = { home, platform: 'darwin', query };
  assert.equal(effortFromVscode(home, { ...opts, model: 'deepseek-v4-flash' }), 'high');
  assert.equal(effortFromVscode(home, { ...opts, model: 'gpt-5' }), 'max');
  assert.equal(effortFromVscode(home, opts), 'high');
  assert.equal(detectEffort({ client: 'copilot', model: 'gpt-5' }, opts), 'max');
});

test('Copilot: unknown when the database, the key or sqlite3 is missing', () => {
  const home = tmp('light-kit-effort-home-');
  assert.equal(detectEffort({ client: 'copilot' }, { home, platform: 'darwin', query: () => '' }), '');
  mkdirSync(join(home, 'Library/Application Support/Code/User/globalStorage'), { recursive: true });
  writeFileSync(join(home, 'Library/Application Support/Code/User/globalStorage/state.vscdb'), '');
  assert.equal(detectEffort({ client: 'copilot' }, { home, platform: 'darwin', query: () => '{}' }), '');
});

test('Cursor: only reads the Cursor state database', () => {
  const home = tmp('light-kit-effort-home-');
  mkdirSync(join(home, 'Library/Application Support/Code/User/globalStorage'), { recursive: true });
  writeFileSync(join(home, 'Library/Application Support/Code/User/globalStorage/state.vscdb'), '');
  const query = () => JSON.stringify({ model: { reasoningEffort: 'high' } });
  assert.equal(detectEffort({ client: 'cursor' }, { home, platform: 'darwin', query }), '');
  mkdirSync(join(home, 'Library/Application Support/Cursor/User/globalStorage'), { recursive: true });
  writeFileSync(join(home, 'Library/Application Support/Cursor/User/globalStorage/state.vscdb'), '');
  assert.equal(detectEffort({ client: 'cursor' }, { home, platform: 'darwin', query }), 'high');
});

test('unknown clients stay empty', () => {
  assert.equal(detectEffort({ client: 'other' }), '');
  assert.equal(detectEffort({}), '');
});
