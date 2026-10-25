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

test('lint catches unknown agent in a strategy', () => {
  const kit = loadKit();
  kit.strategies[0].body += '\n9. x — agent: nobody';
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
  assert.ok(existsSync(join(dir, '.light-kit/strategies/full.md')));
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
