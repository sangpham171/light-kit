import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve('kit/hooks/record-usage.mjs');

const project = () => {
  const dir = mkdtempSync(join(tmpdir(), 'light-kit-record-'));
  mkdirSync(join(dir, '.light-kit'), { recursive: true });
  return dir;
};
const request = (root, name, state = 'in progress') => {
  mkdirSync(join(root, 'specs', name), { recursive: true });
  writeFileSync(join(root, 'specs', name, '00-request.md'), '# request');
  writeFileSync(join(root, 'specs', name, '10-understanding.md'), '# understanding');
  writeFileSync(join(root, 'specs', name, 'status.md'), `---\nworkflow: direct\nstep: implement\nstate: ${state}\n---\n`);
};
const run = (args, cwd) => spawnSync('node', [SCRIPT, ...args], { cwd, encoding: 'utf8' });
const statsOf = (root) => JSON.parse(readFileSync(join(root, '.light-kit/agent-skill-usage.json'), 'utf8'));
const tableOf = (root) => readFileSync(join(root, '.light-kit/agent-skill-usage.md'), 'utf8');
const requestStatsOf = (root, name) => JSON.parse(readFileSync(join(root, 'specs', name, 'agent-skill-usage.json'), 'utf8'));

test('records a skill and an agent under the working request, in JSON and in the table', () => {
  const root = project(); request(root, '001-demo');
  assert.equal(run(['skill', 'light-rules', '--root', root], root).status, 0);
  const agent = run(['agent', 'light-reviewer', '--root', root], root);
  assert.equal(agent.status, 0);
  assert.match(agent.stdout, /recorded agent light-reviewer for 001-demo/);
  const stats = statsOf(root);
  assert.deepEqual(stats.requests['001-demo'].skills, { 'light-rules': 1 });
  assert.deepEqual(stats.requests['001-demo'].agents, { 'light-reviewer': 1 });
  const table = tableOf(root);
  assert.match(table, /A: light-reviewer/);
  assert.match(table, /S: light-rules/);
  assert.match(table, /\| 001-demo \| 1 \| 1 \|/);
  // The request folder gets the same counts, limited to that request.
  const own = requestStatsOf(root, '001-demo');
  assert.deepEqual(Object.keys(own.requests), ['001-demo']);
  assert.deepEqual(own.requests['001-demo'].skills, { 'light-rules': 1 });
  assert.deepEqual(own.requests['001-demo'].agents, { 'light-reviewer': 1 });
});

test('a use with no active request is reported under (no request)', () => {
  const root = project();
  assert.equal(run(['skill', 'light-triage', '--root', root], root).status, 0);
  assert.deepEqual(statsOf(root).requests['(no request)'].skills, { 'light-triage': 1 });
  assert.equal(existsSync(join(root, 'specs')), false);
});

test('--request names the request even when the folder is not the working one', () => {
  const root = project(); request(root, '001-demo'); request(root, '002-done', 'done');
  const result = run(['agent', 'light-tester', '--root', root, '--request', '002-done'], root);
  assert.equal(result.status, 0);
  assert.deepEqual(statsOf(root).requests['002-done'].agents, { 'light-tester': 1 });
  assert.deepEqual(requestStatsOf(root, '002-done').requests['002-done'].agents, { 'light-tester': 1 });
  assert.equal(existsSync(join(root, 'specs/001-demo/agent-skill-usage.json')), false);
});

test('--id counts a use once, like the hook', () => {
  const root = project(); request(root, '001-demo');
  assert.equal(run(['agent', 'light-reviewer', '--root', root, '--id', 'call-1'], root).status, 0);
  const again = run(['agent', 'light-reviewer', '--root', root, '--id', 'call-1'], root);
  assert.equal(again.status, 0);
  assert.match(again.stdout, /already recorded/);
  assert.equal(statsOf(root).requests['001-demo'].agents['light-reviewer'], 1);
});

test('the nearest project is used when run from a subfolder', () => {
  const root = project(); request(root, '001-demo');
  const result = run(['skill', 'light-rules'], join(root, 'specs', '001-demo'));
  assert.equal(result.status, 0);
  assert.deepEqual(statsOf(root).requests['001-demo'].skills, { 'light-rules': 1 });
});

test('the project switch turns the command off', () => {
  const root = project(); request(root, '001-demo');
  writeFileSync(join(root, '.light-kit/hooks.config.json'), JSON.stringify({ hooks: { 'agent-skill-usage': 'off' } }));
  const r = run(['agent', 'light-reviewer', '--root', root], root);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /is off/);
  assert.equal(existsSync(join(root, '.light-kit/agent-skill-usage.json')), false);
  assert.equal(existsSync(join(root, 'specs/001-demo/agent-skill-usage.json')), false);
});

test('bad arguments change nothing and exit non-zero', () => {
  const root = project(); request(root, '001-demo');
  assert.equal(run(['tool', 'x', '--root', root], root).status, 1);
  assert.equal(run(['agent', '--root', root], root).status, 1);
  assert.equal(run(['agent', 'x', '--root', root, '--nope'], root).status, 1);
  assert.equal(run(['agent', 'x', '--root', root, '--request', '999-missing'], root).status, 1);
  assert.equal(existsSync(join(root, '.light-kit/agent-skill-usage.json')), false);
  const outside = mkdtempSync(join(tmpdir(), 'light-kit-outside-'));
  const none = run(['agent', 'x'], outside);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /not in a light-kit project/);
});
