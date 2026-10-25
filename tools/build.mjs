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
export function instructionBlock(kit, client) {
  return `${START}\n${kit.core.body.trimEnd()}\n\n## Kit files\nWorkflows: \`${SHARED_DIR}/workflows/\` · Artifact templates: \`${SHARED_DIR}/templates/\` · Init profiles: \`${SHARED_DIR}/profiles/\` · Project profile: \`${SHARED_DIR}/project-profile.md\`${PARALLEL_NOTE[client]}${END}\n`;
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

export function hookRegistration(client) {
  const c = HOOK_CLIENTS[client];
  const hooks = {};
  for (const ev of EVENTS) {
    const name = c.names[ev];
    if (!name) continue;
    const command = `node ${c.prefix}${HOOK_MARK} --client ${client} --event ${ev}`;
    const matcher = ev === 'pre-tool' ? TOOL_MATCH[client]?.pre : ev === 'post-tool' ? TOOL_MATCH[client]?.post : undefined;
    if (c.shape === 'grouped') hooks[name] = [{ ...(matcher && { matcher }), hooks: [{ type: 'command', command, timeout: 60 }] }];
    else if (c.shape === 'flat') hooks[name] = [{ command, ...(matcher && { matcher }), timeout: 60 }];
    else hooks[name] = [{ type: 'command', command, timeoutSec: 60 }];
  }
  return { path: c.path, hooks: { ...(c.shape !== 'grouped' && { version: 1 }), hooks } };
}

// Merge our entries into a client's hooks JSON, keeping the user's own hooks. Replaces any earlier light-kit entries.
export function mergeHooks(existingText, desired) {
  const cur = existingText ? JSON.parse(existingText) : {};
  cur.hooks ??= {};
  if (desired.version) cur.version ??= desired.version;
  for (const [ev, list] of Object.entries(cur.hooks)) {
    const kept = list.filter((e) => !JSON.stringify(e).includes(HOOK_MARK));
    if (kept.length) cur.hooks[ev] = kept; else delete cur.hooks[ev];
  }
  for (const [ev, list] of Object.entries(desired.hooks)) cur.hooks[ev] = [...(cur.hooks[ev] ?? []), ...list];
  return JSON.stringify(cur, null, 2) + '\n';
}

export function build(kit, clients, { hooks = true } = {}) {
  const unknown = clients.filter((c) => !CLIENTS[c]);
  if (unknown.length) throw new Error(`unknown client(s): ${unknown.join(', ')} (known: ${CLIENT_NAMES.join(', ')})`);
  const files = [];
  // Shared by every client.
  for (const s of kit.workflows) files.push({ path: `${SHARED_DIR}/workflows/${s.file}.md`, content: `${GENERATED}\n\n${s.body.trimEnd()}\n` });
  for (const p of kit.profiles) files.push({ path: `${SHARED_DIR}/profiles/${p.file}.md`, content: `${GENERATED}\n\n${p.body.trimEnd()}\n` });
  for (const t of kit.templates) {
    if (t.file === 'project-profile.md') continue;
    files.push({ path: `${SHARED_DIR}/templates/${t.file}`, content: t.text });
  }
  // Seed only: no generated marker, so the installer never overwrites it once init has filled it in.
  const seed = kit.templates.find((t) => t.file === 'project-profile.md');
  files.push({ path: `${SHARED_DIR}/project-profile.md`, content: seed.text });
  // AGENTS.md is read by Copilot, Cursor and Codex; Claude Code uses CLAUDE.md.
  const agentsClient = clients.find((c) => c !== 'claude') ?? 'codex';
  if (clients.some((c) => c !== 'claude'))
    files.push({ path: 'AGENTS.md', block: `${instructionBlock(kit, agentsClient).replace(END, '')}\n## Agents\n${agentList(kit)}\n${END}` });
  for (const c of clients) files.push(...CLIENTS[c](kit));
  if (hooks) {
    for (const h of kit.hooks) {
      if (h.rel === 'hooks.config.json') files.push({ path: `${SHARED_DIR}/hooks.config.json`, content: h.text }); // seed: never overwritten
      else if (h.rel.endsWith('.md')) files.push({ path: `${SHARED_DIR}/hooks/${h.rel}`, content: `${GENERATED}\n\n${h.text.trimEnd()}\n` });
      else files.push({ path: `${SHARED_DIR}/hooks/${h.rel}`, content: `// light-kit:generated\n${h.text}` });
    }
    for (const c of clients) files.push(hookRegistration(c));
  }
  return files;
}
