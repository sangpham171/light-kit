import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { backfill, callsIn, requestOf } from '../tools/backfill-usage.mjs';

const project = () => {
  const dir = mkdtempSync(join(tmpdir(), 'light-kit-backfill-'));
  mkdirSync(join(dir, '.light-kit'), { recursive: true });
  mkdirSync(join(dir, 'specs', '001-demo'), { recursive: true });
  return dir;
};

const event = (dir, timestamp, content, extra = {}) => JSON.stringify({
  type: 'assistant',
  timestamp,
  cwd: dir,
  message: { role: 'assistant', content },
  ...extra,
});
const agent = (id, prompt = 'Review request 001-demo') => ({ type: 'tool_use', id, name: 'Agent', input: { subagent_type: 'light-reviewer', description: 'Review', prompt } });
const skill = (id, name = 'light-rules') => ({ type: 'tool_use', id, name: 'Skill', input: { skill: name } });

const transcripts = (lines) => {
  const dir = mkdtempSync(join(tmpdir(), 'light-kit-transcripts-'));
  writeFileSync(join(dir, 'session.jsonl'), lines.join('\n') + '\n');
  return dir;
};

test('imports agent and skill calls, attributes them, and skips other projects and duplicates', () => {
  const root = project();
  const dir = transcripts([
    event(root, '2026-01-01T10:00:00.000Z', [agent('t1')]),
    event(root, '2026-01-01T10:01:00.000Z', [skill('t2')]),
    event(root, '2026-01-01T10:01:00.000Z', [agent('t1')], { isSidechain: true }),
    event('/elsewhere', '2026-01-01T10:02:00.000Z', [agent('t3')]),
  ]);
  const result = backfill({ root, transcripts: dir });
  assert.equal(result.added, 2);
  const stats = JSON.parse(readFileSync(join(root, '.light-kit/agent-skill-usage.json'), 'utf8'));
  assert.deepEqual(stats.requests['001-demo'].agents, { 'light-reviewer': 1 });
  assert.deepEqual(stats.requests['(no request)'].skills, { 'light-rules': 1 });
  const table = readFileSync(join(root, '.light-kit/agent-skill-usage.md'), 'utf8');
  assert.match(table, /\| 001-demo \| 1 \|/);
  assert.match(table, /S: light-rules/);

  // The imported request gets its own pair, limited to its row.
  const own = JSON.parse(readFileSync(join(root, 'specs/001-demo/agent-skill-usage.json'), 'utf8'));
  assert.deepEqual(Object.keys(own.requests), ['001-demo']);
  assert.deepEqual(own.requests['001-demo'].agents, { 'light-reviewer': 1 });
  assert.match(readFileSync(join(root, 'specs/001-demo/agent-skill-usage.md'), 'utf8'), /\| 001-demo \| 1 \|/);
});

test('a repeat run recreates a deleted per-request file', () => {
  const root = project();
  const dir = transcripts([event(root, '2026-01-01T10:00:00.000Z', [agent('t1')])]);
  assert.equal(backfill({ root, transcripts: dir }).added, 1);
  rmSync(join(root, 'specs/001-demo/agent-skill-usage.json'));
  assert.equal(backfill({ root, transcripts: dir }).added, 0);
  const own = JSON.parse(readFileSync(join(root, 'specs/001-demo/agent-skill-usage.json'), 'utf8'));
  assert.deepEqual(own.requests['001-demo'].agents, { 'light-reviewer': 1 });
});

test('a second run adds nothing and a dry run writes nothing', () => {
  const root = project();
  const dir = transcripts([event(root, '2026-01-01T10:00:00.000Z', [agent('t1')])]);
  const withStats = join(root, '.light-kit/agent-skill-usage.json');
  assert.equal(backfill({ root, transcripts: dir, dryRun: true }).added, 1);
  assert.throws(() => readFileSync(withStats), /ENOENT/);
  assert.equal(backfill({ root, transcripts: dir }).added, 1);
  assert.equal(backfill({ root, transcripts: dir }).added, 0);
});

test('the project switch turns the import off', () => {
  const root = project();
  const dir = transcripts([event(root, '2026-01-01T10:00:00.000Z', [agent('t1')])]);
  writeFileSync(join(root, '.light-kit/hooks.config.json'), JSON.stringify({ hooks: { 'agent-skill-usage': 'off' } }));
  const result = backfill({ root, transcripts: dir });
  assert.equal(result.disabled, true);
  assert.equal(result.added, 0);
  assert.equal(existsSync(join(root, '.light-kit/agent-skill-usage.json')), false);
  assert.equal(existsSync(join(root, 'specs/001-demo/agent-skill-usage.json')), false);
});

test('the CLI runs through a symlinked path (R-007)', () => {
  const root = project();
  const dir = transcripts([event(root, '2026-01-01T10:00:00.000Z', [agent('t1')])]);
  const link = join(mkdtempSync(join(tmpdir(), 'light-kit-link-')), 'backfill.mjs');
  symlinkSync(resolve('tools/backfill-usage.mjs'), link);
  const r = spawnSync('node', [link, '--root', root, '--transcripts', dir], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /imported 1 agent\/skill calls/);
  assert.ok(existsSync(join(root, '.light-kit/agent-skill-usage.json')));
  assert.ok(existsSync(join(root, 'specs/001-demo/agent-skill-usage.json')));
});

test('a call lands on the request it names, else under (no request)', () => {
  const root = project();
  assert.equal(requestOf({ prompt: 'Implement request 001-demo tasks' }, root), '001-demo');
  assert.equal(requestOf({ prompt: 'Implement request 999-missing tasks' }, root), '(no request)');
  assert.equal(requestOf({ skill: 'light-rules' }, root), '(no request)');
});

test('the scan keeps only agent and skill tool calls with a timestamp', () => {
  const root = project();
  const dir = transcripts([
    event(root, '2026-01-01T10:00:00.000Z', [{ type: 'tool_use', id: 'b1', name: 'Bash', input: { command: 'ls' } }]),
    event(root, '2026-01-01T10:01:00.000Z', [agent('a1'), skill('s1')]),
    JSON.stringify({ type: 'assistant', cwd: root, message: { content: [agent('a2')] } }),
  ]);
  const calls = callsIn(dir, root);
  assert.deepEqual(calls.map((c) => c.id), ['a1', 's1']);
});
