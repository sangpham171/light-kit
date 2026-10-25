import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../tools/install.mjs';
import { loadKit, lint, build, CLIENT_NAMES, KIT_DIR } from '../tools/build.mjs';

const tmp = () => mkdtempSync(join(tmpdir(), 'light-kit-audit-'));
const audit = (script, ...args) => spawnSync('node', [script, ...args], { encoding: 'utf8' });
const json = (script, ...args) => { const r = audit(script, '--json', ...args); assert.equal(r.status, 0, r.stderr); return JSON.parse(r.stdout); };
const count = (rep, type) => rep.components.filter((c) => c.type === type).length;

test('audit of the kit sources: inventory, purposes, cost and no broken references', () => {
  const rep = json('kit/audit/audit.mjs', '--source', 'kit');
  const kit = loadKit();
  assert.equal(rep.mode, 'source');
  assert.equal(count(rep, 'agent'), kit.agents.length);
  assert.equal(count(rep, 'skill'), kit.skills.length);
  assert.equal(count(rep, 'prompt'), kit.prompts.length);
  assert.equal(count(rep, 'workflow'), kit.workflows.length);
  assert.equal(count(rep, 'rule'), 13);
  assert.deepEqual(rep.findings.unclassified, []);
  assert.deepEqual(rep.findings.stale, []);
  assert.deepEqual(rep.findings.unreferenced, []);
  assert.ok(rep.totals.alwaysLoaded > 1000 && rep.totals.alwaysLoaded === rep.totals.core + rep.totals.index);
  assert.ok(rep.guards.includes('guard-dangerous-commands') && rep.guards.includes('audit-reminder'));
  assert.ok(rep.components.find((c) => c.id === 'light-audit'));
  // the default mode from inside the kit folder is the source mode, and the markdown report is readable
  const md = audit('kit/audit/audit.mjs');
  assert.match(md.stdout, /# light-kit audit/);
  assert.match(md.stdout, /Loaded every session: \d+/);
  assert.match(md.stdout, /Necessity test candidates/);
});

test('audit finds unused components, stale references, repeated text and missing purposes', () => {
  const copy = tmp();
  cpSync(KIT_DIR, copy, { recursive: true });
  mkdirSync(join(copy, 'skills/light-lonely'));
  const sentence = 'Always double check every single generated file against the original request before you finish the task at hand.';
  writeFileSync(join(copy, 'skills/light-lonely/SKILL.md'), `---\nname: light-lonely\ndescription: nobody uses me\npurpose: compensation\n---\n\n# Lonely\n${sentence}\n`);
  const dev = join(copy, 'agents/light-developer.md');
  writeFileSync(dev, readFileSync(dev, 'utf8') + `\nSee the light-ghost skill. ${sentence}\n`);
  const rev = join(copy, 'agents/light-reviewer.md');
  writeFileSync(rev, readFileSync(rev, 'utf8').replace(/^purpose: .*\n/m, ''));
  const rep = json('kit/audit/audit.mjs', '--source', copy);
  assert.deepEqual(rep.findings.unreferenced, ['light-lonely']);
  assert.deepEqual(rep.findings.stale, [{ id: 'light-ghost', from: ['light-developer'] }]);
  assert.deepEqual(rep.findings.unclassified, ['light-reviewer']);
  const dup = rep.findings.repeated.find((r) => r.text.startsWith('always double check'));
  assert.deepEqual(dup.in.sort(), ['light-developer', 'light-lonely']);
  assert.ok(rep.components.find((c) => c.id === 'light-lonely').purpose === 'compensation');
});

test('installed kit: the audit tool and manifest come with every install and agree with the sources', () => {
  const dir = tmp();
  install(dir, CLIENT_NAMES);
  const rep = json(join(dir, '.light-kit/audit/audit.mjs'));
  const kit = loadKit();
  assert.equal(rep.mode, 'installed');
  assert.equal(rep.level, 'project');
  assert.equal(count(rep, 'agent'), kit.agents.length);
  assert.equal(count(rep, 'skill'), kit.skills.length);
  assert.equal(count(rep, 'rule'), 13);
  assert.deepEqual(rep.findings.missingFiles, []);
  assert.deepEqual(rep.findings.unclassified, []);
  assert.deepEqual(rep.findings.stale, []);
  const manifest = JSON.parse(readFileSync(join(dir, '.light-kit/audit/manifest.json'), 'utf8'));
  const dev = manifest.components.find((c) => c.id === 'light-developer');
  assert.deepEqual(dev.files.sort(), ['.claude/agents/light-developer.md', '.codex/agents/light-developer.toml', '.cursor/rules/light-developer.mdc', '.github/agents/light-developer.agent.md']);
  assert.equal(dev.purpose, 'structure');
  assert.ok(manifest.instructionFiles.includes('CLAUDE.md'));
  assert.equal(install(dir, CLIENT_NAMES).written.length, 0); // idempotent, manifest included
});

test('installed kit at user level: paths in the manifest follow each client\'s user folders', () => {
  const home = tmp();
  install(home, ['claude', 'copilot', 'codex'], { level: 'user' });
  const manifest = JSON.parse(readFileSync(join(home, '.light-kit/audit/manifest.json'), 'utf8'));
  const dev = manifest.components.find((c) => c.id === 'light-developer');
  assert.deepEqual(dev.files.sort(), ['.claude/agents/light-developer.md', '.codex/agents/light-developer.toml', '.copilot/agents/light-developer.agent.md']);
  assert.ok(manifest.instructionFiles.includes('.claude/CLAUDE.md'));
  const rep = json(join(home, '.light-kit/audit/audit.mjs'));
  assert.equal(rep.level, 'user');
  assert.deepEqual(rep.findings.missingFiles, []);
  assert.ok(rep.components.filter((c) => c.type === 'rule').length === 13);
});

test('audit --record notes the model; it only works on an installed kit', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const r = audit(join(dir, '.light-kit/audit/audit.mjs'), '--record', 'model-x');
  assert.equal(r.status, 0, r.stderr);
  const state = JSON.parse(readFileSync(join(dir, '.light-kit/audits/state.json'), 'utf8'));
  assert.equal(state.auditedModel, 'model-x');
  assert.match(state.auditedAt, /^\d{4}-\d{2}-\d{2}$/);
  const src = audit('kit/audit/audit.mjs', '--record', 'model-x');
  assert.equal(src.status, 2);
});

