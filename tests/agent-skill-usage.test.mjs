import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../tools/install.mjs';
import { CLIENT_NAMES } from '../tools/build.mjs';

function project(config) {
  const dir = mkdtempSync(join(tmpdir(), 'light-kit-agent-usage-'));
  install(dir, CLIENT_NAMES);
  if (config) writeFileSync(join(dir, '.light-kit/hooks.config.json'), JSON.stringify(config));
  return dir;
}
const withSpec = (dir, name = '001-x', step = 'implement') => {
  mkdirSync(join(dir, 'specs', name), { recursive: true });
  writeFileSync(join(dir, 'specs', name, '10-understanding.md'), '# u');
  writeFileSync(join(dir, 'specs', name, 'status.md'), `---\nworkflow: direct\nstep: ${step}\nstate: in-progress\n---\n`);
};
const run = (dir, payload, client = 'claude', event = 'post-tool') => spawnSync('node', [join(dir, '.light-kit/hooks/run.mjs'), '--client', client, '--event', event], {
  cwd: dir, input: JSON.stringify({ cwd: dir, ...payload }), encoding: 'utf8',
});
const agentCall = (name, id) => ({ tool_name: 'Agent', tool_input: { subagent_type: name, description: 'd', prompt: 'p' }, tool_use_id: id });
const skillCall = (name, id) => ({ tool_name: 'Skill', tool_input: { skill: name }, tool_use_id: id });
const statsOf = (dir) => JSON.parse(readFileSync(join(dir, '.light-kit/agent-skill-usage.json'), 'utf8'));
const tableOf = (dir) => readFileSync(join(dir, '.light-kit/agent-skill-usage.md'), 'utf8');

test('counts agent and skill calls of the active request in JSON and in the table', () => {
  const d = project(); withSpec(d);
  assert.equal(run(d, agentCall('light-developer', 'a1')).status, 0);
  run(d, skillCall('light-triage', 's1'));
  run(d, agentCall('light-developer', 'a2'));

  const stats = statsOf(d);
  assert.equal(stats.version, 1);
  assert.deepEqual(stats.requests['001-x'].agents, { 'light-developer': 2 });
  assert.deepEqual(stats.requests['001-x'].skills, { 'light-triage': 1 });
  assert.match(stats.requests['001-x'].first, /^\d{4}-\d\d-\d\dT/);

  const table = tableOf(d);
  assert.match(table, /^\| Request \| A: light-developer \| S: light-triage \|$/m);
  assert.match(table, /^\| 001-x \| 2 \| 1 \|$/m);
  assert.match(table, /^\| \*\*All requests\*\* \| 2 \| 1 \|$/m);
});

test('a re-delivered event id is counted once', () => {
  const d = project(); withSpec(d);
  run(d, agentCall('light-developer', 'same'));
  run(d, agentCall('light-developer', 'same'));
  run(d, agentCall('light-developer', 'other'));
  assert.deepEqual(statsOf(d).requests['001-x'].agents, { 'light-developer': 2 });
});

test('a call made before a request exists is reported under "(no request)"', () => {
  const d = project();
  run(d, skillCall('light-triage', 's1'));
  assert.deepEqual(statsOf(d).requests['(no request)'].skills, { 'light-triage': 1 });
  assert.match(tableOf(d), /^\| \(no request\) \| 1 \|$/m);
});

test('tool-name aliases and the input shape both identify a call', () => {
  const d = project(); withSpec(d);
  run(d, { tool_name: 'Task', tool_input: { subagent_type: 'light-reviewer' }, tool_use_id: 't1' });
  run(d, { toolName: 'runSubagent', toolArgs: { agent: 'light-tester' }, toolUseId: 't2' }, 'copilot');
  run(d, { tool_name: 'Review', tool_input: { skill: 'light-review-cycle' }, tool_use_id: 't3' }); // unknown tool, skill input
  run(d, { tool_name: 'Skill', tool_input: {}, tool_use_id: 't4' }); // no name to read
  const row = statsOf(d).requests['001-x'];
  assert.deepEqual(row.agents, { 'light-reviewer': 1, 'light-tester': 1 });
  assert.deepEqual(row.skills, { 'light-review-cycle': 1, unknown: 1 });
});

test('other tools write no statistics', () => {
  const d = project();
  run(d, { tool_name: 'Bash', tool_input: { command: 'ls' } });
  run(d, { tool_name: 'Read', tool_input: { file_path: 'a.txt' } });
  run(d, { tool_name: 'Write', tool_input: { file_path: 'a.txt', content: 'x' } });
  assert.equal(existsSync(join(d, '.light-kit/agent-skill-usage.json')), false);
  assert.equal(existsSync(join(d, '.light-kit/agent-skill-usage.md')), false);
});

