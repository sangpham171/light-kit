import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadKit, lint, build, CLIENT_NAMES, START, END } from '../tools/build.mjs';
import { install } from '../tools/install.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'light-kit-'));

test('kit lints clean', () => {
  assert.deepEqual(lint(loadKit()), []);
});

test('lint catches unknown agent in a workflow', () => {
  const kit = loadKit();
  kit.workflows[0].body += '\n9. x — agent: nobody';
  assert.match(lint(kit).join('\n'), /unknown agent nobody/);
});

test('every client produces agents, prompts and skills', () => {
  const kit = loadKit();
  for (const c of CLIENT_NAMES) {
    const paths = build(kit, [c]).map((f) => f.path);
    for (const a of kit.agents) assert.ok(paths.some((p) => p.includes(a.meta.name)), `${c}: agent ${a.meta.name}`);
    for (const p of kit.prompts) assert.ok(paths.some((x) => x.includes(`/${p.meta.name}.`)), `${c}: prompt ${p.meta.name}`);
    for (const s of kit.skills) assert.ok(paths.some((x) => x.includes(s.meta.name)), `${c}: skill ${s.meta.name}`);
  }
});

test('prompt argument placeholders are client specific', () => {
  const kit = loadKit();
  const get = (c, p) => build(kit, [c]).find((f) => f.path === p).content;
  assert.match(get('claude', '.claude/commands/request.md'), /\$ARGUMENTS/);
  assert.match(get('copilot', '.github/prompts/request.prompt.md'), /\$\{input:request/);
  assert.doesNotMatch(get('cursor', '.cursor/commands/request.md'), /\$ARGUMENTS/);
});

test('install into empty dir, then second run changes nothing', () => {
  const dir = tmp();
  const first = install(dir, CLIENT_NAMES);
  assert.ok(first.written.length > 30);
  assert.ok(existsSync(join(dir, '.claude/agents/orchestrator.md')));
  assert.ok(existsSync(join(dir, '.light-kit/workflows/full.md')));
  const second = install(dir, CLIENT_NAMES);
  assert.equal(second.written.length, 0);
});

test('existing instruction files are preserved', () => {
  const dir = tmp();
  mkdirSync(join(dir, '.github'));
  writeFileSync(join(dir, 'CLAUDE.md'), '# Mine\nkeep this\n');
  writeFileSync(join(dir, '.github/copilot-instructions.md'), 'copilot mine\n');
  install(dir, ['claude', 'copilot']);
  const claude = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claude, /^# Mine\nkeep this\n/);
  assert.ok(claude.includes(START) && claude.includes(END));
  const before = claude;
  install(dir, ['claude', 'copilot']);
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), before);
});

test('unmanaged files are skipped, not overwritten', () => {
  const dir = tmp();
  mkdirSync(join(dir, '.claude/agents'), { recursive: true });
  writeFileSync(join(dir, '.claude/agents/developer.md'), 'my own developer agent');
  const r = install(dir, ['claude']);
  assert.ok(r.skipped.includes('.claude/agents/developer.md'));
  assert.equal(readFileSync(join(dir, '.claude/agents/developer.md'), 'utf8'), 'my own developer agent');
});

test('dry run writes nothing', () => {
  const dir = tmp();
  install(dir, ['claude'], { dryRun: true });
  assert.equal(existsSync(join(dir, 'CLAUDE.md')), false);
});

test('re-install keeps a filled-in project profile', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const profile = join(dir, '.light-kit/project-profile.md');
  writeFileSync(profile, '# Project profile\nTypeScript, vitest\n');
  install(dir, ['claude']);
  assert.match(readFileSync(profile, 'utf8'), /TypeScript, vitest/);
  assert.doesNotMatch(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), /Languages and frameworks/);
});

test('bootstrap workflow and prompt are generated', () => {
  const dir = tmp();
  install(dir, ['claude']);
  assert.ok(existsSync(join(dir, '.light-kit/workflows/bootstrap.md')));
  assert.ok(existsSync(join(dir, '.claude/commands/bootstrap.md')));
  assert.ok(existsSync(join(dir, '.claude/skills/codebase-map/SKILL.md')));
});

