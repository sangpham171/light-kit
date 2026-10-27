import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadKit, lint, build, CLIENT_NAMES, START, END } from '../tools/build.mjs';
import { install } from '../tools/install.mjs';
import { formatUsage } from '../kit/hooks/lib/usage.mjs';

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
  assert.match(get('claude', '.claude/commands/light-request.md'), /\$ARGUMENTS/);
  assert.match(get('copilot', '.github/prompts/light-request.prompt.md'), /\$\{input:request/);
  assert.doesNotMatch(get('cursor', '.cursor/commands/light-request.md'), /\$ARGUMENTS/);
});

test('install into empty dir, then second run changes nothing', () => {
  const dir = tmp();
  const first = install(dir, CLIENT_NAMES);
  assert.ok(first.written.length > 30);
  assert.ok(existsSync(join(dir, '.claude/agents/light-orchestrator.md')));
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
  writeFileSync(join(dir, '.claude/agents/light-developer.md'), 'my own developer agent');
  const r = install(dir, ['claude']);
  assert.ok(r.skipped.includes('.claude/agents/light-developer.md'));
  assert.equal(readFileSync(join(dir, '.claude/agents/light-developer.md'), 'utf8'), 'my own developer agent');
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
  assert.ok(existsSync(join(dir, '.claude/commands/light-bootstrap.md')));
  assert.ok(existsSync(join(dir, '.claude/skills/light-codebase-map/SKILL.md')));
});

test('adopt assessment: skill, standardize workflow and command are generated and wired', () => {
  const dir = tmp();
  install(dir, ['claude']);
  assert.ok(existsSync(join(dir, '.claude/skills/light-project-assessment/SKILL.md')));
  assert.ok(existsSync(join(dir, '.light-kit/workflows/standardize.md')));
  assert.ok(existsSync(join(dir, '.claude/commands/light-standardize.md')));
  const init = readFileSync(join(dir, '.claude/commands/light-init.md'), 'utf8');
  assert.match(init, /project-assessment/);
  assert.match(init, /Do not change any project code now/);
  assert.doesNotMatch(init, /ask which items to accept/);
  assert.match(readFileSync(join(dir, '.light-kit/workflows/standardize.md'), 'utf8'), /skip items marked `rejected`/);
  const skill = readFileSync(join(dir, '.claude/skills/light-project-assessment/SKILL.md'), 'utf8');
  assert.match(skill, /Never propose:\*\* refactors/);
  assert.match(skill, /Behavior-preserving/);
});

