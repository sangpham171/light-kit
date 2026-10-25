// light-kit audit: measures what the kit costs in context and finds orphans, stale references and repeated text.
// Usage: node audit.mjs [--source <kit dir>] [--json] [--record <model>]
//  installed kit (this file lives in .light-kit/audit/): audits the files the kit generated in that folder
//  kit repository (this file lives in kit/audit/): audits the canonical sources in kit/
// It only reads, except --record, which notes the model the kit was last audited with.
import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const START = '<!-- light-kit:start -->', END = '<!-- light-kit:end -->';
const PURPOSES = ['compensation', 'preference', 'enforcement', 'structure'];
const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
const tokens = (s) => Math.ceil(String(s).length / 4);
const read = (p) => readFileSync(p, 'utf8');
const list = (dir) => { try { return readdirSync(dir, { withFileTypes: true }); } catch { return []; } };

function parseDoc(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split('\n')) { const kv = line.match(/^([\w-]+):\s*(.*)$/); if (kv) meta[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1'); }
  return { meta, body: m[2].replace(/^\n+/, '').replace(/^<!-- light-kit:generated -->\n+/, '') };
}

// ---- the always-loaded instructions, split into sections and numbered rules
function coreParts(text, rules) {
  const t = text.includes(START) ? text.slice(text.indexOf(START) + START.length, text.indexOf(END)) : parseDoc(text).body;
  const parts = [];
  const chunks = t.split(/^## /m);
  parts.push({ type: 'instruction', id: 'section: intro', purpose: rules['intro'] ?? 'structure', text: chunks[0] });
  for (const c of chunks.slice(1)) {
    const title = c.split('\n')[0].trim();
    if (title === 'Rules') {
      for (const item of c.split('\n').slice(1).join('\n').split(/^(?=\d+\. )/m).filter((x) => /^\d+\. /.test(x))) {
        const name = (item.match(/\*\*(.+?)\*\*/)?.[1] ?? 'rule').replace(/\.$/, '');
        parts.push({ type: 'rule', id: `rule ${item.match(/^(\d+)/)[1]}: ${name}`, purpose: rules[`Rules: ${name}`], text: item });
      }
    } else parts.push({ type: 'instruction', id: `section: ${title}`, purpose: rules[title], text: c });
  }
  return parts;
}

// ---- collection: kit repository
function fromSource(dir) {
  const rules = JSON.parse(read(join(dir, 'audit', 'rules.json')));
  const comps = [];
  for (const [type, sub] of [['agent', 'agents'], ['prompt', 'prompts'], ['workflow', 'workflows']])
    for (const f of list(join(dir, sub)).filter((e) => e.name.endsWith('.md'))) {
      const d = parseDoc(read(join(dir, sub, f.name)));
      comps.push({ type, id: d.meta.name ?? f.name, purpose: d.meta.purpose, description: d.meta.description ?? '', text: d.body });
    }
  for (const e of list(join(dir, 'skills')).filter((x) => x.isDirectory())) {
    const d = parseDoc(read(join(dir, 'skills', e.name, 'SKILL.md')));
    comps.push({ type: 'skill', id: d.meta.name ?? e.name, purpose: d.meta.purpose, description: d.meta.description ?? '', text: d.body });
  }
  for (const f of list(join(dir, 'templates'))) comps.push({ type: 'template', id: f.name, purpose: 'structure', text: read(join(dir, 'templates', f.name)) });
  comps.push(...coreParts(read(join(dir, 'instructions', 'core.md')), rules));
  const guards = list(join(dir, 'hooks', 'checks')).filter((f) => f.name.endsWith('.mjs') && f.name !== 'index.mjs').map((f) => f.name.replace(/\.mjs$/, ''));
  return { mode: 'source', where: dir, comps, guards };
}

// ---- collection: installed kit
function fromInstalled(root) {
  const manifest = JSON.parse(read(join(root, '.light-kit', 'audit', 'manifest.json')));
  const comps = [];
  for (const c of manifest.components) {
    const file = c.files.map((f) => join(root, f)).find((f) => existsSync(f));
    comps.push({ ...c, text: file ? parseDoc(read(file)).body : '', missingFile: !file });
  }
  for (const f of list(join(root, '.light-kit', 'templates'))) comps.push({ type: 'template', id: f.name, purpose: 'structure', text: read(join(root, '.light-kit', 'templates', f.name)) });
  // CLAUDE.md-style files hold the plain core block; AGENTS.md adds an agent list, so it is the fallback
  const order = [...manifest.instructionFiles].sort((a, b) => /AGENTS\.md$/.test(a) - /AGENTS\.md$/.test(b));
  const instr = order.map((f) => join(root, f)).find((f) => existsSync(f) && read(f).includes(START));
  if (instr) comps.push(...coreParts(read(instr), manifest.rules));
  const guards = list(join(root, '.light-kit', 'hooks', 'checks')).filter((f) => f.name.endsWith('.mjs') && f.name !== 'index.mjs').map((f) => f.name.replace(/\.mjs$/, ''));
  return { mode: 'installed', where: root, comps, guards, level: manifest.level, clients: manifest.clients };
}

// ---- analysis
const ID = /(?<![.\w-])(light-[a-z][a-z-]*[a-z])/g;
const normalise = (s) => s.toLowerCase().replace(/[`*_>#|]/g, '').replace(/^[-\d.\s]+/, '').replace(/\s+/g, ' ').replace(/[.:;,\s]+$/, '').trim();

function analyse(k) {
  const comps = k.comps.map((c) => ({ ...c, tokens: tokens(c.text), purpose: PURPOSES.includes(c.purpose) ? c.purpose : 'unclassified' }));
  const known = new Set(comps.filter((c) => ['agent', 'skill', 'prompt'].includes(c.type)).map((c) => c.id));
  const index = comps.filter((c) => known.has(c.id)).reduce((n, c) => n + tokens(`${c.id} ${c.description ?? ''}`), 0);
  const core = comps.filter((c) => c.type === 'rule' || c.type === 'instruction').reduce((n, c) => n + c.tokens, 0);

  // who refers to whom; the Roles and Commands lists only enumerate, so they do not count as use
  const usedBy = new Map([...known].map((id) => [id, new Set()]));
  const stale = new Map();
  for (const c of comps) {
    if (c.type === 'template' || c.id === 'section: Roles' || c.id === 'section: Commands') continue;
    for (const [, id] of c.text.matchAll(ID)) {
      if (id === 'light-kit') continue;
      if (!known.has(id)) { stale.set(id, [...(stale.get(id) ?? []), c.id]); continue; }
      if (id !== c.id || c.type === 'prompt') usedBy.get(id).add(c.id); // a command may share its skill's name and still use it
    }
  }
  const unreferenced = comps.filter((c) => (c.type === 'skill' || c.type === 'agent') && usedBy.get(c.id)?.size === 0).map((c) => c.id);

  const seen = new Map();
  for (const c of comps) {
    if (c.type === 'template') continue;
    for (const s of c.text.split(/(?<=[.!?])\s+|\n+/)) {
      const n = normalise(s);
      if (n.length < 60) continue;
      seen.set(n, new Set([...(seen.get(n) ?? []), c.id]));
    }
  }
  const repeated = [...seen].filter(([, ids]) => ids.size > 1).map(([text, ids]) => ({ text: text.slice(0, 110), in: [...ids] })).sort((a, b) => b.text.length - a.text.length).slice(0, 15);

  const body = comps.filter((c) => c.type !== 'template').map((c) => c.text).join('\n');
  const unusedTemplates = comps.filter((c) => c.type === 'template' && !body.includes(c.id.replace(/\.[a-z]+$/, ''))).map((c) => c.id);
  const sum = (t) => comps.filter((c) => c.type === t).reduce((n, c) => n + c.tokens, 0);
  return {
    mode: k.mode, where: k.where, level: k.level, clients: k.clients, date: new Date().toISOString().slice(0, 10),
    totals: { alwaysLoaded: core + index, core, index, onDemand: { agents: sum('agent'), skills: sum('skill'), commands: sum('prompt'), workflows: sum('workflow') } },
    components: comps.map(({ type, id, purpose, tokens: t, missingFile }) => ({ type, id, purpose, tokens: t, ...(missingFile && { missingFile }) })),
    guards: k.guards,
    findings: {
      unreferenced, unusedTemplates, repeated,
      stale: [...stale].map(([id, from]) => ({ id, from: [...new Set(from)] })),
      unclassified: comps.filter((c) => c.purpose === 'unclassified').map((c) => c.id),
      missingFiles: comps.filter((c) => c.missingFile).map((c) => c.id),
    },
  };
}

function markdown(r) {
  const row = (c) => `| ${c.type} | ${c.id} | ${c.purpose} | ${c.tokens} |`;
  const byCost = [...r.components].sort((a, b) => b.tokens - a.tokens);
  const L = [`# light-kit audit`, `${r.mode === 'source' ? 'Kit sources' : `Installed kit (${r.level ?? '?'} level, clients: ${(r.clients ?? []).join(', ') || '?'})`} · ${r.where} · ${r.date}`, '',
    '## Cost (estimated tokens, 4 characters each)',
    `- **Loaded every session: ${r.totals.alwaysLoaded}** (instructions ${r.totals.core}, name and description index of agents, skills and commands ${r.totals.index})`,
    `- Loaded only when used: agents ${r.totals.onDemand.agents}, skills ${r.totals.onDemand.skills}, commands ${r.totals.onDemand.commands}, workflows ${r.totals.onDemand.workflows}`,
    `- Guards (deterministic hook code, no context cost): ${r.guards.length}`, '',
    '## Most expensive', '| type | id | purpose | tokens |', '|---|---|---|---|', ...byCost.slice(0, 12).map(row), '',
    '## Necessity test candidates (purpose: compensation, most expensive first)', '| type | id | purpose | tokens |', '|---|---|---|---|', ...byCost.filter((c) => c.purpose === 'compensation').map(row), '',
    '## Findings'];
  const f = r.findings;
  L.push(f.unreferenced.length ? `- Not used by anything else (candidates to merge or drop): ${f.unreferenced.join(', ')}` : '- Every skill and agent is used by another component.');
  L.push(f.stale.length ? `- Stale references: ${f.stale.map((s) => `${s.id} (in ${s.from.join(', ')})`).join('; ')}` : '- No stale references.');
  L.push(f.unusedTemplates.length ? `- Templates nothing refers to: ${f.unusedTemplates.join(', ')}` : '- Every template is referred to.');
  if (f.unclassified.length) L.push(`- Components without a purpose (classify them): ${f.unclassified.join(', ')}`);
  if (f.missingFiles.length) L.push(`- Listed in the manifest but missing on disk: ${f.missingFiles.join(', ')}`);
  L.push(f.repeated.length ? `- Text repeated in more than one component (${f.repeated.length}):` : '- No repeated text.');
  for (const x of f.repeated) L.push(`  - "${x.text}…" in ${x.in.join(', ')}`);
  L.push('', '## All components', '| type | id | purpose | tokens |', '|---|---|---|---|', ...[...r.components].sort((a, b) => a.type.localeCompare(b.type) || b.tokens - a.tokens).map(row));
  return L.join('\n');
}

// ---- main
const asInstalled = basename(dirname(here)) === '.light-kit';
const sourceDir = opt('source') ? resolve(opt('source')) : asInstalled ? null : resolve(here, '..');
if (opt('record')) {
  if (sourceDir) { console.error('--record applies to an installed kit (run .light-kit/audit/audit.mjs)'); process.exit(2); }
  const dir = join(resolve(here, '..', '..'), '.light-kit', 'audits');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'state.json');
  let state = {}; try { state = JSON.parse(read(file)); } catch { /* first record */ }
  writeFileSync(file, JSON.stringify({ ...state, auditedModel: opt('record'), auditedAt: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
  console.log(`recorded: audited with ${opt('record')}`);
} else {
  let report;
  try { report = analyse(sourceDir ? fromSource(sourceDir) : fromInstalled(resolve(here, '..', '..'))); }
  catch (e) { console.error(`audit failed: ${e.message}`); process.exit(1); }
  console.log(args.includes('--json') ? JSON.stringify(report, null, 2) : markdown(report));
}
