import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mergeProject, mergeMarkdown, mergeJson } from '../kit/init/merge.mjs';
import { install } from '../tools/install.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'light-kit-init-'));
const read = (dir, p) => readFileSync(join(dir, p), 'utf8');
const write = (dir, p, text) => writeFileSync(join(dir, p), text);
const templatesWith = (dir, file, text) => {
  const templates = join(dir, 'templates');
  cpSync(fileURLToPath(new URL('../kit/templates', import.meta.url)), templates, { recursive: true });
  writeFileSync(join(templates, file), text);
  return templates;
};

test('markdown merge adds missing sections and settings, never duplicates a set value', () => {
  const text = '# Project profile\n\n## Languages and frameworks\n- TypeScript\n\n## Rules\nPromotion threshold: 5\n';
  const template = '# Project profile\n\n## Languages and frameworks\n## Rules\nPromotion threshold: 3   <!-- default -->\n## Output style\nStyle: concise\n';
  const merged = mergeMarkdown(text, template);
  assert.ok(merged.text.includes('- TypeScript'));
  assert.equal(merged.text.match(/Promotion threshold:/g).length, 1);
  assert.ok(merged.text.includes('Promotion threshold: 5'));
  assert.deepEqual(merged.addedSections, ['Output style']);
  assert.deepEqual(merged.addedSettings, []);
  // a second pass changes nothing
  assert.deepEqual(mergeMarkdown(merged.text, template).addedSections, []);
});

test('markdown merge adds a missing setting to an existing section', () => {
  const merged = mergeMarkdown('# P\n\n## Rules\nCustom note\n', '# P\n\n## Rules\nPromotion threshold: 3   <!-- x -->\n');
  assert.ok(merged.text.includes('Custom note'));
  assert.ok(merged.text.includes('Promotion threshold: 3'));
  assert.deepEqual(merged.addedSettings, ['Promotion threshold']);
});

test('json merge keeps every existing value and adds only missing keys', () => {
  const merged = mergeJson({ a: { b: 1 } }, { a: { b: 2, c: 3 }, d: 4 });
  assert.deepEqual(merged.value, { a: { b: 1, c: 3 }, d: 4 });
  assert.deepEqual(merged.added, ['a.c', 'd']);
});

test('an update fills an existing project profile and keeps its content', async () => {
  const dir = tmp();
  install(dir, ['claude']);
  write(dir, '.light-kit/project-profile.md', '# Project profile\n\n## Languages and frameworks\n- TypeScript\n\n## Rules\nPromotion threshold: 5\n');
  const report = await mergeProject(dir);
  const profile = read(dir, '.light-kit/project-profile.md');
  assert.ok(profile.includes('- TypeScript'));
  assert.ok(profile.includes('Promotion threshold: 5'));
  assert.doesNotMatch(profile, /Promotion threshold: 3/);
  for (const heading of ['## Commands (build / test / lint / run)', '## Conventions', '## Constraints', '## Testing policy', '## Output style', '## Review cycle', '## Commit policy']) assert.ok(profile.includes(heading), heading);
  assert.ok(report.files.some((f) => f.path.endsWith('project-profile.md') && f.addedSections.length >= 5));
});

test('an update adds a new section to the rules file and keeps every row', async () => {
  const dir = tmp();
  install(dir, ['claude']);
  const rules = read(dir, '.light-kit/rules.md');
  const newer = rules.replace('## Writing a rule', '## Updated guidance\nNew kit text.\n\n## Writing a rule');
  const templates = templatesWith(dir, 'rules.md', newer);
  write(dir, '.light-kit/rules.md', rules.replace('| _none yet_ | | | | | | | |', '| R-002 | pending | 1 | Keep this row. | x | y | 2026-11-22 | z |').replace('## Writing a rule', '## Writing a rule (user copy)'));
  await mergeProject(dir, { templates });
  const merged = read(dir, '.light-kit/rules.md');
  assert.ok(merged.includes('Keep this row.'));
  assert.ok(merged.includes('## Updated guidance') && merged.includes('New kit text.'));
  assert.ok(merged.includes('## Writing a rule'));
});

test('an update adds missing keys and modes to the JSON documents, keeping values', async () => {
  const dir = tmp();
  install(dir, ['claude']);
  write(dir, '.light-kit/models.json', '{"easy":"my-model"}\n');
  write(dir, '.light-kit/hooks.config.json', '{"verify":{"command":"npm test"},"hooks":{"artifact-header":"off"}}\n');
  const report = await mergeProject(dir);
  const models = JSON.parse(read(dir, '.light-kit/models.json'));
  assert.equal(models.easy, 'my-model');
  assert.equal(models.medium, '');
  assert.ok('claude' in models);
  const hooks = JSON.parse(read(dir, '.light-kit/hooks.config.json'));
  assert.equal(hooks.verify.command, 'npm test');
  assert.equal(hooks.hooks['artifact-header'], 'off');
  assert.equal(hooks.hooks['tool-log'], 'warn');
  assert.ok('quality' in hooks && 'commit' in hooks);
  assert.ok(report.files.flatMap((f) => f.addedKeys).some((k) => k.startsWith('hooks.')));
});

test('a second update writes nothing', async () => {
  const dir = tmp();
  install(dir, ['claude']);
  write(dir, '.light-kit/project-profile.md', '# Project profile\n\n## Languages and frameworks\n- Go\n');
  await mergeProject(dir);
  const before = read(dir, '.light-kit/project-profile.md');
  const report = await mergeProject(dir);
  assert.deepEqual(report.written, []);
  assert.equal(read(dir, '.light-kit/project-profile.md'), before);
});

test('documents that do not exist are not created', async () => {
  const dir = tmp();
  mkdirSync(join(dir, '.light-kit'));
  const report = await mergeProject(dir);
  assert.deepEqual(report.files, []);
  assert.deepEqual(readdirSync(join(dir, '.light-kit')), []);
});

test('invalid JSON is reported and left untouched', async () => {
  const dir = tmp();
  install(dir, ['claude']);
  write(dir, '.light-kit/models.json', '{ broken');
  const report = await mergeProject(dir);
  assert.equal(read(dir, '.light-kit/models.json'), '{ broken');
  assert.equal(report.files.find((f) => f.path.endsWith('models.json')).skipped, 'invalid JSON');
});

test('the installed script runs against a project with --project', () => {
  const dir = tmp();
  install(dir, ['claude']);
  write(dir, '.light-kit/project-profile.md', '# Project profile\n\n## Languages and frameworks\n- Go\n');
  const out = execFileSync(process.execPath, [join(dir, '.light-kit/init/merge.mjs'), '--project', dir, '--dry-run'], { encoding: 'utf8' });
  assert.match(out, /project-profile\.md/);
  assert.match(out, /would update/);
  assert.equal(read(dir, '.light-kit/project-profile.md'), '# Project profile\n\n## Languages and frameworks\n- Go\n'); // dry run wrote nothing
  assert.ok(existsSync(join(dir, '.light-kit/init/merge.mjs')));
  assert.match(read(dir, '.light-kit/init/merge.mjs'), /light-kit:generated/);
});
