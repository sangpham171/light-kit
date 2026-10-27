import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectModel, modelFromCopilotEvents, modelFromCopilotChat, modelFromTranscript } from '../kit/hooks/lib/model.mjs';

const tmp = (prefix) => mkdtempSync(join(tmpdir(), prefix));
const line = (o) => `${JSON.stringify(o)}\n`;

test('Copilot: reads the model from the session event log', () => {
  const home = tmp('light-kit-model-home-');
  const dir = join(home, '.copilot/session-state/abc-123');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'events.jsonl'), line({ type: 'session.start', data: { selectedModel: 'deepseek/deepseek-flash', reasoningEffort: 'high' } }) + line({ type: 'hook.start', data: {} }));
  assert.equal(modelFromCopilotEvents(join(dir, 'events.jsonl')), 'deepseek/deepseek-flash');
  assert.equal(detectModel({ client: 'copilot', payload: { sessionId: 'abc-123' } }, { home, env: {} }), 'deepseek/deepseek-flash');
});

test('Copilot: honours COPILOT_HOME and reads a model object', () => {
  const home = tmp('light-kit-model-home-');
  const moved = tmp('light-kit-model-home-');
  mkdirSync(join(moved, 'session-state/abc'), { recursive: true });
  writeFileSync(join(moved, 'session-state/abc/events.jsonl'), line({ type: 'session.start', data: { model: { id: 'openai/gpt-5' } } }));
  assert.equal(detectModel({ client: 'copilot', payload: { session_id: 'abc' } }, { home, env: { COPILOT_HOME: moved } }), 'openai/gpt-5');
});

test('Copilot: reads the selected model of a chat session log, later switches winning', () => {
  const home = tmp('light-kit-model-home-');
  const dir = join(home, 'Library/Application Support/Code/User/workspaceStorage/ws/chatSessions');
  mkdirSync(dir, { recursive: true });
  const snapshot = { kind: 0, v: { inputState: { selectedModel: { identifier: 'deepseek/deepseek-v4-flash', metadata: { id: 'deepseek-v4-flash' } } } } };
  writeFileSync(join(dir, 'abc.jsonl'), line(snapshot));
  assert.equal(modelFromCopilotChat(join(dir, 'abc.jsonl')), 'deepseek/deepseek-v4-flash');
  assert.equal(detectModel({ client: 'copilot', payload: { session_id: 'abc' } }, { home, platform: 'darwin' }), 'deepseek/deepseek-v4-flash');
  writeFileSync(join(dir, 'abc.jsonl'), line(snapshot) + line({ kind: 1, k: ['inputState', 'selectedModel', 'identifier'], v: 'openai/gpt-5' }));
  assert.equal(detectModel({ client: 'copilot', payload: { session_id: 'abc' } }, { home, platform: 'darwin' }), 'openai/gpt-5');
});

test('Copilot: the event log wins over the chat log, and an unsafe id reads nothing', () => {
  const home = tmp('light-kit-model-home-');
  const chat = join(home, 'Library/Application Support/Code/User/workspaceStorage/ws/chatSessions');
  mkdirSync(chat, { recursive: true });
  writeFileSync(join(chat, 'abc.jsonl'), line({ kind: 0, v: { inputState: { selectedModel: { identifier: 'openai/gpt-5' } } } }));
  const events = join(home, '.copilot/session-state/abc');
  mkdirSync(events, { recursive: true });
  writeFileSync(join(events, 'events.jsonl'), line({ type: 'session.start', data: { selectedModel: 'deepseek/deepseek-flash' } }));
  const opts = { home, platform: 'darwin', env: {} };
  assert.equal(detectModel({ client: 'copilot', payload: { session_id: 'abc' } }, opts), 'deepseek/deepseek-flash');
  assert.equal(detectModel({ client: 'copilot', payload: { session_id: '../abc' } }, opts), '');
});

test('Claude Code: reads the model of the last assistant turn', () => {
  const d = tmp('light-kit-model-');
  const f = join(d, 'session.jsonl');
  writeFileSync(f, line({ type: 'user' }) + line({ type: 'assistant', message: { model: 'claude-sonnet-4-5' } }) + line({ type: 'assistant', message: { model: 'claude-opus-4-1' } }));
  assert.equal(modelFromTranscript(f), 'claude-opus-4-1');
  assert.equal(detectModel({ client: 'claude', payload: { transcript_path: f } }), 'claude-opus-4-1');
  assert.equal(modelFromTranscript(join(d, 'missing.jsonl')), '');
});

test('a model reported by the hook payload wins, and unknown clients stay empty', () => {
  assert.equal(detectModel({ client: 'cursor', model: 'gpt-5' }), 'gpt-5');
  assert.equal(detectModel({ client: 'cursor' }, { home: tmp('light-kit-model-home-') }), '');
  assert.equal(detectModel({ client: 'codex' }, { home: tmp('light-kit-model-home-') }), '');
  assert.equal(detectModel({}), '');
});

test('Copilot: a router selection names no model', () => {
  const home = tmp('light-kit-model-home-');
  const dir = join(home, '.copilot/session-state/abc');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'events.jsonl'), line({ type: 'session.start', data: { selectedModel: 'auto', reasoningEffort: 'high' } }));
  assert.equal(modelFromCopilotEvents(join(dir, 'events.jsonl')), '');
  assert.equal(detectModel({ client: 'copilot', payload: { sessionId: 'abc' } }, { home, env: {} }), '');
});
