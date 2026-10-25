import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install, detectProjects, detectClients } from '../tools/install.mjs';

const mk = (...parts) => { const d = mkdtempSync(join(tmpdir(), 'light-kit-ws-')); for (const p of parts) mkdirSync(join(d, p), { recursive: true }); return d; };
const cli = (dir, ...args) => spawnSync('node', ['tools/install.mjs', dir, ...args], { encoding: 'utf8' });
const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], { cwd, encoding: 'utf8' });
const asRoot = (dir, names = ['api', 'web'], clients = ['claude']) =>
  install(dir, clients, { level: 'workspace', projects: names.map((p) => ({ path: p, repo: existsSync(join(dir, p, '.git')) })) });
const hook = (root, event, payload, client = 'claude') => {
  const r = spawnSync('node', [join(root, '.light-kit/hooks/run.mjs'), '--client', client, '--event', event], { cwd: root, input: JSON.stringify({ cwd: root, ...payload }), encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
};
const bash = (command, cwd) => ({ tool_name: 'Bash', tool_input: { command }, ...(cwd && { cwd }) });
const write = (file_path, content = 'x') => ({ tool_name: 'Write', tool_input: { file_path, content } });
const setConfig = (dir, config) => writeFileSync(join(dir, '.light-kit/hooks.config.json'), JSON.stringify(config));

test('detectProjects finds nested repositories, ignores dot folders, does not descend into a project', () => {
  const d = mk('api/.git', 'apps/web/.git', 'apps/web/inner/.git', '.hidden/x/.git', 'docs/notes', 'a/b/c/.git');
  assert.deepEqual(detectProjects(d).sort(), ['api', 'apps/web']);
  assert.deepEqual(detectProjects(mk('plain')), []);
});

test('detectClients reads client folders at the root and in projects', () => {
  assert.deepEqual(detectClients(mk('.claude')), ['claude']);
  assert.deepEqual(detectClients(mk('.cursor', '.codex')), ['cursor', 'codex']);
  assert.deepEqual(detectClients(mk('.github/prompts')), ['copilot']);
  assert.deepEqual(detectClients(mk('.github')), []); // every GitHub repo has .github
  const agentsOnly = mk(); writeFileSync(join(agentsOnly, 'AGENTS.md'), '# x');
  assert.deepEqual(detectClients(agentsOnly), []); // shared by several clients, so not a signal
  const ws = mk('api/.cursor', 'web/.agents');
  assert.deepEqual(detectClients(ws, []), []);
  assert.deepEqual(detectClients(ws, ['api', 'web']), ['cursor', 'codex']);
});

test('CLI: root level auto-detected, clients detected from folders, projects registered', () => {
  const d = mk('api/.git', 'web/.git', 'web/.claude');
  const r = cli(d);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /level: workspace \(2 projects: api, web\)/);
  assert.match(r.stdout, /clients: claude \(detected from folders\)/);
  assert.match(r.stdout, /start your AI client from this folder/);
  const cfg = JSON.parse(readFileSync(join(d, 'kit.config.json'), 'utf8'));
  assert.deepEqual([cfg.level, cfg.clients, cfg.projects], ['workspace', ['claude'], ['api', 'web']]);
  const reg = readFileSync(join(d, '.light-kit/projects.md'), 'utf8');
  assert.match(reg, /\| api \| api \|/);
  assert.match(reg, /\| web \| web \|.*\| yes \|/);
  for (const p of ['api', 'web']) {
    assert.ok(existsSync(join(d, p, '.light-kit/project-profile.md')));
    assert.ok(existsSync(join(d, p, '.light-kit/hooks.config.json')));
  }
  assert.ok(existsSync(join(d, '.claude/agents/light-orchestrator.md')) && existsSync(join(d, '.claude/skills/light-project-scope/SKILL.md')));
  assert.equal(existsSync(join(d, 'api/.claude')), false); // kit files only at the root
});

test('CLI: project level for a single project; flags override detection; fallback installs everything', () => {
  const single = mk('src');
  const a = cli(single);
  assert.match(a.stdout, /level: project/);
  assert.match(a.stdout, /no client folder found, so all of them/);
  assert.equal(existsSync(join(single, '.light-kit/projects.md')), false);
  const ws = mk('api/.git', 'web/.git', '.cursor');
  const b = cli(ws, '--level', 'project', '--clients', 'codex');
  assert.match(b.stdout, /level: project/);
  assert.match(b.stdout, /clients: codex \(from --clients\)/);
  assert.equal(existsSync(join(ws, '.light-kit/projects.md')), false);
  const c = cli(mk('x/y'), '--projects', 'x/y', '--clients', 'claude');
  assert.match(c.stdout, /level: workspace \(1 project: x\/y\)/);
});

test('CLI: re-run is idempotent, reuses saved choices and picks up new projects', () => {
  const d = mk('api/.git', 'web/.git', '.claude');
  cli(d);
  const again = cli(d);
  assert.match(again.stdout, /written: 0/);
  assert.match(again.stdout, /clients: claude \(from saved config\)/);
  mkdirSync(join(d, 'billing/.git'), { recursive: true });
  const third = cli(d);
  assert.match(third.stdout, /3 projects: api, web, billing/);
  assert.ok(existsSync(join(d, 'billing/.light-kit/project-profile.md')));
});

test('project knowledge is never overwritten by upgrades', () => {
  const d = mk('api/.git');
  asRoot(d, ['api']);
  writeFileSync(join(d, 'api/.light-kit/project-profile.md'), '# api profile\nlanguage X\n');
  writeFileSync(join(d, '.light-kit/projects.md'), '# mine\n');
  asRoot(d, ['api']);
  assert.match(readFileSync(join(d, 'api/.light-kit/project-profile.md'), 'utf8'), /language X/);
  assert.equal(readFileSync(join(d, '.light-kit/projects.md'), 'utf8'), '# mine\n');
});

test('hooks: project config layers on top of the workspace config', () => {
  const d = mk('api/.git', 'web/.git'); asRoot(d);
  setConfig(d, { sensitive: { extraFiles: ['*.rootsecret'] } });
  setConfig(join(d, 'api'), { sensitive: { extraFiles: ['*.apivault'] } });
  const read = (f) => hook(d, 'pre-tool', { tool_name: 'Read', tool_input: { file_path: f } }).code;
  assert.equal(read('api/x.apivault'), 2);
  assert.equal(read('web/x.apivault'), 0); // api's rule does not leak into web
  assert.equal(read('web/y.rootsecret'), 2); // workspace rule applies everywhere
  assert.equal(read('api/y.rootsecret'), 2);
  assert.equal(hook(d, 'pre-tool', bash('cat secret.apivault', join(d, 'api'))).code, 2); // scope from the session folder
  assert.equal(hook(d, 'pre-tool', bash('cat secret.apivault', join(d, 'web'))).code, 0);
});

test('hooks: nearer layer wins for modes; protected paths hold in every project', () => {
  const d = mk('api/.git', 'web/.git'); asRoot(d);
  setConfig(join(d, 'api'), { hooks: { 'protect-paths': 'warn', 'require-spec': 'off' } });
  assert.equal(hook(d, 'pre-tool', write('web/.git/config')).code, 2);
  const warn = hook(d, 'pre-tool', write('api/.git/config'));
  assert.equal(warn.code, 0);
  assert.match(warn.out, /protected/);
  assert.equal(hook(d, 'pre-tool', write('web/.light-kit/hooks/run.mjs')).code, 2);
});

test('hooks: quality commands run in the project folder with project-relative paths', () => {
  const d = mk('api/.git', 'web/.git'); asRoot(d);
  setConfig(join(d, 'api'), { quality: { format: `node -e "require('fs').writeFileSync('formatted.txt', process.argv[1])" {file}` } });
  hook(d, 'post-tool', write('api/src/a.txt'));
  assert.equal(readFileSync(join(d, 'api/formatted.txt'), 'utf8'), 'src/a.txt');
  hook(d, 'post-tool', write('web/src/a.txt'));
  assert.equal(existsSync(join(d, 'web/formatted.txt')), false);
});

test('hooks: requests are looked up in the project and in the workspace', () => {
  const d = mk('api/.git', 'web/.git'); asRoot(d);
  const quiet = (f) => hook(d, 'pre-tool', write(f)).out === '';
  assert.equal(quiet('api/src/a.txt'), false); // nothing active: warns
  const spec = (home) => { mkdirSync(join(d, home, 'specs/001-x'), { recursive: true }); writeFileSync(join(d, home, 'specs/001-x/10-understanding.md'), '# u'); };
  spec('web');
  assert.equal(quiet('web/src/a.txt'), true);
  assert.equal(quiet('api/src/a.txt'), false); // web's request does not cover api
  spec('.');
  assert.equal(quiet('api/src/a.txt'), true); // a workspace-level request covers every project
});

test('hooks: session context points at the registry and lists project requests', () => {
  const d = mk('api/.git', 'web/.git'); asRoot(d);
  mkdirSync(join(d, 'api/specs/003-y'), { recursive: true });
  writeFileSync(join(d, 'api/specs/003-y/10-understanding.md'), '# u');
  writeFileSync(join(d, 'api/specs/003-y/status.md'), '---\nworkflow: standard\nstep: plan\nstate: in-progress\nwork_branch: feat/003-y\n---\n');
  const ctx = JSON.parse(hook(d, 'session-start', {}).out).hookSpecificOutput.additionalContext;
  assert.match(ctx, /multi-project workspace/);
  assert.match(ctx, /project-scope/);
  assert.match(ctx, /api\/specs\/003-y \(standard workflow\).*branch feat\/003-y/);
});

test('hooks: verify-on-stop runs each project\'s command, only where there are changes', () => {
  const d = mk('api', 'web');
  git(d + '/api', 'init', '-q', '-b', 'main'); git(d + '/web', 'init', '-q', '-b', 'main');
  asRoot(d);
  const fail = { verify: { command: 'node -e "console.error(\'boom\');process.exit(1)"' } };
  setConfig(d, { hooks: { 'verify-on-stop': 'block' } });
  setConfig(join(d, 'api'), fail); setConfig(join(d, 'web'), fail);
  git(d + '/web', 'add', '-A'); git(d + '/web', 'commit', '-q', '-m', 'init'); // web is clean, api has changes
  const r = JSON.parse(hook(d, 'stop', {}).out);
  assert.equal(r.decision, 'block');
  assert.match(r.reason, /failed in api/);
  assert.doesNotMatch(r.reason, /failed in web/);
  git(d + '/api', 'add', '-A'); git(d + '/api', 'commit', '-q', '-m', 'init');
  assert.equal(hook(d, 'stop', {}).out, ''); // nothing changed anywhere
});

test('hooks: branch protection looks at the repository being committed to', () => {
  const d = mk('api', 'web');
  for (const p of ['api', 'web']) { git(join(d, p), 'init', '-q', '-b', 'main'); git(join(d, p), 'commit', '-q', '--allow-empty', '-m', 'i'); }
  git(join(d, 'web'), 'checkout', '-q', '-b', 'feat/001-x');
  asRoot(d);
  assert.equal(hook(d, 'pre-tool', bash('git -C api commit -m x')).code, 2);
  assert.equal(hook(d, 'pre-tool', bash('git -C web commit -m x')).code, 0);
  assert.equal(hook(d, 'pre-tool', bash('git commit -m x', join(d, 'api'))).code, 2); // from inside the project
  assert.equal(hook(d, 'pre-tool', bash('git commit -m x', join(d, 'web'))).code, 0);
});

test('workspace instructions are generated', () => {
  const d = mk('api/.git', 'web/.git'); asRoot(d);
  const init = readFileSync(join(d, '.claude/commands/light-init.md'), 'utf8');
  assert.match(init, /Workspace procedure/);
  assert.match(readFileSync(join(d, '.claude/skills/light-request-branch/SKILL.md'), 'utf8'), /repos:/);
  assert.match(readFileSync(join(d, '.claude/agents/light-orchestrator.md'), 'utf8'), /project-scope/);
  assert.match(readFileSync(join(d, 'CLAUDE.md'), 'utf8'), /projects\.md/);
});

// ---------- user level ----------
const home = (...dirs) => mk(...dirs);
const userInstall = (h, clients) => install(h, clients, { level: 'user' });
const userHook = (h, cwd, event, payload, client = 'claude') => {
  const r = spawnSync('node', [join(h, '.light-kit/hooks/run.mjs'), '--client', client, '--event', event], { cwd, input: JSON.stringify({ cwd, ...payload }), encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
};

test('user level: files land where each client reads user-wide config', () => {
  const h = home();
  userInstall(h, ['claude', 'copilot', 'cursor', 'codex']);
  const has = (p) => existsSync(join(h, p));
  for (const p of ['.claude/agents/light-orchestrator.md', '.claude/commands/light-request.md', '.claude/skills/light-commit/SKILL.md', '.claude/CLAUDE.md', '.claude/settings.json',
    '.copilot/agents/light-reviewer.agent.md', '.copilot/skills/light-triage/SKILL.md', '.copilot/copilot-instructions.md', '.copilot/hooks/light-kit.json',
    '.cursor/commands/light-request.md', '.cursor/hooks.json',
    '.codex/agents/light-developer.toml', '.codex/prompts/light-request.md', '.codex/AGENTS.md', '.codex/hooks.json', '.agents/skills/light-triage/SKILL.md',
    '.light-kit/workflows/full.md', '.light-kit/templates/project-profile.md', '.light-kit/hooks/run.mjs', '.light-kit/hooks.config.json', '.light-kit/kit.config.json'])
    assert.ok(has(p), p);
  for (const p of ['CLAUDE.md', 'AGENTS.md', 'kit.config.json', '.github', '.cursor/rules', '.copilot/prompts', '.light-kit/project-profile.md', '.light-kit/projects.md', 'specs'])
    assert.equal(has(p), false, `${p} must not be created in the home folder`);
  assert.equal(JSON.parse(readFileSync(join(h, '.light-kit/kit.config.json'), 'utf8')).level, 'user');
});

test('user level: shared kit paths point at ~/.light-kit, project knowledge stays relative', () => {
  const h = home(); userInstall(h, ['claude']);
  const init = readFileSync(join(h, '.claude/commands/light-init.md'), 'utf8');
  assert.match(init, /~\/\.light-kit\/templates\/project-profile\.md/);
  assert.doesNotMatch(init, /[^~/]\.light-kit\/templates/);
  assert.match(init, /not enabled yet/);
  const block = readFileSync(join(h, '.claude/CLAUDE.md'), 'utf8');
  assert.match(block, /Workflows: `~\/\.light-kit\/workflows\/`/);
  assert.match(block, /Project profile: `\.light-kit\/project-profile\.md`/);
  assert.match(readFileSync(join(h, '.claude/agents/light-orchestrator.md'), 'utf8'), /\.light-kit\/projects\.md/);
  // the same kit installed at project level keeps plain relative paths
  const p = mk(); install(p, ['claude']);
  assert.doesNotMatch(readFileSync(join(p, '.claude/commands/light-init.md'), 'utf8'), /~\/\.light-kit/);
});

test('user level: hooks run from $HOME, existing user settings are kept, re-run is a no-op', () => {
  const h = home('.claude');
  writeFileSync(join(h, '.claude/settings.json'), JSON.stringify({ theme: 'x', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'my-own-stop' }] }] } }));
  writeFileSync(join(h, '.claude/CLAUDE.md'), '# My global notes\n');
  userInstall(h, ['claude']);
  const settings = JSON.parse(readFileSync(join(h, '.claude/settings.json'), 'utf8'));
  assert.equal(settings.theme, 'x');
  assert.equal(settings.hooks.Stop.length, 2);
  assert.match(JSON.stringify(settings.hooks.PreToolUse), /node \\"\$HOME\\"\/\.light-kit\/hooks\/run\.mjs --client claude --event pre-tool/);
  assert.match(readFileSync(join(h, '.claude/CLAUDE.md'), 'utf8'), /^# My global notes\n/);
  assert.equal(userInstall(h, ['claude']).written.length, 0);
});

