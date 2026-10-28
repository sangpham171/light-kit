import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../tools/install.mjs';
import { uninstall } from '../tools/uninstall.mjs';
import { CLIENT_NAMES, vscodePromptDirs } from '../tools/build.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'light-kit-un-'));
const userFiles = (d) => {
  mkdirSync(join(d, '.claude'), { recursive: true });
  writeFileSync(join(d, 'CLAUDE.md'), '# Mine\nkeep this\n');
  writeFileSync(join(d, '.claude/settings.json'), JSON.stringify({ model: 'x', hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'my-own-check' }] }] } }));
  mkdirSync(join(d, 'specs/001-x'), { recursive: true });
  writeFileSync(join(d, 'specs/001-x/00-request.md'), 'request\n');
};
const settings = (d) => JSON.parse(readFileSync(join(d, '.claude/settings.json'), 'utf8'));

test('soft uninstall removes generated files and keeps user data', () => {
  const d = tmp();
  userFiles(d);
  install(d, CLIENT_NAMES);
  writeFileSync(join(d, '.light-kit/codebase-map.md'), 'map\n');
  writeFileSync(join(d, '.light-kit/assessment.md'), 'assessment\n');
  // files an older kit version generated: template copies carry no marker, workflows do
  writeFileSync(join(d, '.light-kit/templates/old-template.md'), 'old\n');
  writeFileSync(join(d, '.light-kit/workflows/old-workflow.md'), '<!-- light-kit:generated -->\nold\n');
  // command files an earlier version generated sit beside the user's own commands
  mkdirSync(join(d, '.claude/commands'), { recursive: true });
  writeFileSync(join(d, '.claude/commands/light-request.md'), '<!-- light-kit:generated -->\nold\n');
  writeFileSync(join(d, '.claude/commands/mine.md'), 'my own command\n');

  const r = uninstall(d, CLIENT_NAMES);

  for (const p of [
    '.claude/agents/light-orchestrator.md',
    '.claude/commands/light-request.md',
    '.claude/skills',
    '.github/agents',
    '.github/skills',
    '.cursor/rules',
    '.codex/agents',
    '.agents/skills',
    '.light-kit/workflows',
    '.light-kit/profiles',
    '.light-kit/hooks',
    '.light-kit/audit',
    '.light-kit/templates',
    'kit.config.json',
    'AGENTS.md',
  ]) assert.equal(existsSync(join(d, p)), false, `${p} should be removed`);

  for (const p of [
    '.light-kit/project-profile.md',
    '.light-kit/hooks.config.json',
    '.light-kit/models.json',
    '.light-kit/codebase-map.md',
    '.light-kit/assessment.md',
    'specs/001-x/00-request.md',
  ]) assert.ok(existsSync(join(d, p)), `${p} should be kept`);

  assert.equal(readFileSync(join(d, 'CLAUDE.md'), 'utf8'), '# Mine\nkeep this\n');
  const s = settings(d);
  assert.equal(s.model, 'x');
  assert.equal(s.hooks.PreToolUse.length, 1);
  assert.equal(s.hooks.PreToolUse[0].hooks[0].command, 'my-own-check');
  assert.doesNotMatch(JSON.stringify(s), /light-kit\/hooks\/run\.mjs/);

  assert.ok(r.removed.length > 20);
  assert.ok(r.kept.some((p) => p === '.light-kit/project-profile.md'));
});

test('unmanaged files at kit paths are never deleted, in either mode', () => {
  for (const hard of [false, true]) {
    const d = tmp();
    mkdirSync(join(d, '.claude/agents'), { recursive: true });
    writeFileSync(join(d, '.claude/agents/light-developer.md'), 'my own developer');
    install(d, ['claude']);
    const r = uninstall(d, ['claude'], { hard });
    assert.equal(readFileSync(join(d, '.claude/agents/light-developer.md'), 'utf8'), 'my own developer');
    assert.ok(r.skipped.includes('.claude/agents/light-developer.md'));
    assert.equal(existsSync(join(d, '.claude/agents/light-orchestrator.md')), false);
  }
});

test('hard uninstall also removes .light-kit and specs, keeping unmanaged files', () => {
  const d = tmp();
  userFiles(d);
  install(d, CLIENT_NAMES);
  uninstall(d, CLIENT_NAMES, { hard: true });
  assert.equal(existsSync(join(d, '.light-kit')), false);
  assert.equal(existsSync(join(d, 'specs')), false);
  assert.equal(existsSync(join(d, 'kit.config.json')), false);
  assert.equal(readFileSync(join(d, 'CLAUDE.md'), 'utf8'), '# Mine\nkeep this\n');
  assert.equal(settings(d).hooks.PreToolUse[0].hooks[0].command, 'my-own-check');
});

