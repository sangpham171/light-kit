import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../tools/install.mjs';
import { loadKit, lint, CLIENT_NAMES } from '../tools/build.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'light-kit-models-'));
const read = (d, p) => readFileSync(join(d, p), 'utf8');

test('an empty models.json is seeded once and the user\'s table is never overwritten', () => {
  const d = tmp();
  install(d, CLIENT_NAMES);
  const cfg = JSON.parse(read(d, '.light-kit/models.json'));
  assert.deepEqual([cfg.easy, cfg.medium, cfg.hard], ['', '', '']);
  assert.deepEqual(Object.keys(cfg.claude), ['easy', 'medium', 'hard']);
  writeFileSync(join(d, '.light-kit/models.json'), JSON.stringify({ easy: 'small', medium: 'mid', hard: 'big' }));
  install(d, CLIENT_NAMES);
  assert.deepEqual(JSON.parse(read(d, '.light-kit/models.json')), { easy: 'small', medium: 'mid', hard: 'big' });
  assert.ok(existsSync(join(d, '.light-kit/templates/models.json')));
});

test('agents carry no model and no level, whatever the table says: routing happens per call', () => {
  const d = tmp();
  install(d, CLIENT_NAMES);
  writeFileSync(join(d, '.light-kit/models.json'), JSON.stringify({ easy: 'small', medium: 'mid', hard: 'big', claude: { hard: 'c-big' } }));
  install(d, CLIENT_NAMES);
  for (const f of ['.claude/agents/light-developer.md', '.claude/agents/light-architect.md', '.github/agents/light-reviewer.agent.md', '.cursor/rules/light-developer.mdc'])
    assert.doesNotMatch(read(d, f), /^(model|level):/m, f);
  for (const a of ['developer', 'architect', 'reviewer']) assert.doesNotMatch(read(d, `.codex/agents/light-${a}.toml`), /^(model|level) ?=/m, a);
  for (const a of loadKit().agents) assert.equal(a.meta.level, undefined, `${a.file} must not define a level`);
  assert.equal(install(d, CLIENT_NAMES).written.length, 0);
});

test('user level: the table lives in ~/.light-kit', () => {
  const h = tmp();
  install(h, ['claude'], { level: 'user' });
  assert.ok(existsSync(join(h, '.light-kit/models.json')));
  assert.doesNotMatch(read(h, '.claude/agents/light-reviewer.md'), /^model:/m);
});

test('workflow steps carry no fixed level: difficulty is rated per request', () => {
  const d = tmp();
  install(d, CLIENT_NAMES);
  for (const w of ['direct', 'standard', 'full', 'bootstrap', 'standardize'])
    assert.doesNotMatch(read(d, `.light-kit/workflows/${w}.md`), /level:/, w);
  assert.deepEqual(lint(loadKit()), []); // and lint no longer asks for one
  const understanding = read(d, '.light-kit/templates/10-understanding.md');
  assert.match(understanding, /## Routing/);
  assert.match(understanding, /step: easy\|medium\|hard — reason/);
});

test('the routing skill, plan template, tech-lead and orchestrator describe per-task routing', () => {
  const d = tmp();
  install(d, ['claude']);
  const skill = read(d, '.claude/skills/light-model-routing/SKILL.md');
  assert.match(skill, /\.light-kit\/models\.json/);
  assert.match(skill, /agents and workflow steps carry no tier/);
  assert.match(skill, /Rate dynamically, from the request/);
  assert.match(skill, /rate \*\*every step of the chosen workflow for this request\*\*/);
  assert.match(skill, /`## Routing` section in `10-understanding\.md`/);
  assert.match(skill, /A driving score of 2 points to hard, 1 to medium, all 0 to easy/);
  assert.match(skill, /Re-rate when facts change/);
  assert.match(skill, /You may lower a step rating you made yourself/);
  assert.match(skill, /model parameter of the subagent call/);
  assert.match(skill, /never lower one the tech-lead set/);
  assert.match(skill, /one tier higher/);
  assert.match(skill, /Never go down on a retry/);
    assert.match(skill, /main session/);
  assert.match(skill, /say so once/);
  assert.match(skill, /Empty tier: do not pass a model/);
  assert.match(read(d, '.light-kit/templates/40-plan.md'), /level: easy\|medium\|hard/);
  assert.match(read(d, '.claude/agents/light-tech-lead.md'), /`level`/);
  const orch = read(d, '.claude/agents/light-orchestrator.md');
  assert.match(orch, /same agent can run on a different model for each task/);
  assert.match(orch, /rate every step of the chosen workflow for this request/);
  assert.match(orch, /`light-model-routing` skill/);
  assert.match(read(d, '.claude/skills/light-init/SKILL.md'), /models\.json/);
});