test('user level CLI: home folder is detected, clients come from home folders, nothing found stops', () => {
  const h = home('.claude', '.codex', '.github');
  const asHome = (dir, ...a) => spawnSync('node', ['tools/install.mjs', dir, ...a], { encoding: 'utf8', env: { ...process.env, HOME: dir } });
  const notHome = cli(h, '--dry-run'); // an ordinary folder is not mistaken for the home folder
  assert.match(notHome.stdout, /level: project/);
  const r = asHome(h);
  assert.match(r.stdout, /level: user/);
  assert.match(r.stdout, /clients: claude, codex \(detected from folders\)/);
  assert.match(r.stdout, /restart your AI clients/);
  assert.ok(existsSync(join(h, '.light-kit/kit.config.json')));
  const again = asHome(h);
  assert.match(again.stdout, /written: 0/);
  assert.match(again.stdout, /from saved config/);
  const empty = cli(home(), '--level', 'user');
  assert.equal(empty.status, 2);
  assert.match(empty.stderr, /No client folder/);
  const withClients = cli(home(), '--level', 'user', '--clients', 'cursor');
  assert.equal(withClients.status, 0, withClients.stderr);
  assert.match(withClients.stdout, /Cursor: user rules live in its settings/);
});

test('user level hooks: safety applies in every project, workflow hooks only where the kit is enabled', () => {
  const h = home('code/plain', 'code/enabled/.light-kit'); userInstall(h, ['claude']);
  const plain = join(realpathOf(h), 'code/plain'), enabled = join(realpathOf(h), 'code/enabled');
  for (const git0 of [plain, enabled]) { git(git0, 'init', '-q', '-b', 'main'); git(git0, 'commit', '-q', '--allow-empty', '-m', 'i'); }
  const rd = (cwd, f) => userHook(h, cwd, 'pre-tool', { tool_name: 'Read', tool_input: { file_path: f } });
  assert.equal(rd(plain, '.env').code, 2); // safety: everywhere
  assert.equal(rd(enabled, '.env').code, 2);
  assert.equal(userHook(h, plain, 'pre-tool', bash('rm -rf /')).code, 2);
  const wr = (cwd, f) => userHook(h, cwd, 'pre-tool', write(f));
  assert.equal(wr(plain, 'src/a.txt').out, ''); // no spec warning in a project that does not use the kit
  assert.match(wr(enabled, 'src/a.txt').out, /no active request/);
  assert.equal(userHook(h, plain, 'pre-tool', bash('git commit -m x')).code, 0); // not forced on other repos
  assert.equal(userHook(h, enabled, 'pre-tool', bash('git commit -m x')).code, 2);
  assert.match(JSON.parse(userHook(h, plain, 'session-start', {}).out).hookSpecificOutput.additionalContext, /run the `light-init` command/);
  assert.match(JSON.parse(userHook(h, enabled, 'session-start', {}).out || '{"hookSpecificOutput":{"additionalContext":""}}').hookSpecificOutput.additionalContext, /^((?!not set up).)*$/s);
});

