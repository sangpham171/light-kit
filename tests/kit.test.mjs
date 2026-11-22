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

test('every client produces agents and skills', () => {
  const kit = loadKit();
  for (const c of CLIENT_NAMES) {
    const paths = build(kit, [c]).map((f) => f.path);
    for (const a of kit.agents) assert.ok(paths.some((p) => p.includes(a.meta.name)), `${c}: agent ${a.meta.name}`);
    for (const s of kit.skills) assert.ok(paths.some((x) => x.includes(s.meta.name)), `${c}: skill ${s.meta.name}`);
  }
});

test('commands are skills, so no client gets a prompt or command file', () => {
  const kit = loadKit();
  const commands = ['init', 'bootstrap', 'standardize', 'request', 'triage', 'plan', 'implement', 'review', 'status', 'audit'];
  const where = { claude: (n) => `.claude/skills/${n}/SKILL.md`, copilot: (n) => `.github/skills/${n}/SKILL.md`, codex: (n) => `.agents/skills/${n}/SKILL.md`, cursor: (n) => `.cursor/rules/${n}.mdc` };
  for (const c of CLIENT_NAMES) {
    const paths = build(kit, [c]).map((f) => f.path);
    assert.deepEqual(paths.filter((p) => /\/commands\/|\/prompts\//.test(p)), [], c);
    for (const n of commands) assert.ok(paths.includes(where[c](`light-${n}`)), `${c}: light-${n}`);
  }
  // skill bodies carry no client-specific argument placeholder
  for (const s of kit.skills) assert.doesNotMatch(s.body, /\$ARGUMENTS|\$\{input:/, s.meta.name);
});

test('a request that grew out of a discussion keeps the whole exchange', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  assert.match(read('CLAUDE.md'), /A request is the whole conversation/);
  assert.match(read('CLAUDE.md'), /light-conversation-capture/);
  const skill = read('.claude/skills/light-conversation-capture/SKILL.md');
  assert.match(skill, /final message is not the request/);
  assert.match(skill, /plan mode/i);
  assert.match(skill, /rejected/);
  assert.match(read('.light-kit/templates/00-request.md'), /## Conversation context/);
  assert.match(read('.light-kit/templates/00-request.md'), /### Decisions/);
  assert.match(read('.claude/agents/light-orchestrator.md'), /light-conversation-capture/);
  assert.match(read('.claude/skills/light-request/SKILL.md'), /light-conversation-capture/);
});

test('earlier requests are checked before understanding and discovery, read from the end backwards', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const order = /`60-conclusion\.md`.*`50-implementation\.md`.*`20-discovery\.md`/;
  const skill = read('.claude/skills/light-discovery/SKILL.md');
  assert.match(skill, /same, similar or related work/);
  assert.match(skill, /judge each folder by its name/);
  assert.match(skill, /from the end backwards/);
  assert.match(skill, order);
  assert.match(skill, /stale/);
  assert.match(skill, /current code/);
  assert.match(read('.claude/agents/light-orchestrator.md'), order);
  assert.match(read('.claude/agents/light-business-analyst.md'), order);
  assert.match(read('.light-kit/templates/10-understanding.md'), /## Prior requests/);
  assert.match(read('.light-kit/templates/20-discovery.md'), /## Prior requests/);
});

test('brainstorming diverges across directions before it converges, and never implements', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const kit = loadKit();
  const where = {
    claude: '.claude/skills/light-brainstorm/SKILL.md',
    copilot: '.github/skills/light-brainstorm/SKILL.md',
    cursor: '.cursor/rules/light-brainstorm.mdc',
    codex: '.agents/skills/light-brainstorm/SKILL.md',
  };
  for (const c of CLIENT_NAMES)
    assert.ok(build(kit, [c]).some((f) => f.path === where[c]), c);
  const skill = read('.claude/skills/light-brainstorm/SKILL.md');
  assert.match(skill, /## 1\. Frame the idea/);
  assert.match(skill, /## 2\. Diverge/);
  assert.match(skill, /## 3\. Converge/);
  assert.match(skill, /## 4\. Write the idea map/);
  assert.ok(skill.indexOf('## 2. Diverge') < skill.indexOf('## 3. Converge'));
  assert.match(skill, /Generate first, judge afterwards/);
  assert.match(skill, /one pass must not close another/);
  assert.match(skill, /Stop when a new pass stops producing new cases/);
  assert.match(skill, /what success looks like/);
  assert.match(skill, /Only after divergence/);
  for (const d of ['Actors', 'Journey and lifecycle', 'Alternatives', 'Solution shape', 'Scale and cost', 'Failure and misuse', 'Second-order effects', 'Precedent'])
    assert.match(skill, new RegExp(`\\| ${d} \\|`), d);
  for (const t of ['Inversion', 'Assumption inventory', 'Constraint shift', 'Analogy'])
    assert.match(skill, new RegExp(`\\*\\*${t}\\*\\*`), t);
  assert.match(skill, /cases absent from the user's wording/);
  assert.match(skill, /2–4 genuinely distinct options/);
  assert.match(skill, /impact × uncertainty/);
  assert.match(skill, /proposed default/);
  assert.match(skill, /pre-planning: do not edit code/);
  for (const s of ['**Framing**', '**Directions**', '**Cases the user did not mention**', '**Options**', '**Assumptions**', '**Open questions**', '**Next step**'])
    assert.ok(skill.includes(s), s);
  assert.match(skill, /brainstorms\/<YYYY-MM-DD>-<slug>\.md/);
  assert.match(skill, /Always write the file before replying/);
  assert.match(skill, /## Round N — <date>/);
  assert.match(skill, /look for an existing file whose slug or title matches/);
  assert.doesNotMatch(skill, /append the map under/);
  assert.doesNotMatch(skill, /## Brainstorm/);
  assert.match(skill, /run passes in parallel/);
  const template = read('.light-kit/templates/brainstorm.md');
  for (const s of ['# Brainstorm — ', '## Original idea', '## Round 1 — ', '### Framing', '### Directions', '### Cases the user did not mention', '### Options', '- Recommendation:', '### Assumptions', '### Open questions', '### Next step'])
    assert.ok(template.includes(s), s);
  assert.match(read('CLAUDE.md'), /light-brainstorm/);
  assert.match(read('CLAUDE.md'), /brainstorms\//);
  const request = read('.claude/skills/light-request/SKILL.md');
  assert.match(request, /light-brainstorm/);
  assert.match(request, /brainstorms\//);
  assert.doesNotMatch(request, /append the map under|lands under|## Brainstorm/);
  for (const p of ['../README.md', '../docs/usage.md']) {
    const doc = readFileSync(new URL(p, import.meta.url), 'utf8');
    assert.doesNotMatch(doc, /append the map under|lands under/, p);
  }
});

test('the orchestrator runs the brainstormer agent for uncertain requests', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const kit = loadKit();
  for (const c of CLIENT_NAMES) assert.ok(build(kit, [c]).some((f) => f.path.includes('light-brainstormer')), c);
  assert.ok(kit.agents.some((a) => a.meta.name === 'light-brainstormer'));
  const agent = read('.claude/agents/light-brainstormer.md');
  assert.match(agent, /light-brainstorm/);
  assert.match(agent, /Cover \*\*all\*\* use cases/);
  assert.match(agent, /brainstorms\/<YYYY-MM-DD>-<slug>\.md/);
  assert.match(agent, /The map is your only output file; the orchestrator adds the reference line/);
  assert.match(agent, /no code edits, plan tasks, specs artifacts or commits/);
  assert.match(agent, /Return to the orchestrator/);
  const skill = read('.claude/skills/light-brainstorm/SKILL.md');
  assert.match(skill, /method the light-brainstormer agent applies/);
  assert.doesNotMatch(skill, /when a request is vague, novel or high-impact/);
  const orch = read('.claude/agents/light-orchestrator.md');
  assert.match(orch, /light-brainstormer/);
  assert.match(orch, /vague, novel or high-impact/);
  assert.match(orch, /before `10-understanding\.md` and triage/);
  assert.match(orch, /add under `### References`/);
  assert.match(orch, /brainstorm: <level> — <reason>/);
  assert.match(orch, /Skip it for a precise, familiar request/);
  const request = read('.claude/skills/light-request/SKILL.md');
  assert.match(request, /invoke the `light-brainstormer` agent/);
  assert.match(request, /vague, novel or high-impact/);
  assert.match(request, /before `10-understanding\.md` and triage/);
  assert.match(request, /one line, if not already there/);
  const triage = read('.claude/skills/light-triage/SKILL.md');
  assert.match(triage, /Ambiguity, Novelty or Impact is 2/);
  assert.match(triage, /invokes `light-brainstormer`/);
  assert.match(triage, /adds the map's cases and open questions to `10-understanding\.md`/);
  assert.match(read('CLAUDE.md'), /light-orchestrator, light-brainstormer/);
  assert.match(read('.claude/skills/light-model-routing/SKILL.md'), /pre-triage `light-brainstormer` call is rated like the understand step/);
  const usage = readFileSync(new URL('../docs/usage.md', import.meta.url), 'utf8');
  assert.match(usage, /light-orchestrator, light-brainstormer/);
  assert.match(usage, /invokes the `light-brainstormer` agent/);
  assert.match(readFileSync(new URL('../README.md', import.meta.url), 'utf8'), /the `light-brainstormer` agent/);
});

test('the orchestrator adapts the agent roster as the request unfolds, and records why', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const kit = loadKit();
  for (const c of CLIENT_NAMES)
    assert.ok(build(kit, [c]).some((f) => f.path.includes('light-agent-selection')), c);
  const skill = read('.claude/skills/light-agent-selection/SKILL.md');
  assert.match(skill, /are the \*\*baseline\*\*, chosen from what is known at triage/);
  assert.match(skill, /## 1\. When to re-evaluate/);
  assert.match(skill, /## 2\. What you may change/);
  assert.match(skill, /## 3\. What you must not change/);
  for (const m of ['Add an agent to a step', 'Add a step', 'Skip an optional agent', 'Split a step', 'Repeat a finished step', 'Reorder remaining steps'])
    assert.ok(skill.includes(m), m);
  assert.match(skill, /keep the steps the chosen workflow defines as required/);
  assert.match(skill, /plus `understand` when the workflow has one/);
  assert.match(skill, /`light-reviewer` always runs/);
  assert.match(skill, /where the workflow has a `light-tester`, never drop it when the change alters behavior/);
  assert.match(skill, /add `light-security-reviewer` whenever the change touches/);
  assert.match(skill, /auth, personal data, money, migrations, public interfaces or new dependencies/);
  assert.match(skill, /an agent the user asked for, one a `confirmed` rule in `\.light-kit\/rules\.md` requires/);
  assert.match(skill, /`## Agent plan`/);
  assert.match(skill, /`## Routing`/);
  assert.match(skill, /mark a dropped step as skipped and a split step as split/);
  assert.match(skill, /`runs:` header/);
  const orch = read('.claude/agents/light-orchestrator.md');
  assert.match(orch, /baseline roster/);
  assert.match(orch, /not a fixed list/);
  assert.match(orch, /Before each step and whenever a fact changes the work, apply the `light-agent-selection` skill|before each step and whenever a fact changes the work/);
  assert.match(orch, /light-agent-selection/);
  assert.match(orch, /## Agent plan/);
  assert.match(read('CLAUDE.md'), /light-agent-selection/);
  assert.match(read('CLAUDE.md'), /agents and steps a workflow lists are a baseline/);
  const understanding = read('.light-kit/templates/10-understanding.md');
  assert.match(understanding, /## Agent plan\n<!-- Baseline from the chosen workflow/);
  assert.match(understanding, /\+ light-x — <reason> \(after <event>\)/);
  assert.match(understanding, /- light-y — <reason>/);
  for (const w of ['direct', 'standard', 'full', 'bootstrap', 'standardize']) {
    const text = read(`.light-kit/workflows/${w}.md`);
    assert.match(text, /agents and steps named below are the baseline/, w);
    assert.match(text, /light-agent-selection/, w);
  }
  const routing = read('.claude/skills/light-model-routing/SKILL.md');
  assert.match(routing, /Choose the roster and the model separately/);
  assert.match(routing, /rate the new or repeated step at the moment it is added/);
  assert.match(routing, /mark its Routing line as skipped/);
  const usage = readFileSync(new URL('../docs/usage.md', import.meta.url), 'utf8');
  assert.match(usage, /light-agent-selection/);
  assert.match(usage, /## Agent plan/);
  const routingDoc = readFileSync(new URL('../docs/model-routing.md', import.meta.url), 'utf8');
  assert.match(routingDoc, /`light-agent-selection` decides the agents and steps/);
  assert.deepEqual(lint(kit), []); // the baseline prose does not name a fake agent
});

test('the plan is written before code, even for direct requests', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  assert.match(read('.light-kit/workflows/direct.md'), /plan — agent: light-tech-lead — writes: 40-plan\.md/);
  assert.match(read('.light-kit/workflows/direct.md'), /is written before code changes/);
  assert.match(read('.claude/skills/light-implement/SKILL.md'), /Do not implement from the chat/);
  assert.match(read('.claude/skills/light-implement/SKILL.md'), /40-plan\.md/);
  assert.match(read('.claude/skills/light-plan/SKILL.md'), /agreed in a discussion/);
  assert.match(read('.claude/agents/light-developer.md'), /written plan/);
  assert.match(read('.light-kit/templates/40-plan.md'), /agreed in a discussion/);
  assert.match(read('.light-kit/hooks.config.json'), /"capture-discussion": "warn"/);
});

test('project rules: a seeded file, a skill, and a before/after loop at every checkpoint', () => {
  const dir = tmp();
  install(dir, ['claude']);
  const read = (p) => readFileSync(join(dir, p), 'utf8');
  const template = read('.light-kit/templates/rules.md');
  assert.match(template, /\| `pending` \|/);
  assert.match(template, /\| `confirmed` \|/);
  assert.match(template, /`Count` is the number of tasks/);
  assert.match(template, /promotion threshold in `\.light-kit\/project-profile\.md` \(default 3\)/);
  const skill = read('.claude/skills/light-rules/SKILL.md');
  assert.match(skill, /## Before a task/);
  assert.match(skill, /## After a task/);
  assert.match(skill, /promotion threshold in `\.light-kit\/project-profile\.md` \(default 3\)/);
  assert.match(skill, /Never renumber or delete a row/);
  assert.match(skill, /only the user can demote or remove/);
  assert.match(read('.light-kit/rules.md'), /\| `pending` \|/);
  // the promotion threshold is a per-project setting, defaulting to 3
  assert.match(read('.light-kit/templates/project-profile.md'), /## Rules\nPromotion threshold: 3/);
  assert.match(skill, /\| 0 to N-1 \| `pending` \|/);
  assert.match(skill, /\| N or more \| `confirmed` \|/);
  assert.match(read('.light-kit/rules.md'), /promotion threshold in `\.light-kit\/project-profile\.md` \(default 3\)/);
  assert.match(read('CLAUDE.md'), /promotion threshold in `\.light-kit\/project-profile\.md` \(default 3\)/);
  // no kit source states the threshold as a fixed 3
  const kit = loadKit();
  const sources = [
    kit.core.body,
    ...kit.agents.map((a) => a.body),
    ...kit.skills.map((s) => s.body),
    ...kit.workflows.map((w) => w.body),
    ...kit.templates.map((t) => t.text),
  ];
  for (const text of sources) assert.doesNotMatch(text, /violated 3 times|\b3 or more\b|\b(?:at |after )?(?:three|3) (?:violations?|failures?)\b|reaches 3\b/i);
  assert.match(read('CLAUDE.md'), /Learn from repeated mistakes/);
  assert.match(read('CLAUDE.md'), /Project rules: `\.light-kit\/rules\.md`/);
  assert.match(read('.claude/skills/light-init/SKILL.md'), /create `\.light-kit\/rules\.md`/);
  assert.match(read('.claude/skills/light-implement/SKILL.md'), /apply the `light-rules` skill/);
  assert.match(read('.claude/agents/light-orchestrator.md'), /apply the `light-rules` skill/);
  assert.match(read('.claude/skills/light-review-checklist/SKILL.md'), /`confirmed` rule in `\.light-kit\/rules\.md`/);
  // the templates are kit copies, so a reinstall refreshes them; the project's own documents survive
  writeFileSync(join(dir, '.light-kit/templates/rules.md'), '# Project rules\n\n| R-001 | confirmed | 3 | Keep this template row. |\n');
  writeFileSync(join(dir, '.light-kit/rules.md'), '# Project rules\n\n| R-002 | confirmed | 3 | Keep this project row. |\n');
  install(dir, ['claude']);
  assert.doesNotMatch(read('.light-kit/templates/rules.md'), /Keep this template row/);
  assert.match(read('.light-kit/templates/rules.md'), /\| `pending` \|/);
  assert.match(read('.light-kit/rules.md'), /Keep this project row/);
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

test('bootstrap workflow and skill are generated', () => {
  const dir = tmp();
  install(dir, ['claude']);
  assert.ok(existsSync(join(dir, '.light-kit/workflows/bootstrap.md')));
  assert.ok(existsSync(join(dir, '.claude/skills/light-bootstrap/SKILL.md')));
  assert.ok(existsSync(join(dir, '.claude/skills/light-codebase-map/SKILL.md')));
});

test('adopt assessment: skill, standardize workflow and skill are generated and wired', () => {
  const dir = tmp();
  install(dir, ['claude']);
  assert.ok(existsSync(join(dir, '.claude/skills/light-project-assessment/SKILL.md')));
  assert.ok(existsSync(join(dir, '.light-kit/workflows/standardize.md')));
  assert.ok(existsSync(join(dir, '.claude/skills/light-standardize/SKILL.md')));
  const init = readFileSync(join(dir, '.claude/skills/light-init/SKILL.md'), 'utf8');
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
  assert.match(read('.claude/skills/light-request/SKILL.md'), /--review-turns/);
  assert.match(read('.claude/skills/light-init/SKILL.md'), /Review turns/);
  assert.match(read('.claude/skills/light-init/SKILL.md'), /without asking/);
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
  for (const p of ['.claude/agents', '.claude/skills', '.github/agents', '.github/skills',
    '.cursor/rules', '.codex/agents', '.agents/skills'])
    for (const n of names(p)) assert.match(n, /^light-/, `${p}/${n}`);
  const loaded = loadKit();
  for (const d of [...loaded.agents, ...loaded.skills]) assert.match(d.meta.name, /^light-/, d.meta.name);
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
  const runEntry = '  - agent: <agent>\n    part: <what this run produced>\n    model: <model id>\n    thinking: <reasoning setting or unknown>\n    level: <easy\\|medium\\|hard\\|unknown>\n';
  const headerStart = new RegExp(`^---\\nstep: <step>\\nruns:\\n${runEntry}usage:\\n`);
  const conclusionStart = new RegExp(`^---\\nstep: <step>\\nruns:\\n${runEntry}usage:\\n  - step: <step>\\n`);
  for (const t of ['00-request', '10-understanding', '20-discovery', '30-design', '40-plan', '50-implementation', '60-conclusion']) {
    const text = read(`.light-kit/templates/${t}.md`);
    const conclusion = t === '60-conclusion';
    assert.match(text, conclusion ? conclusionStart : headerStart, t);
    assert.doesNotMatch(text, /## Token usage/, t);
    const indent = conclusion ? '    ' : '  ';
    assert.equal(text.match(new RegExp(`^${indent}tokens: (.+)$`, 'm'))?.[1], placeholder, t);
    assert.match(text, new RegExp(`^${indent}time: <time spent or unknown>$`, 'm'), t);
    if (conclusion) assert.match(text, /^  - step: total\n    tokens: .+\n    time: <time spent or unknown>$/m, t);
    else assert.doesNotMatch(text, /^  - step: <step>$/m, t); // the step sits once, at the top of the header
  }
  assert.match(read('.light-kit/templates/60-conclusion.md'), /^  - step: <step>$/m);
  assert.doesNotMatch(read('.light-kit/templates/status.md'), /runs:|usage:/); // state file, not an artifact
  assert.match(read('CLAUDE.md'), /Sign your artifacts/);
  assert.match(read('CLAUDE.md'), /not the agent that only invoked it/);
  assert.match(read('CLAUDE.md'), /`part:`/);
  assert.match(read('CLAUDE.md'), /token-usage/);
  assert.match(read('CLAUDE.md'), /otherwise `unknown`, never a guess/);
  for (const s of ['light-codebase-map', 'light-project-assessment', 'light-audit']) assert.match(read(`.claude/skills/${s}/SKILL.md`), /`runs:` header/, s);
  assert.match(read('.claude/skills/light-model-routing/SKILL.md'), /`runs:` header/);
  assert.doesNotMatch(read('.light-kit/templates/50-implementation.md'), /task N: level/);
});
