import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
// The kit is installed in `installDir`; the action (and the request) lives in `cwd`.
const runIn = (installDir, cwd, payload) => spawnSync('node', [join(installDir, '.light-kit/hooks/run.mjs'), '--client', 'claude', '--event', 'post-tool'], {
  cwd, input: JSON.stringify({ cwd, ...payload }), encoding: 'utf8',
});
const agentCall = (name, id, prompt = 'p') => ({ tool_name: 'Agent', tool_input: { subagent_type: name, description: 'd', prompt }, tool_use_id: id });
const skillCall = (name, id) => ({ tool_name: 'Skill', tool_input: { skill: name }, tool_use_id: id });
const writeCall = (file) => ({ tool_name: 'Write', tool_input: { file_path: file, content: 'x' } });
const stop = (dir) => spawnSync('node', [join(dir, '.light-kit/hooks/run.mjs'), '--client', 'claude', '--event', 'stop'], {
  cwd: dir, input: JSON.stringify({ cwd: dir }), encoding: 'utf8',
});
const artifact = (dir, request, file, agents) => {
  const runs = agents
    .map((agent) => `  - agent: ${agent}\n    part: work\n    model: m\n    thinking: unknown\n    level: medium`)
    .join('\n');
  const path = join(dir, 'specs', request, file);
  writeFileSync(path, `---\nstep: ${file.slice(0, 2)}-${file.slice(3, -3)}\nruns:\n${runs}\nusage:\n  tokens: unknown\n  time: unknown\n---\n\n# Work\n`);
  return path;
};
const statsOf = (dir) => JSON.parse(readFileSync(join(dir, '.light-kit/agent-skill-usage.json'), 'utf8'));
const tableOf = (dir) => readFileSync(join(dir, '.light-kit/agent-skill-usage.md'), 'utf8');
const requestStatsOf = (dir, name) => JSON.parse(readFileSync(join(dir, 'specs', name, 'agent-skill-usage.json'), 'utf8'));
const requestTableOf = (dir, name) => readFileSync(join(dir, 'specs', name, 'agent-skill-usage.md'), 'utf8');

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

  // The request folder carries the same counts, limited to that request.
  const own = requestStatsOf(d, '001-x');
  assert.deepEqual(Object.keys(own.requests), ['001-x']);
  assert.deepEqual(own.requests['001-x'].agents, { 'light-developer': 2 });
  assert.deepEqual(own.requests['001-x'].skills, { 'light-triage': 1 });
  const ownTable = requestTableOf(d, '001-x');
  assert.match(ownTable, /^\| 001-x \| 2 \| 1 \|$/m);
  assert.match(ownTable, /^\| \*\*Total\*\* \| 2 \| 1 \|$/m);
  assert.doesNotMatch(ownTable, /All requests/);
});

test('each request folder keeps its own usage, untouched by another request', () => {
  const d = project(); withSpec(d, '001-x');
  run(d, agentCall('light-developer', 'a1'));
  writeFileSync(join(d, 'specs/001-x/status.md'), '---\nstep: conclude\nstate: done\n---\n');
  withSpec(d, '002-y');
  run(d, skillCall('light-triage', 's1'));

  const first = requestStatsOf(d, '001-x');
  assert.deepEqual(Object.keys(first.requests), ['001-x']);
  assert.deepEqual(first.requests['001-x'].agents, { 'light-developer': 1 });
  assert.deepEqual(first.requests['001-x'].skills, {});
  const second = requestStatsOf(d, '002-y');
  assert.deepEqual(Object.keys(second.requests), ['002-y']);
  assert.deepEqual(second.requests['002-y'].skills, { 'light-triage': 1 });
  assert.deepEqual(second.requests['002-y'].agents, {});
  assert.doesNotMatch(requestTableOf(d, '001-x'), /light-triage/);
  assert.doesNotMatch(requestTableOf(d, '002-y'), /light-developer/);
});