test('a corrupt or unknown-version state restarts empty instead of failing', () => {
  for (const content of ['not json', '{"version":0,"requests":{}}']) {
    const d = project(); withSpec(d);
    writeFileSync(join(d, '.light-kit/agent-skill-usage.json'), content);
    const r = run(d, agentCall('light-developer', 'a1'));
    assert.equal(r.status, 0);
    assert.doesNotMatch(r.stderr, /agent-skill-usage errored/);
    assert.deepEqual(statsOf(d).requests['001-x'].agents, { 'light-developer': 1 });
  }
  // A malformed row is dropped; the readable rows survive.
  const d = project(); withSpec(d);
  writeFileSync(join(d, '.light-kit/agent-skill-usage.json'), '{"version":1,"requests":{"001-x":42,"002-y":{"agents":{"light-reviewer":3}}}}');
  const r = run(d, agentCall('light-developer', 'a1'));
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.stderr, /agent-skill-usage errored/);
  const stats = statsOf(d);
  assert.deepEqual(stats.requests['001-x'].agents, { 'light-developer': 1 });
  assert.deepEqual(stats.requests['002-y'].agents, { 'light-reviewer': 3 });
});

test('a user-level install in a project without .light-kit creates nothing', () => {
  const home = mkdtempSync(join(tmpdir(), 'light-kit-user-'));
  install(home, ['claude'], { level: 'user' });
  const proj = join(home, 'proj');
  mkdirSync(join(proj, '.git'), { recursive: true });
  withSpec(proj);
  spawnSync('node', [join(home, '.light-kit/hooks/run.mjs'), '--client', 'claude', '--event', 'post-tool'], {
    cwd: proj, input: JSON.stringify({ cwd: proj, ...agentCall('light-developer', 'a1') }), encoding: 'utf8',
  });
  assert.equal(existsSync(join(proj, '.light-kit')), false);
});

test('the hook can be switched off', () => {
  const d = project({ hooks: { 'agent-skill-usage': 'off' } }); withSpec(d);
  run(d, agentCall('light-developer', 'a1'));
  assert.equal(existsSync(join(d, '.light-kit/agent-skill-usage.json')), false);
});

test('the table keeps a column for every used name and shows a zero where a request has none', () => {
  const d = project(); withSpec(d, '001-x');
  run(d, agentCall('light-reviewer', 'a1'));
  run(d, skillCall('light-review', 's1'));
  writeFileSync(join(d, 'specs/001-x/status.md'), '---\nstep: conclude\nstate: done\n---\n');
  withSpec(d, '002-y');
  run(d, skillCall('light-triage', 's2'));

  const table = tableOf(d);
  assert.match(table, /^\| Request \| A: light-reviewer \| S: light-review \| S: light-triage \|$/m);
  assert.match(table, /^\| 001-x \| 1 \| 1 \| 0 \|$/m);
  assert.match(table, /^\| 002-y \| 0 \| 0 \| 1 \|$/m);
  assert.match(table, /^\| \*\*All requests\*\* \| 1 \| 1 \| 1 \|$/m);
});

test('the last table row totals every request', () => {
  const d = project(); withSpec(d, '001-x');
  run(d, agentCall('light-developer', 'a1'));
  writeFileSync(join(d, 'specs/001-x/status.md'), '---\nstep: conclude\nstate: done\n---\n');
  withSpec(d, '002-y');
  run(d, agentCall('light-developer', 'a2'));
  run(d, skillCall('light-review', 's1'));

  const table = tableOf(d);
  assert.match(table, /^\| 001-x \| 1 \| 0 \|$/m);
  assert.match(table, /^\| 002-y \| 1 \| 1 \|$/m);
  assert.match(table, /^\| \*\*All requests\*\* \| 2 \| 1 \|$/m);
});

test('an install ships the record command and tells the agent to use it', () => {
  const d = project();
  assert.ok(existsSync(join(d, '.light-kit/hooks/record-usage.mjs')));
  const instructions = readFileSync(join(d, 'CLAUDE.md'), 'utf8');
  assert.match(instructions, /hooks\/record-usage\.mjs <agent\|skill> <name>/);
  assert.match(instructions, /do not run it after a tool call the hook already counted/);
  // the installed copy runs as installed: generation must not break its first line
  const call = spawnSync('node', [join(d, '.light-kit/hooks/record-usage.mjs'), 'skill', 'light-rules'], { cwd: d, encoding: 'utf8' });
  assert.equal(call.status, 0, call.stderr);
  assert.deepEqual(statsOf(d).requests['(no request)'].skills, { 'light-rules': 1 });
});

test('the generated Claude hooks watch the agent and skill tools', () => {
  const d = project();
  const settings = JSON.parse(readFileSync(join(d, '.claude/settings.json'), 'utf8'));
  const post = settings.hooks.PostToolUse.flatMap((entry) => (entry.matcher ? entry.matcher.split('|') : []));
  for (const tool of ['Task', 'Agent', 'Skill']) assert.ok(post.includes(tool), tool);
});
