import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import { bumpVersion, collect, runVersionBump } from '../tools/version-bump.mjs';

const roots = [];
test.after(() => { for (const root of roots) rmSync(root, { recursive: true, force: true }); });

function fixture({ version = '0.1.0', specs = [], baseline = 51, commit = false, state = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'light-kit-version-'));
  roots.push(root);
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'light-kit', version }, null, 2) + '\n');
  mkdirSync(join(root, '.light-kit'), { recursive: true });
  if (state) {
    writeFileSync(join(root, '.light-kit', 'version-bump.json'),
      JSON.stringify({ version: 1, baseline, commit, applied: {} }, null, 2) + '\n');
  }
  for (const spec of specs) addSpec(root, spec);
  return root;
}

function addSpec(root, { number, state = 'done', bump }) {
  const name = `${String(number).padStart(3, '0')}-example`;
  mkdirSync(join(root, 'specs', name), { recursive: true });
  const lines = ['---', `request: ${name}`, `state: ${state}`];
  if (bump !== undefined) lines.push(`version_bump: ${bump}`);
  lines.push('---', '');
  writeFileSync(join(root, 'specs', name, 'status.md'), lines.join('\n'));
}

const versionOf = (root) => JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const stateOf = (root) => JSON.parse(readFileSync(join(root, '.light-kit', 'version-bump.json'), 'utf8'));

function initRepo(root, branch) {
  spawnSync('git', ['init', '-q'], { cwd: root });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  spawnSync('git', ['config', 'user.name', 'Test'], { cwd: root });
  spawnSync('git', ['checkout', '-q', '-B', branch], { cwd: root });
  spawnSync('git', ['add', '-A'], { cwd: root });
  spawnSync('git', ['commit', '-q', '-m', 'init'], { cwd: root });
}

test('bumpVersion applies semver reset rules', () => {
  assert.equal(bumpVersion('0.1.0', 'patch'), '0.1.1');
  assert.equal(bumpVersion('0.1.1', 'minor'), '0.2.0');
  assert.equal(bumpVersion('0.2.3', 'major'), '1.0.0');
  assert.equal(bumpVersion('1.9.9', 'patch'), '1.9.10');
  assert.equal(bumpVersion('1.2.3-beta', 'patch'), null);
  assert.equal(bumpVersion('nope', 'patch'), null);
});

test('collect reads request numbers and status front matter in numeric order', () => {
  const root = fixture({ specs: [{ number: 53, bump: 'patch' }, { number: 52, state: 'done', bump: 'minor' }] });
  const specs = collect(root);
  assert.deepEqual(specs.map((s) => s.number), [52, 53]);
  assert.equal(specs[0].level, 'minor');
  assert.equal(specs[0].state, 'done');
});

test('applies the declared level of a finished request above the baseline', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'minor' }] });
  const result = runVersionBump(root);
  assert.equal(result.changed, true);
  assert.equal(result.version, '0.2.0');
  assert.equal(versionOf(root), '0.2.0');
  assert.deepEqual(stateOf(root).applied, { 52: '0.2.0' });
});

test('rewrites only the version value and keeps the rest of package.json as it was', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'patch' }] });
  writeFileSync(join(root, 'package.json'),
    '{\n  "name": "light-kit",\n  "version": "0.1.0",\n  "scripts": { "test": "node --test" }\n}\n');
  runVersionBump(root);
  const text = readFileSync(join(root, 'package.json'), 'utf8');
  assert.match(text, /"version": "0\.1\.1"/);
  assert.match(text, /"scripts": \{ "test": "node --test" \}/);
  assert.equal(text.endsWith('\n'), true);
});

test('ignores requests at or below the baseline and unfinished requests', () => {
  const root = fixture({ specs: [{ number: 51, bump: 'major' }, { number: 52, state: 'in-progress', bump: 'major' }] });
  const result = runVersionBump(root);
  assert.equal(result.changed, false);
  assert.equal(versionOf(root), '0.1.0');
});