test('a corrupt per-request file is replaced by the aggregate view instead of failing', () => {
  const d = project(); withSpec(d);
  run(d, agentCall('light-reviewer', 'a1'));
  run(d, agentCall('light-reviewer', 'a2'));
  writeFileSync(join(d, 'specs/001-x/agent-skill-usage.json'), 'not json');
  const r = run(d, agentCall('light-developer', 'a3'));
  assert.equal(r.status, 0);
  assert.doesNotMatch(r.stderr, /agent-skill-usage errored/);
  assert.deepEqual(requestStatsOf(d, '001-x').requests['001-x'].agents, { 'light-reviewer': 2, 'light-developer': 1 });
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
  assert.equal(existsSync(join(d, 'specs', '(no request)')), false);
  assert.equal(existsSync(join(d, 'specs/agent-skill-usage.json')), false);
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

test('a nested project keeps its usage in its own .light-kit and request folder', () => {
  const d = project();
  const proj = join(d, 'proj');
  mkdirSync(join(proj, '.light-kit'), { recursive: true });
  withSpec(proj);
  assert.equal(runIn(d, proj, agentCall('light-developer', 'a1')).status, 0);

  assert.deepEqual(JSON.parse(readFileSync(join(proj, '.light-kit/agent-skill-usage.json'), 'utf8')).requests['001-x'].agents, { 'light-developer': 1 });
  assert.equal(existsSync(join(d, '.light-kit/agent-skill-usage.json')), false);
  assert.deepEqual(requestStatsOf(proj, '001-x').requests['001-x'].agents, { 'light-developer': 1 });

  // No request in a second project: the aggregate is written there, but nothing under specs/.
  const other = join(d, 'other');
  mkdirSync(join(other, '.light-kit'), { recursive: true });
  assert.equal(runIn(d, other, skillCall('light-rules', 's1')).status, 0);
  assert.deepEqual(JSON.parse(readFileSync(join(other, '.light-kit/agent-skill-usage.json'), 'utf8')).requests['(no request)'].skills, { 'light-rules': 1 });
  assert.equal(existsSync(join(other, 'specs/agent-skill-usage.json')), false);
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
  assert.equal(existsSync(join(d, 'specs/001-x/agent-skill-usage.json')), false);
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
  assert.match(instructions, /do not run it for a use the hook already derived/);
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

test('an agent credited by an artifact header is counted even when no tool call ran', () => {
  const d = project(); withSpec(d);
  const file = artifact(d, '001-x', '50-implementation.md', ['light-developer']);
  const r = run(d, writeCall(file));
  assert.equal(r.status, 0);
  assert.deepEqual(statsOf(d).requests['001-x'].agents, { 'light-developer': 1 });
  assert.deepEqual(requestStatsOf(d, '001-x').requests['001-x'].agents, { 'light-developer': 1 });
  assert.match(requestTableOf(d, '001-x'), /A: light-developer/);
});

test('a header run already counted by an Agent call is not counted twice', () => {
  const d = project(); withSpec(d);
  run(d, agentCall('light-developer', 'a1'));
  const file = artifact(d, '001-x', '50-implementation.md', ['light-developer']);
  run(d, writeCall(file));
  assert.equal(statsOf(d).requests['001-x'].agents['light-developer'], 1);
});

test('a manual record and the matching header count once', () => {
  const d = project(); withSpec(d);
  spawnSync('node', [join(d, '.light-kit/hooks/record-usage.mjs'), 'agent', 'light-developer', '--request', '001-x'], { cwd: d });
  const file = artifact(d, '001-x', '50-implementation.md', ['light-developer']);
  run(d, writeCall(file));
  assert.equal(statsOf(d).requests['001-x'].agents['light-developer'], 1);
});

test('one count per header run, including repeated agents', () => {
  const d = project(); withSpec(d);
  const file = artifact(d, '001-x', '50-implementation.md', ['light-developer', 'light-developer']);
  run(d, writeCall(file));
  assert.equal(statsOf(d).requests['001-x'].agents['light-developer'], 2);
});

test('a call is attributed to the request its prompt names, not the most recently touched one', () => {
  const d = project(); withSpec(d, '001-x'); withSpec(d, '002-y');
  const later = new Date(Date.now() + 5000);
  utimesSync(join(d, 'specs/001-x'), later, later); // the old fallback would pick 001-x
  run(d, agentCall('light-reviewer', 'r1', 'Review request specs/002-y (standard workflow).'));
  const stats = statsOf(d);
  assert.deepEqual(stats.requests['002-y'].agents, { 'light-reviewer': 1 });
  assert.equal(stats.requests['001-x'], undefined);
});

test('reading an installed skill file counts as a skill use', () => {
  const d = project(); withSpec(d);
  const file = join(d, '.claude/skills/light-commit/SKILL.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, '# skill\n');
  run(d, { tool_name: 'Read', tool_input: { file_path: file }, tool_use_id: 'read-1' });
  assert.deepEqual(statsOf(d).requests['001-x'].skills, { 'light-commit': 1 });
});

test('the kit source layout is not an installed skill file', () => {
  const d = project(); withSpec(d);
  const file = join(d, 'kit/skills/light-commit/SKILL.md');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, '# source\n');
  run(d, { tool_name: 'Read', tool_input: { file_path: file }, tool_use_id: 'read-2' });
  assert.equal(existsSync(join(d, '.light-kit/agent-skill-usage.json')), false);
});

test('an artifact with no runs header writes no statistics', () => {
  const d = project(); withSpec(d);
  const file = join(d, 'specs/001-x/50-implementation.md');
  writeFileSync(file, '---\nstep: 50-implementation\n---\n\n# Work\n');
  run(d, writeCall(file));
  assert.equal(existsSync(join(d, '.light-kit/agent-skill-usage.json')), false);
});

test('stop reconciles tracked and active requests but does not invent history for finished ones', () => {
  const d = project();
  withSpec(d, '002-tracked');
  run(d, agentCall('light-reviewer', 'r1'));
  artifact(d, '002-tracked', '50-implementation.md', ['light-developer']);
  writeFileSync(join(d, 'specs/002-tracked/status.md'), '---\nstep: conclude\nstate: done\n---\n');

  withSpec(d, '001-active');
  artifact(d, '001-active', '30-design.md', ['light-architect']);

  withSpec(d, '003-done');
  artifact(d, '003-done', '50-implementation.md', ['light-tester']);
  writeFileSync(join(d, 'specs/003-done/status.md'), '---\nstep: conclude\nstate: done\n---\n');

  assert.equal(stop(d).status, 0);
  const stats = statsOf(d);
  assert.deepEqual(stats.requests['002-tracked'].agents, { 'light-reviewer': 1, 'light-developer': 1 });
  assert.deepEqual(stats.requests['001-active'].agents, { 'light-architect': 1 });
  assert.equal(stats.requests['003-done'], undefined);
  assert.deepEqual(requestStatsOf(d, '002-tracked').requests['002-tracked'].agents, { 'light-reviewer': 1, 'light-developer': 1 });
  assert.deepEqual(requestStatsOf(d, '001-active').requests['001-active'].agents, { 'light-architect': 1 });
});

test('the stop reconciliation is switched off with the rest of the hook', () => {
  const d = project({ hooks: { 'agent-skill-usage': 'off' } }); withSpec(d);
  artifact(d, '001-x', '50-implementation.md', ['light-developer']);
  stop(d);
  assert.equal(existsSync(join(d, '.light-kit/agent-skill-usage.json')), false);
});
