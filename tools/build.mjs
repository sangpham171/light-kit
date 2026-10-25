// Generator: canonical kit/ -> per-client files. Pure (no disk writes); install.mjs writes the result.
// Client file conventions live in the CLIENTS table below — the single place to update when a client changes.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'kit');
export const GENERATED = '<!-- light-kit:generated -->';
export const isManaged = (text) => text.includes('light-kit:generated');
export const START = '<!-- light-kit:start -->';
export const END = '<!-- light-kit:end -->';
export const SHARED_DIR = '.light-kit';

// ---------- canonical format ----------
export function parseDoc(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('missing frontmatter');
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    meta[kv[1]] = v.startsWith('[') && v.endsWith(']')
      ? v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
      : v.replace(/^"(.*)"$/, '$1');
  }
  return { meta, body: m[2].replace(/^\n+/, '') };
}

const q = (s) => JSON.stringify(String(s)); // safe YAML scalar

function load(dir) {
  const p = join(KIT_DIR, dir);
  if (!existsSync(p)) return [];
  return readdirSync(p).sort().flatMap((f) => {
    const full = join(p, f);
    if (statSync(full).isDirectory()) {
      const skill = join(full, 'SKILL.md');
      return existsSync(skill) ? [{ file: f, ...parseDoc(readFileSync(skill, 'utf8')) }] : [];
    }
    return f.endsWith('.md') ? [{ file: f.replace(/\.md$/, ''), ...parseDoc(readFileSync(full, 'utf8')) }] : [];
  });
}