test('adopt assessment: skill, standardize workflow and command are generated and wired', () => {
  const dir = tmp();
  install(dir, ['claude']);
  assert.ok(existsSync(join(dir, '.claude/skills/project-assessment/SKILL.md')));
  assert.ok(existsSync(join(dir, '.light-kit/workflows/standardize.md')));
  assert.ok(existsSync(join(dir, '.claude/commands/standardize.md')));
  const init = readFileSync(join(dir, '.claude/commands/init.md'), 'utf8');
  assert.match(init, /project-assessment/);
  assert.match(init, /Do not change any project code now/);
  const skill = readFileSync(join(dir, '.claude/skills/project-assessment/SKILL.md'), 'utf8');
  assert.match(skill, /Never propose:\*\* refactors/);
  assert.match(skill, /Behavior-preserving/);
});

test('tech debt and review cycle: skills, workflow steps, templates and config are wired', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  assert.match(read('.claude/skills/tech-debt/SKILL.md'), /Resolve it/);
  assert.match(read('.claude/skills/tech-debt/SKILL.md'), /Defer only with a reason/);
  const cycle = read('.claude/skills/review-cycle/SKILL.md');
  assert.match(cycle, /default \*\*1\*\*/);
  assert.match(cycle, /Stop early/);
  assert.match(cycle, /--review-turns N/);
  for (const w of ['direct', 'standard', 'full', 'bootstrap', 'standardize']) {
    const text = read(`.light-kit/workflows/${w}.md`);
    assert.match(text, /implement — agent: developer — skill: tech-debt/, w);
    assert.match(text, /fix — agent: developer — skill: review-cycle/, w);
  }
  assert.match(read('.light-kit/workflows/standardize.md'), /never fix debt beyond the accepted items/);
  assert.match(read('.light-kit/templates/50-implementation.md'), /## Technical debt/);
  assert.match(read('.light-kit/templates/50-implementation.md'), /## Review rounds/);
  assert.match(read('.light-kit/templates/60-conclusion.md'), /Deferred technical debt and open findings/);
  assert.match(read('.light-kit/templates/status.md'), /review_turns/);
  assert.match(read('.light-kit/project-profile.md'), /Review turns: 1/);
  assert.match(read('.claude/commands/request.md'), /--review-turns/);
  assert.match(read('.claude/commands/init.md'), /review turns/);
  assert.match(read('.claude/agents/developer.md'), /tech-debt/);
  assert.match(read('.claude/agents/developer.md'), /review-cycle/);
  assert.match(read('.claude/agents/reviewer.md'), /Technical debt/);
  assert.match(read('.claude/agents/orchestrator.md'), /Review turns/);
  assert.match(read('.claude/agents/tech-writer.md'), /Deferred technical debt/);
  assert.match(read('CLAUDE.md'), /Finish properly/);
});

test('concise communication rules live in the global instructions of every client, not in each agent', () => {
  const dir = tmp();
  install(dir, ['claude', 'codex', 'cursor']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  for (const f of ['CLAUDE.md', 'AGENTS.md']) {
    assert.match(read(f), /## Communication \(saves tokens\)/, f);
    assert.match(read(f), /no greetings, praise, apologies, filler/, f);
    assert.match(read(f), /Never trade clarity or safety for brevity/, f);
  }
  // stated once in the global instructions, not repeated in each agent
  for (const a of ['orchestrator', 'developer', 'reviewer', 'tech-writer']) assert.doesNotMatch(read(`.claude/agents/${a}.md`), /Be concise/, a);
  assert.match(read('.cursor/rules/light-kit-core.mdc') ?? '', /Communication/);
  assert.match(read('.light-kit/project-profile.md'), /Style: concise/);
  const home = tmp();
  install(home, ['claude'], { level: 'user' });
  assert.match(readFileSync(join(home, '.claude/CLAUDE.md'), 'utf8'), /## Communication \(saves tokens\)/);
});