test('dry run changes nothing', () => {
  const d = tmp();
  userFiles(d);
  install(d, ['claude']);
  const before = readFileSync(join(d, 'CLAUDE.md'), 'utf8');
  const r = uninstall(d, ['claude'], { dryRun: true });
  assert.ok(r.removed.length > 0);
  assert.ok(existsSync(join(d, '.claude/agents/light-orchestrator.md')));
  assert.ok(existsSync(join(d, '.light-kit/workflows/direct.md')));
  assert.equal(readFileSync(join(d, 'CLAUDE.md'), 'utf8'), before);
  assert.match(readFileSync(join(d, '.claude/settings.json'), 'utf8'), /light-kit\/hooks\/run\.mjs/);
});

test('uninstall is idempotent', () => {
  const d = tmp();
  install(d, ['claude']);
  uninstall(d, ['claude']);
  const r = uninstall(d, ['claude']);
  assert.deepEqual([r.removed.length, r.cleaned.length], [0, 0]);
});

test('user level: soft keeps hooks config and models, removes generated folders', () => {
  const d = tmp();
  mkdirSync(join(d, '.claude'));
  mkdirSync(join(d, '.copilot'));
  // a prompt file an earlier version wrote where VS Code reads them, next to the user's own
  const [promptDir] = vscodePromptDirs(d);
  mkdirSync(join(d, promptDir), { recursive: true });
  writeFileSync(join(d, promptDir, 'light-request.prompt.md'), '<!-- light-kit:generated -->\nold\n');
  writeFileSync(join(d, promptDir, 'mine.prompt.md'), 'not ours\n');
  install(d, ['claude', 'copilot'], { level: 'user' });
  assert.ok(existsSync(join(d, '.claude/agents/light-orchestrator.md')));
  assert.ok(existsSync(join(d, '.claude/skills/light-request/SKILL.md')));
  assert.equal(existsSync(join(d, promptDir, 'light-request.prompt.md')), false, 'the old command file is swept');
  assert.ok(existsSync(join(d, promptDir, 'mine.prompt.md')), 'the user\'s own prompt stays');
  uninstall(d, ['claude', 'copilot'], { level: 'user' });
  assert.equal(existsSync(join(d, '.claude/agents')), false);
  assert.equal(existsSync(join(d, '.claude/CLAUDE.md')), false);
  assert.equal(existsSync(join(d, '.light-kit/workflows')), false);
  assert.equal(existsSync(join(d, '.light-kit/kit.config.json')), false);
  assert.ok(existsSync(join(d, '.light-kit/hooks.config.json')));
  assert.ok(existsSync(join(d, '.light-kit/models.json')));
});

test('workspace hard removes the root and each project kit folder and specs', () => {
  const d = tmp();
  mkdirSync(join(d, 'api/.git'), { recursive: true });
  mkdirSync(join(d, 'web/.git'), { recursive: true });
  const projects = [{ path: 'api', repo: true }, { path: 'web', repo: true }];
  install(d, ['claude'], { level: 'workspace', projects });
  mkdirSync(join(d, 'api/specs/001-a'), { recursive: true });
  writeFileSync(join(d, 'api/specs/001-a/00-request.md'), 'x');
  uninstall(d, ['claude'], { level: 'workspace', projects, hard: true });
  assert.equal(existsSync(join(d, '.light-kit')), false);
  assert.equal(existsSync(join(d, 'specs')), false);
  assert.equal(existsSync(join(d, 'api/.light-kit')), false);
  assert.equal(existsSync(join(d, 'api/specs')), false);
  assert.equal(existsSync(join(d, 'web/.light-kit')), false);
});

test('CLI: soft is the default; hard refuses without --yes, then removes everything', () => {
  const d = tmp();
  install(d, ['claude']);
  const soft = spawnSync('node', ['tools/uninstall.mjs', d], { encoding: 'utf8' });
  assert.equal(soft.status, 0, soft.stderr);
  assert.match(soft.stdout, /soft uninstall/);
  assert.equal(existsSync(join(d, '.claude/agents')), false);
  assert.ok(existsSync(join(d, '.light-kit/project-profile.md')));

  const e = tmp();
  install(e, ['claude']);
  const refused = spawnSync('node', ['tools/uninstall.mjs', e, '--hard'], { encoding: 'utf8' });
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /--yes/);
  assert.ok(existsSync(join(e, '.light-kit/workflows/direct.md')));

  const hard = spawnSync('node', ['tools/uninstall.mjs', e, '--hard', '--yes'], { encoding: 'utf8' });
  assert.equal(hard.status, 0, hard.stderr);
  assert.match(hard.stdout, /hard uninstall/);
  assert.equal(existsSync(join(e, '.light-kit')), false);
});