function loadHooks() {
  const base = join(KIT_DIR, 'hooks');
  const walk = (dir) => readdirSync(dir).sort().flatMap((f) => {
    const full = join(dir, f);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
  return walk(base).map((full) => ({ rel: full.slice(base.length + 1), text: readFileSync(full, 'utf8') }));
}

export function loadKit() {
  return {
    hooks: loadHooks(),
    agents: load('agents'), skills: load('skills'), prompts: load('prompts'),
    workflows: load('workflows'), profiles: load('profiles'),
    core: load('instructions').find((d) => d.meta.name === 'core'),
    templates: readdirSync(join(KIT_DIR, 'templates')).sort().map((f) => ({ file: f, text: readFileSync(join(KIT_DIR, 'templates', f), 'utf8') })),
  };
}

// ---------- lint ----------
export function lint(kit) {
  const errors = [];
  const names = new Set(kit.agents.map((a) => a.meta.name));
  const skills = new Set(kit.skills.map((s) => s.meta.name));
  for (const d of [...kit.agents, ...kit.skills, ...kit.prompts, ...kit.workflows, ...kit.profiles])
    for (const k of ['name', 'description'])
      if (!d.meta[k]) errors.push(`${d.file}: missing ${k}`);
  for (const s of kit.workflows) {
    for (const m of s.body.matchAll(/agents?:\s*([\w-]+(?:,\s*[\w-]+)*)/g))
      for (const a of m[1].split(/,\s*/)) if (!names.has(a)) errors.push(`workflow ${s.meta.name}: unknown agent ${a}`);
    for (const m of s.body.matchAll(/skill:\s*([\w-]+)/g))
      if (!skills.has(m[1])) errors.push(`workflow ${s.meta.name}: unknown skill ${m[1]}`);
  }
  return errors;
}

// ---------- per-client tables ----------
// Copilot tool names vary by version, so its agents omit `tools` (inherit all) and rely on the instructions.
const TOOLS = {
  claude: { read: ['Read', 'Grep', 'Glob'], search: ['Grep', 'Glob'], write: ['Write', 'Edit'], execute: ['Bash'] },
};
const mapTools = (client, tools = []) => [...new Set(tools.flatMap((t) => TOOLS[client][t] ?? []))];

// How a prompt refers to the user's text, per client.
const ARGS = {
  claude: '$ARGUMENTS',
  codex: '$ARGUMENTS',
  copilot: '${input:request:What do you want?}',
  cursor: "the text the user typed after the command",
};

const fm = (obj) => `---\n${Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n`;
const withMarker = (frontmatter, body) => `${frontmatter}${GENERATED}\n\n${body.trimEnd()}\n`;
const promptBody = (client, p) => p.body.replaceAll('$ARGUMENTS', ARGS[client]);

const PARALLEL_NOTE = {
  claude: '',
  copilot: '\n> Parallel steps: run them one after another (this client has no parallel subagents here).\n',
  cursor: '\n> Parallel steps: run them one after another (this client has no parallel subagents here).\n',
  codex: '',
};

// Core instructions + pointers to the shared folder; goes in a marked block of the client's instruction file.
export function instructionBlock(kit, client, shared = SHARED_DIR) {
  return `${START}\n${kit.core.body.trimEnd()}\n\n## Kit files\nWorkflows: \`${shared}/workflows/\` · Artifact templates: \`${shared}/templates/\` · Init profiles: \`${shared}/profiles/\` · Project profile: \`${SHARED_DIR}/project-profile.md\`${PARALLEL_NOTE[client]}${END}\n`;
}

const agentList = (kit) => kit.agents.map((a) => `- **${a.meta.name}** — ${a.meta.description}`).join('\n');

const CLIENTS = {
  claude(kit) {
    const out = [];
    for (const a of kit.agents)
      out.push({ path: `.claude/agents/${a.meta.name}.md`, content: withMarker(fm({ name: a.meta.name, description: q(a.meta.description), tools: mapTools('claude', a.meta.tools).join(', ') }), a.body) });
    for (const p of kit.prompts)
      out.push({ path: `.claude/commands/${p.meta.name}.md`, content: withMarker(fm({ description: q(p.meta.description), 'argument-hint': p.meta['argument-hint'] && q(p.meta['argument-hint']) }), promptBody('claude', p)) });
    for (const s of kit.skills)
      out.push({ path: `.claude/skills/${s.meta.name}/SKILL.md`, content: withMarker(fm({ name: s.meta.name, description: q(s.meta.description) }), s.body) });
    out.push({ path: 'CLAUDE.md', block: instructionBlock(kit, 'claude') });
    return out;
  },
  copilot(kit) {
    const out = [];
    for (const a of kit.agents)
      out.push({ path: `.github/agents/${a.meta.name}.agent.md`, content: withMarker(fm({ name: a.meta.name, description: q(a.meta.description) }), a.body) });
    for (const p of kit.prompts)
      out.push({ path: `.github/prompts/${p.meta.name}.prompt.md`, content: withMarker(fm({ description: q(p.meta.description), agent: 'agent' }), promptBody('copilot', p)) });
    for (const s of kit.skills)
      out.push({ path: `.github/skills/${s.meta.name}/SKILL.md`, content: withMarker(fm({ name: s.meta.name, description: q(s.meta.description) }), s.body) });
    out.push({ path: '.github/copilot-instructions.md', block: instructionBlock(kit, 'copilot') });
    return out;
  },
  cursor(kit) {
    const out = [];
    const rule = (name, description, body, alwaysApply = false) =>
      ({ path: `.cursor/rules/${name}.mdc`, content: withMarker(fm({ description: description.replace(/\n/g, ' '), alwaysApply }), body) });
    out.push(rule('light-kit-core', kit.core.meta.description, instructionBlock(kit, 'cursor').replace(START, '').replace(END, ''), true));
    for (const a of kit.agents) out.push(rule(`agent-${a.meta.name}`, `Agent role: ${a.meta.description}`, a.body));
    for (const s of kit.skills) out.push(rule(`skill-${s.meta.name}`, s.meta.description, s.body));
    for (const p of kit.prompts)
      out.push({ path: `.cursor/commands/${p.meta.name}.md`, content: `${GENERATED}\n\n${promptBody('cursor', p).trimEnd()}\n` });
    return out;
  },
  codex(kit) {
    const out = [];
    const tq = (v) => JSON.stringify(String(v)); // TOML basic string
    for (const a of kit.agents)
      out.push({ path: `.codex/agents/${a.meta.name}.toml`, content: `# light-kit:generated\nname = ${tq(a.meta.name)}\ndescription = ${tq(a.meta.description)}\ndeveloper_instructions = \'\'\'\n${a.body.trimEnd()}\n\'\'\'\n` });
    for (const s of kit.skills)
      out.push({ path: `.agents/skills/${s.meta.name}/SKILL.md`, content: withMarker(fm({ name: s.meta.name, description: q(s.meta.description) }), s.body) });
    // Custom prompts are not confirmed for project scope; emitted for manual copy to ~/.codex/prompts.
    for (const p of kit.prompts)
      out.push({ path: `.codex/prompts/${p.meta.name}.md`, content: withMarker(fm({ description: q(p.meta.description), 'argument-hint': p.meta['argument-hint'] && q(p.meta['argument-hint']) }), promptBody('codex', p)) });
    return out;
  },
};
export const CLIENT_NAMES = Object.keys(CLIENTS);

// ---------- hooks ----------
export const HOOK_MARK = '.light-kit/hooks/run.mjs';
const EVENTS = ['pre-tool', 'post-tool', 'prompt', 'session-start', 'stop'];
const TOOL_MATCH = {
  claude: { pre: 'Bash|Read|Write|Edit|MultiEdit|NotebookEdit', post: 'Bash|Read|Write|Edit|MultiEdit|NotebookEdit' },
  codex: { pre: 'Bash|apply_patch|Edit|Write', post: 'Bash|apply_patch|Edit|Write' },
  cursor: { pre: 'Shell|Read|Write|Delete', post: 'Shell|Read|Write' },
};
// Per client: file, shape and event names. Copilot has no verified "stop" payload, so it gets no stop hook.
const HOOK_CLIENTS = {
  claude: { path: '.claude/settings.json', shape: 'grouped', prefix: '"$CLAUDE_PROJECT_DIR"/', names: { 'pre-tool': 'PreToolUse', 'post-tool': 'PostToolUse', prompt: 'UserPromptSubmit', 'session-start': 'SessionStart', stop: 'Stop' } },
  codex: { path: '.codex/hooks.json', shape: 'grouped', prefix: '"$(git rev-parse --show-toplevel)"/', names: { 'pre-tool': 'PreToolUse', 'post-tool': 'PostToolUse', prompt: 'UserPromptSubmit', 'session-start': 'SessionStart', stop: 'Stop' } },
  cursor: { path: '.cursor/hooks.json', shape: 'flat', prefix: '', names: { 'pre-tool': 'preToolUse', 'post-tool': 'postToolUse', prompt: 'beforeSubmitPrompt', 'session-start': 'sessionStart', stop: 'stop' } },
  copilot: { path: '.github/hooks/light-kit.json', shape: 'copilot', prefix: '', names: { 'pre-tool': 'preToolUse', 'post-tool': 'postToolUse', prompt: 'userPromptSubmitted', 'session-start': 'sessionStart' } },
};

export function hookRegistration(client, level = 'project') {
  const c = HOOK_CLIENTS[client];
  const prefix = level === 'user' ? '"$HOME"/' : c.prefix;
  const hooks = {};
  for (const ev of EVENTS) {
    const name = c.names[ev];
    if (!name) continue;
    const command = `node ${prefix}${HOOK_MARK} --client ${client} --event ${ev}`;
    const matcher = ev === 'pre-tool' ? TOOL_MATCH[client]?.pre : ev === 'post-tool' ? TOOL_MATCH[client]?.post : undefined;
    if (c.shape === 'grouped') hooks[name] = [{ ...(matcher && { matcher }), hooks: [{ type: 'command', command, timeout: 60 }] }];
    else if (c.shape === 'flat') hooks[name] = [{ command, ...(matcher && { matcher }), timeout: 60 }];
    else hooks[name] = [{ type: 'command', command, timeoutSec: 60 }];
  }
  // Claude Code adds a co-author trailer and PR credit by itself; switch both off unless the user already set their own value.
  const defaults = client === 'claude' ? { attribution: { commit: '', pr: '' } } : undefined;
  return { path: level === 'user' ? USER_PATHS[client](c.path) : c.path, hooks: { ...(c.shape !== 'grouped' && { version: 1 }), hooks }, defaults };
}

// Merge our entries into a client's hooks JSON, keeping the user's own hooks. Replaces any earlier light-kit entries.
export function mergeHooks(existingText, desired) {
  const cur = existingText ? JSON.parse(existingText) : {};
  cur.hooks ??= {};
  if (desired.version) cur.version ??= desired.version;
  for (const [k, v] of Object.entries(desired.defaults ?? {})) cur[k] ??= v; // only keys the user has not set
  for (const [ev, list] of Object.entries(cur.hooks)) {
    const kept = list.filter((e) => !JSON.stringify(e).includes(HOOK_MARK));
    if (kept.length) cur.hooks[ev] = kept; else delete cur.hooks[ev];
  }
  for (const [ev, list] of Object.entries(desired.hooks)) cur.hooks[ev] = [...(cur.hooks[ev] ?? []), ...list];
  return JSON.stringify(cur, null, 2) + '\n';
}

// ---------- user level (the kit installed once in the home folder, for every project) ----------
// Where each client reads user-wide files. null = no user-level equivalent, so the file is not installed.
const USER_PATHS = {
  claude: (p) => (p === 'CLAUDE.md' ? '.claude/CLAUDE.md' : p),
  copilot: (p) => {
    if (p.startsWith('.github/prompts/')) return null;
    if (p === '.github/copilot-instructions.md') return '.copilot/copilot-instructions.md';
    return p.replace(/^\.github\/(agents|skills|hooks)\//, '.copilot/$1/');
  },
  cursor: (p) => (p.startsWith('.cursor/rules/') ? null : p),
  codex: (p) => (p === 'AGENTS.md' ? '.codex/AGENTS.md' : p),
};
export const USER_NOTES = {
  copilot: 'Copilot: prompt files are not installed at user level (VS Code keeps them in its own profile folder); agents, skills, instructions and hooks are.',
  cursor: 'Cursor: user rules live in its settings, not in files, so only commands and hooks are installed globally. Use a project-level install to get agent roles and skills as rules.',
};
export const USER_CLIENT_FOLDERS = {
  claude: (has) => has('.claude'),
  copilot: (has) => has('.copilot'),
  cursor: (has) => has('.cursor'),
  codex: (has) => has('.codex') || has('.agents'),
};
export const USER_SHARED = '~/.light-kit';

// Shared kit files sit in ~/.light-kit at user level; project knowledge stays in each project's own .light-kit.
const adaptText = (t) => t.replace(/(?<![~\w/])\.light-kit\/(workflows|templates|profiles)\b/g, `${USER_SHARED}/$1`);
const adaptDocs = (list) => list.map((d) => ({ ...d, body: adaptText(d.body) }));
export function adaptKit(kit) {
  return { ...kit, agents: adaptDocs(kit.agents), skills: adaptDocs(kit.skills), prompts: adaptDocs(kit.prompts), workflows: adaptDocs(kit.workflows), profiles: adaptDocs(kit.profiles), core: { ...kit.core, body: adaptText(kit.core.body) } };
}

// Seed files are written once and never overwritten: they hold knowledge that people and `init` fill in.
export const CLIENT_FOLDERS = {
  claude: (has) => has('.claude') || has('CLAUDE.md'),
  cursor: (has) => has('.cursor'),
  copilot: (has) => ['.github/copilot-instructions.md', '.github/agents', '.github/prompts', '.github/instructions', '.github/hooks'].some(has),
  codex: (has) => has('.codex') || has('.agents'),
};

export function build(kitIn, clients, { hooks = true, level = 'project', projects = [] } = {}) {
  const user = level === 'user';
  const kit = user ? adaptKit(kitIn) : kitIn;
  const unknown = clients.filter((c) => !CLIENTS[c]);
  if (unknown.length) throw new Error(`unknown client(s): ${unknown.join(', ')} (known: ${CLIENT_NAMES.join(', ')})`);
  const files = [];
  // Shared by every client.
  for (const s of kit.workflows) files.push({ path: `${SHARED_DIR}/workflows/${s.file}.md`, content: `${GENERATED}\n\n${s.body.trimEnd()}\n` });
  for (const p of kit.profiles) files.push({ path: `${SHARED_DIR}/profiles/${p.file}.md`, content: `${GENERATED}\n\n${p.body.trimEnd()}\n` });
  // Every template is kept in the shared folder: `init` seeds a project's own files from them.
  for (const t of kit.templates) files.push({ path: `${SHARED_DIR}/templates/${t.file}`, content: t.text, seed: true });
  // Seed only: no generated marker, so the installer never overwrites it once init has filled it in.
  // (At user level there is no single project, so `init` creates each project's profile from the template.)
  if (!user) files.push({ path: `${SHARED_DIR}/project-profile.md`, content: kit.templates.find((t) => t.file === 'project-profile.md').text, seed: true });
  if (level === 'workspace') {
    const tpl = (name) => kit.templates.find((t) => t.file === name).text;
    const rows = projects.map((x) => `| ${x.path.split('/').pop()} | ${x.path} | <to fill> | <to fill> | ${x.repo ? 'yes' : 'no'} | <to fill> |`).join('\n');
    files.push({ path: `${SHARED_DIR}/projects.md`, content: tpl('projects.md').trimEnd() + (rows ? `\n${rows}` : '') + '\n', seed: true });
    for (const x of projects) {
      files.push({ path: `${x.path}/${SHARED_DIR}/project-profile.md`, content: tpl('project-profile.md'), seed: true });
      files.push({ path: `${x.path}/${SHARED_DIR}/hooks.config.json`, content: tpl('project-hooks.config.json'), seed: true });
    }
  }
  // AGENTS.md is read by Copilot, Cursor and Codex; Claude Code uses CLAUDE.md.
  const shared = user ? USER_SHARED : SHARED_DIR;
  const agentsClient = clients.find((c) => c !== 'claude') ?? 'codex';
  const agentsBlock = { block: `${instructionBlock(kit, agentsClient, shared).replace(END, '')}\n## Agents\n${agentList(kit)}\n${END}` };
  if (user) { if (clients.includes('codex')) files.push({ path: USER_PATHS.codex('AGENTS.md'), ...agentsBlock }); } // only Codex reads a global AGENTS.md
  else if (clients.some((c) => c !== 'claude')) files.push({ path: 'AGENTS.md', ...agentsBlock });
  for (const c of clients) {
    const own = CLIENTS[c](kit).map((f) => (f.block ? { ...f, block: instructionBlock(kit, c, shared) } : f));
    files.push(...(user ? own.map((f) => ({ ...f, path: USER_PATHS[c](f.path) })).filter((f) => f.path) : own));
  }
  if (hooks) {
    for (const h of kit.hooks) {
      if (h.rel === 'hooks.config.json') files.push({ path: `${SHARED_DIR}/hooks.config.json`, content: h.text, seed: true }); // seed: never overwritten
      else if (h.rel.endsWith('.md')) files.push({ path: `${SHARED_DIR}/hooks/${h.rel}`, content: `${GENERATED}\n\n${h.text.trimEnd()}\n` });
      else files.push({ path: `${SHARED_DIR}/hooks/${h.rel}`, content: `// light-kit:generated\n${h.text}` });
    }
    for (const c of clients) files.push(hookRegistration(c, level));
  }
  return files;
}