test('missing or invalid level bumps the patch', () => {
  const root = fixture({ specs: [{ number: 52 }, { number: 53, bump: 'epic' }] });
  runVersionBump(root);
  assert.equal(versionOf(root), '0.1.2');
  assert.deepEqual(stateOf(root).applied, { 52: '0.1.1', 53: '0.1.2' });
});

test('applies several finished requests in numeric order, not folder order', () => {
  const root = fixture({ specs: [{ number: 53, bump: 'patch' }, { number: 52, bump: 'minor' }] });
  runVersionBump(root);
  assert.equal(versionOf(root), '0.2.1');
});

test('a second run does not bump twice', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'patch' }] });
  runVersionBump(root);
  const again = runVersionBump(root);
  assert.equal(again.changed, false);
  assert.equal(versionOf(root), '0.1.1');
});

test('a status file without front matter is not finished', () => {
  const root = fixture();
  mkdirSync(join(root, 'specs', '052-example'), { recursive: true });
  writeFileSync(join(root, 'specs', '052-example', 'status.md'), 'state: done\n');
  assert.equal(runVersionBump(root).changed, false);
  assert.equal(versionOf(root), '0.1.0');
});

test('a missing state file seeds the baseline at the newest request without bumping', () => {
  const root = fixture({ state: false, specs: [{ number: 52, bump: 'major' }] });
  const result = runVersionBump(root);
  assert.equal(result.changed, false);
  assert.equal(result.seeded, 52);
  assert.equal(versionOf(root), '0.1.0');
  assert.equal(stateOf(root).baseline, 52);
});

test('malformed applied rows are dropped, never thrown on', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'patch' }] });
  writeFileSync(join(root, '.light-kit', 'version-bump.json'),
    JSON.stringify({ version: 1, baseline: 51, commit: false, applied: { 52: 7, nope: 'x' } }));
  const result = runVersionBump(root);
  assert.equal(result.changed, true);
  assert.equal(versionOf(root), '0.1.1');
});

test('an unusable package version leaves the file untouched', () => {
  const root = fixture({ version: 'banana', specs: [{ number: 52, bump: 'patch' }] });
  const result = runVersionBump(root);
  assert.equal(result.changed, false);
  assert.equal(versionOf(root), 'banana');
});

test('does nothing when package.json is not light-kit', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'major' }] });
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'other', version: '1.0.0' }, null, 2) + '\n');
  assert.equal(runVersionBump(root).changed, false);
  assert.equal(versionOf(root), '1.0.0');
});

test('a dry run reports the bump without writing', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'minor' }] });
  const result = runVersionBump(root, { apply: false });
  assert.equal(result.changed, true);
  assert.equal(versionOf(root), '0.1.0');
  assert.deepEqual(stateOf(root).applied, {});
});

test('the CLI entry stays silent and exits 0 on a dry run', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'minor' }] });
  mkdirSync(join(root, 'tools'), { recursive: true });
  copyFileSync(new URL('../tools/version-bump.mjs', import.meta.url), join(root, 'tools', 'version-bump.mjs'));
  const run = spawnSync(process.execPath, ['tools/version-bump.mjs', '--dry-run'], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 0);
  assert.match(run.stderr, /would set 0\.2\.0/);
  assert.equal(run.stdout, '');
  assert.equal(versionOf(root), '0.1.0');
});

test('commits only package.json and the state file as a release', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'minor' }], commit: true });
  initRepo(root, 'feat/test');
  runVersionBump(root);
  const subject = spawnSync('git', ['log', '-1', '--pretty=%s'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  assert.equal(subject, 'chore(release): v0.2.0');
  const dirty = spawnSync('git', ['status', '--porcelain', '--', 'package.json', '.light-kit/version-bump.json'],
    { cwd: root, encoding: 'utf8' }).stdout;
  assert.equal(dirty, '');
});

test('a protected branch gets the bump but no commit', () => {
  const root = fixture({ specs: [{ number: 52, bump: 'patch' }], commit: true });
  initRepo(root, 'main');
  runVersionBump(root);
  const subject = spawnSync('git', ['log', '-1', '--pretty=%s'], { cwd: root, encoding: 'utf8' }).stdout.trim();
  assert.equal(subject, 'init');
  assert.equal(versionOf(root), '0.1.1');
});