function realpathOf(p) { return spawnSync('node', ['-e', 'console.log(require("fs").realpathSync(process.argv[1]))', p], { encoding: 'utf8' }).stdout.trim(); }

test('user level hooks: user, workspace and project settings stack; suggestInit can be switched off', () => {
  const h = home('ws/api/.light-kit', 'ws/.light-kit', 'solo'); userInstall(h, ['claude']);
  const real = realpathOf(h);
  writeFileSync(join(h, '.light-kit/hooks.config.json'), JSON.stringify({ sensitive: { extraFiles: ['*.mine'] }, session: { suggestInit: false } }));
  writeFileSync(join(real, 'ws/.light-kit/hooks.config.json'), JSON.stringify({ sensitive: { extraFiles: ['*.wsfile'] } }));
  writeFileSync(join(real, 'ws/api/.light-kit/hooks.config.json'), JSON.stringify({ sensitive: { extraFiles: ['*.apifile'] } }));
  const api = join(real, 'ws/api');
  const rd = (cwd, f) => userHook(h, cwd, 'pre-tool', { tool_name: 'Read', tool_input: { file_path: join(cwd, f) } }).code;
  assert.deepEqual(['a.mine', 'a.wsfile', 'a.apifile'].map((f) => rd(api, f)), [2, 2, 2]);
  assert.deepEqual(['a.mine', 'a.wsfile', 'a.apifile'].map((f) => rd(join(real, 'ws'), f)), [2, 2, 0]);
  assert.deepEqual(['a.mine', 'a.wsfile', 'a.apifile'].map((f) => rd(join(real, 'solo'), f)), [2, 0, 0]);
  assert.equal(userHook(h, join(real, 'solo'), 'session-start', {}).out, '');
});