test('tech debt and review cycle: skills, workflow steps, templates and config are wired', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  assert.match(read('.claude/skills/light-tech-debt/SKILL.md'), /Resolve it/);
  assert.match(read('.claude/skills/light-tech-debt/SKILL.md'), /Defer only with a reason/);
  const cycle = read('.claude/skills/light-review-cycle/SKILL.md');
  assert.match(cycle, /default \*\*1\*\*/);
  assert.match(cycle, /Stop early/);
  assert.match(cycle, /--review-turns N/);
  for (const w of ['direct', 'standard', 'full', 'bootstrap', 'standardize']) {
    const text = read(`.light-kit/workflows/${w}.md`);
    assert.match(text, /implement — agent: light-developer — skill: light-tech-debt/, w);
    assert.match(text, /fix — agent: light-developer — skill: light-review-cycle/, w);
  }
  assert.match(read('.light-kit/workflows/standardize.md'), /never fix debt beyond the backlog items/);
  assert.match(read('.light-kit/templates/50-implementation.md'), /## Technical debt/);
  assert.match(read('.light-kit/templates/50-implementation.md'), /## Review rounds/);
  assert.match(read('.light-kit/templates/60-conclusion.md'), /Deferred technical debt and open findings/);
  assert.match(read('.light-kit/templates/status.md'), /review_turns/);
  assert.match(read('.light-kit/project-profile.md'), /Review turns: 1/);
  assert.match(read('.claude/commands/light-request.md'), /--review-turns/);
  assert.match(read('.claude/commands/light-init.md'), /Review turns/);
  assert.match(read('.claude/commands/light-init.md'), /without asking/);
  assert.match(read('.claude/agents/light-developer.md'), /tech-debt/);
  assert.match(read('.claude/agents/light-developer.md'), /review-cycle/);
  assert.match(read('.claude/agents/light-reviewer.md'), /Technical debt/);
  assert.match(read('.claude/agents/light-orchestrator.md'), /Review turns/);
  assert.match(read('.claude/agents/light-tech-writer.md'), /Deferred technical debt/);
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
  for (const a of ['orchestrator', 'developer', 'reviewer', 'tech-writer']) assert.doesNotMatch(read(`.claude/agents/light-${a}.md`), /Be concise/, a);
  assert.match(read('.cursor/rules/light-kit-core.mdc') ?? '', /Communication/);
  assert.match(read('.light-kit/project-profile.md'), /Style: concise/);
  const home = tmp();
  install(home, ['claude'], { level: 'user' });
  assert.match(readFileSync(join(home, '.claude/CLAUDE.md'), 'utf8'), /## Communication \(saves tokens\)/);
});

test('approval summaries: skill, global rule, gates and agents are wired', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const skill = read('.claude/skills/light-approval-summary/SKILL.md');
  assert.match(skill, /One screen/);
  assert.match(skill, /Functional first/);
  assert.match(skill, /Trade-offs go in a table/);
  assert.match(skill, /same aspects for every option/);
    for (const w of ['full', 'bootstrap']) {
    assert.match(read(`.light-kit/workflows/${w}.md`), /Decision point:\*\* record/, w);
    assert.doesNotMatch(read(`.light-kit/workflows/${w}.md`), /wait for approval|approval-summary/, w);
  }
  assert.match(skill, /Decide yourself/);
  assert.match(skill, /genuinely equivalent/);
  assert.match(read('CLAUDE.md'), /Decide, don't ask/);
  // the rule is global: no agent repeats it
  for (const a of ['orchestrator', 'product-owner', 'business-analyst', 'architect', 'ux-designer', 'tech-lead', 'tech-writer'])
    assert.doesNotMatch(read(`.claude/agents/light-${a}.md`), /approval-summary|equivalent options|Decide, don't ask/, a);
  assert.match(read('CLAUDE.md'), /Everything the user reads/);
  assert.match(read('.claude/skills/light-codebase-map/SKILL.md'), /In plain words/);
  assert.match(read('.claude/skills/light-project-assessment/SKILL.md'), /approval-summary/);
});

test('commit rules forbid trailers and AI attribution in the instructions', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (f) => readFileSync(join(dir, f), 'utf8');
  assert.match(read('CLAUDE.md'), /Clean commit messages/);
  assert.match(read('CLAUDE.md'), /never any AI attribution/);
  assert.match(read('.claude/skills/light-commit/SKILL.md'), /Only the description of the change/);
  assert.doesNotMatch(read('.claude/skills/light-commit/SKILL.md'), /Request: specs|Task: </);
  assert.doesNotMatch(read('.light-kit/project-profile.md'), /trailer "Request/);
});

test('everything the client shows carries the light- prefix', () => {
  const dir = tmp();
  install(dir, ['claude', 'copilot', 'cursor', 'codex']);
  const names = (p) => readdirSync(join(dir, p));
  for (const [p, strip] of [['.claude/agents', ''], ['.claude/commands', ''], ['.claude/skills', ''], ['.github/agents', ''], ['.github/prompts', ''], ['.github/skills', ''],
    ['.cursor/commands', ''], ['.cursor/rules', ''], ['.codex/agents', ''], ['.codex/prompts', ''], ['.agents/skills', '']])
    for (const n of names(p)) assert.match(n, /^light-/, `${p}/${n}`);
  const loaded = loadKit();
  for (const d of [...loaded.agents, ...loaded.skills, ...loaded.prompts]) assert.match(d.meta.name, /^light-/, d.meta.name);
  // no bare names left in the instructions
  const claudeMd = readFileSync(join(dir, 'CLAUDE.md'), 'utf8');
  assert.match(claudeMd, /light-orchestrator/);
  assert.match(claudeMd, /`light-init`/);
  assert.doesNotMatch(claudeMd, /`init`|`commit` skill|apply the `triage`/);
  const orch = readFileSync(join(dir, '.claude/agents/light-orchestrator.md'), 'utf8');
  assert.match(orch, /name: light-orchestrator/);
  assert.match(orch, /`light-project-scope` skill/);
  const wf = readFileSync(join(dir, '.light-kit/workflows/full.md'), 'utf8');
  assert.match(wf, /agents: light-product-owner, light-business-analyst/);
  assert.match(wf, /skill: light-discovery/);
  assert.doesNotMatch(wf, /agents?: (?!light-)[a-z]/);
});

test('upgrade removes obsolete generated files but never your own', () => {
  const dir = tmp();
  mkdirSync(join(dir, '.claude/agents'), { recursive: true });
  mkdirSync(join(dir, '.claude/skills/commit'), { recursive: true });
  mkdirSync(join(dir, '.claude/commands'), { recursive: true });
  writeFileSync(join(dir, '.claude/agents/developer.md'), '---\nname: developer\n---\n<!-- light-kit:generated -->\nold');
  writeFileSync(join(dir, '.claude/skills/commit/SKILL.md'), '---\nname: commit\n---\n<!-- light-kit:generated -->\nold');
  writeFileSync(join(dir, '.claude/commands/init.md'), '---\n---\n<!-- light-kit:generated -->\nold');
  writeFileSync(join(dir, '.claude/agents/mine.md'), 'my own agent');
  writeFileSync(join(dir, '.claude/commands/deploy.md'), 'my own command');
  const preview = install(dir, ['claude'], { dryRun: true });
  assert.deepEqual(preview.removed.sort(), ['.claude/agents/developer.md', '.claude/commands/init.md', '.claude/skills/commit/SKILL.md']);
  assert.ok(existsSync(join(dir, '.claude/agents/developer.md'))); // dry run keeps everything
  const r = install(dir, ['claude']);
  assert.equal(r.removed.length, 3);
  assert.equal(existsSync(join(dir, '.claude/agents/developer.md')), false);
  assert.equal(existsSync(join(dir, '.claude/skills/commit')), false); // emptied folder removed too
  assert.ok(existsSync(join(dir, '.claude/agents/light-developer.md')));
  assert.equal(readFileSync(join(dir, '.claude/agents/mine.md'), 'utf8'), 'my own agent');
  assert.equal(readFileSync(join(dir, '.claude/commands/deploy.md'), 'utf8'), 'my own command');
  assert.equal(install(dir, ['claude']).removed.length, 0); // idempotent
});

test('artifact headers: every artifact template starts with the runs header and the rule is global', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  // The step template's placeholder takes its labels and order from the line the hook prints, so a
  // change in `formatUsage` fails here instead of leaving the templates on the old shape.
  const labels = formatUsage({ input: 1, cacheRead: 2, cacheWrite: 3, output: 4 })
    .split(' · ').map((cell) => cell.replace(/^[\d,]+\s+/, ''));
  const placeholder = labels.map((label) => `<${label}> ${label}`).join(' · ');
  const headerStart = /^---\nruns:\n  - step: <step>\n    agent: <agent>\n    model: <model id>\n    thinking: <reasoning setting or unknown>\n    level: <easy\|medium\|hard\|unknown>\nusage:\n  - step: <step>\n/;
  for (const t of ['00-request', '10-understanding', '20-discovery', '30-design', '40-plan', '50-implementation', '60-conclusion']) {
    const text = read(`.light-kit/templates/${t}.md`);
    assert.match(text, headerStart, t);
    assert.doesNotMatch(text, /## Token usage/, t);
    assert.equal(text.match(/^    tokens: (.+)$/m)?.[1], placeholder, t);
    assert.match(text, /^    time: <time spent or unknown>$/m, t);
    if (t === '60-conclusion') assert.match(text, /^  - step: total\n    tokens: .+\n    time: <time spent or unknown>$/m, t);
  }
  assert.match(read('.light-kit/templates/60-conclusion.md'), /^  - step: <step>$/m);
  assert.doesNotMatch(read('.light-kit/templates/status.md'), /runs:|usage:/); // state file, not an artifact
  assert.match(read('CLAUDE.md'), /Sign your artifacts/);
  assert.match(read('CLAUDE.md'), /token-usage/);
  assert.match(read('CLAUDE.md'), /otherwise `unknown`, never a guess/);
  for (const s of ['light-codebase-map', 'light-project-assessment', 'light-audit']) assert.match(read(`.claude/skills/${s}/SKILL.md`), /`runs:` header/, s);
  assert.match(read('.claude/skills/light-model-routing/SKILL.md'), /`runs:` header/);
  assert.doesNotMatch(read('.light-kit/templates/50-implementation.md'), /task N: level/);
});