test('lint requires a purpose on every component and a purpose for every core rule', () => {
  assert.deepEqual(lint(loadKit()), []);
  const a = loadKit(); delete a.skills[0].meta.purpose;
  assert.match(lint(a).join('\n'), /purpose must be one of/);
  const b = loadKit(); b.agents[0].meta.purpose = 'nice-to-have';
  assert.match(lint(b).join('\n'), /purpose must be one of/);
  const c = loadKit(); c.core.body += '\n## Brand new section\ntext\n';
  assert.match(lint(c).join('\n'), /no purpose for core "Brand new section"/);
  const d = loadKit(); d.core.body = d.core.body.replace('7. **Never invent facts**', '7. **Never guess**');
  assert.match(lint(d).join('\n'), /no purpose for core "Rules: Never guess"/);
});

// ---------- model-change reminder ----------
function reminder(dir, payload, client = 'claude') {
  const r = spawnSync('node', [join(dir, '.light-kit/hooks/run.mjs'), '--client', client, '--event', 'session-start'], { cwd: dir, input: JSON.stringify({ cwd: dir, ...payload }), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout;
}
const text = (out) => { const j = JSON.parse(out); return j.hookSpecificOutput?.additionalContext ?? j.additional_context ?? j.additionalContext ?? ''; };

test('audit reminder: once per new model, silent after an audit, silent without a model', () => {
  const dir = tmp();
  install(dir, ['claude']);
  assert.doesNotMatch(reminder(dir, {}), /light-audit/); // no model reported: nothing to compare
  const first = text(reminder(dir, { model: 'model-a' }));
  assert.match(first, /never audited and you are now on model-a/);
  assert.match(first, /`light-audit`/);
  assert.doesNotMatch(reminder(dir, { model: 'model-a' }), /light-audit/); // already told for this model
  assert.match(text(reminder(dir, { model: 'model-b' })), /never audited and you are now on model-b/);
  audit(join(dir, '.light-kit/audit/audit.mjs'), '--record', 'model-b');
  assert.doesNotMatch(reminder(dir, { model: 'model-b' }), /light-audit/);
  assert.match(text(reminder(dir, { model: 'model-c' })), /last audited with model-b and you are now on model-c/);
  assert.doesNotMatch(reminder(dir, { model: 'model-c' }), /light-audit/);
});

test('audit reminder: other clients, model given as an object, and switched off in the config', () => {
  const dir = tmp();
  install(dir, ['claude', 'cursor', 'codex']);
  assert.match(text(reminder(dir, { model: 'm-cursor' }, 'cursor')), /on m-cursor/);
  assert.match(text(reminder(dir, { model_id: 'm-codex' }, 'codex')), /on m-codex/);
  assert.match(text(reminder(dir, { model: { id: 'm-obj' } })), /on m-obj/);
  writeFileSync(join(dir, '.light-kit/hooks.config.json'), JSON.stringify({ audit: { remind: false } }));
  assert.doesNotMatch(reminder(dir, { model: 'm-new' }), /light-audit/);
  const off = tmp(); install(off, ['claude']);
  writeFileSync(join(off, '.light-kit/hooks.config.json'), JSON.stringify({ hooks: { 'audit-reminder': 'off' } }));
  assert.doesNotMatch(reminder(off, { model: 'm-new' }), /light-audit/);
});

test('audit reminder at user level keeps its state in ~/.light-kit and reaches every project', () => {
  const home = tmp();
  install(home, ['claude'], { level: 'user' });
  mkdirSync(join(home, 'proj'));
  const r = spawnSync('node', [join(home, '.light-kit/hooks/run.mjs'), '--client', 'claude', '--event', 'session-start'], { cwd: join(home, 'proj'), input: JSON.stringify({ cwd: join(home, 'proj'), model: 'm1' }), encoding: 'utf8' });
  assert.match(text(r.stdout), /on m1/);
  assert.equal(JSON.parse(readFileSync(join(home, '.light-kit/audits/state.json'), 'utf8')).remindedModel, 'm1');
  assert.equal(existsSync(join(home, 'proj/.light-kit')), false);
});

test('audit command and skill are generated, prefixed and wired', () => {
  const dir = tmp();
  install(dir, ['claude', 'codex']);
  const skill = readFileSync(join(dir, '.claude/skills/light-audit/SKILL.md'), 'utf8');
  assert.match(skill, /Necessity test/);
  assert.match(skill, /compensation/);
  assert.match(skill, /never edit generated files/i);
  assert.match(readFileSync(join(dir, '.claude/commands/light-audit.md'), 'utf8'), /light-audit.* skill/);
  assert.match(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), /`light-audit`/);
  assert.ok(existsSync(join(dir, '.agents/skills/light-audit/SKILL.md')));
  assert.ok(existsSync(join(dir, '.codex/prompts/light-audit.md')));
  // generated client files do not leak the internal purpose field
  assert.doesNotMatch(readFileSync(join(dir, '.claude/agents/light-developer.md'), 'utf8'), /^purpose:/m);
});