test('user level hooks: a project with its own registration for the client handles itself', () => {
  const h = home('proj'); userInstall(h, ['claude']);
  const proj = join(realpathOf(h), 'proj');
  install(proj, ['claude']); // project-level install carries its own .claude/settings.json hooks
  const viaUser = userHook(h, proj, 'pre-tool', { tool_name: 'Read', tool_input: { file_path: '.env' } });
  assert.equal(viaUser.code, 0); // the user-level script steps aside; the project's own copy is the one registered
  const own = spawnSync('node', [join(proj, '.light-kit/hooks/run.mjs'), '--client', 'claude', '--event', 'pre-tool'], { cwd: proj, input: JSON.stringify({ cwd: proj, tool_name: 'Read', tool_input: { file_path: '.env' } }), encoding: 'utf8' });
  assert.equal(own.status, 2);
});

test('CLI: pointing at a client folder installs in its parent, for that client only', () => {
  const asHome = (dir, ...a) => spawnSync('node', ['tools/install.mjs', ...a], { encoding: 'utf8', env: { ...process.env, HOME: dir } });
  const h = mk('.claude');
  writeFileSync(join(h, '.claude/CLAUDE.md'), '# my notes\n');
  mkdirSync(join(h, '.claude/agents'));
  writeFileSync(join(h, '.claude/agents/mine.md'), 'mine');
  const r = asHome(h, join(h, '.claude'));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /is the claude client folder, so installing into/);
  assert.match(r.stdout, /level: user/);
  assert.match(r.stdout, /clients: claude \(from the folder you gave\)/);
  assert.ok(existsSync(join(h, '.claude/agents/light-orchestrator.md')));
  assert.ok(existsSync(join(h, '.light-kit/hooks/run.mjs')));
  assert.equal(existsSync(join(h, '.claude/.claude')), false); // no nesting
  assert.equal(existsSync(join(h, '.claude/.light-kit')), false);
  assert.equal(existsSync(join(h, '.claude/kit.config.json')), false);
  assert.equal(existsSync(join(h, '.codex')), false); // only the client that was named
  assert.match(readFileSync(join(h, '.claude/CLAUDE.md'), 'utf8'), /^# my notes\n/);
  assert.equal(readFileSync(join(h, '.claude/agents/mine.md'), 'utf8'), 'mine');
  // adding another client later keeps the earlier one in the saved config
  const again = asHome(h, join(h, '.codex'));
  assert.match(again.stdout, /clients: codex/);
  assert.deepEqual(JSON.parse(readFileSync(join(h, '.light-kit/kit.config.json'), 'utf8')).clients, ['claude', 'codex']);
  // other folders map the same way, and a project's client folder means a project install
  const p = mk('proj/.cursor');
  const c = spawnSync('node', ['tools/install.mjs', join(p, 'proj/.cursor')], { encoding: 'utf8' });
  assert.match(c.stdout, /level: project/);
  assert.ok(existsSync(join(p, 'proj/.cursor/rules/light-kit-core.mdc')));
  assert.equal(existsSync(join(p, 'proj/.cursor/.cursor')), false);
  const h2 = mk('.agents');
  const agents = asHome(h2, '--dry-run', join(h2, '.agents'));
  assert.match(agents.stdout, /is the codex client folder/);
  assert.match(agents.stdout, /clients: codex \(from the folder you gave\)/);
});
