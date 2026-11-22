#!/usr/bin/env node
// light-kit init merge: update an existing .light-kit folder to the current kit without erasing anything.
// Usage: node merge.mjs [--project <dir>] [--dry-run]
// Installed at <root>/.light-kit/init/merge.mjs; the templates it merges from sit in <root>/.light-kit/templates/.
// At user level it runs from ~/.light-kit/init/ and the project is the current folder (or --project).
//
// Additive only:
//  - markdown: append the `##` sections the document lacks, and the `key: value` settings an existing
//    section lacks (matched by key, so a value the user changed is never duplicated or replaced);
//  - JSON: add keys the document lacks, recursively; every existing value wins.
// Files that do not exist are left for light-init to create. Invalid JSON is reported and left untouched.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(here, '..', 'templates');

const DOCS = [
  { file: 'project-profile.md', template: 'project-profile.md', kind: 'md' },
  { file: 'rules.md', template: 'rules.md', kind: 'md' },
  { file: 'projects.md', template: 'projects.md', kind: 'md' },
  { file: 'hooks.config.json', template: 'project-hooks.config.json', kind: 'json', modes: true },
  { file: 'models.json', template: 'models.json', kind: 'json' },
];

const HEADING = /^## (.+)$/;
const SETTING = /^([A-Z][A-Za-z0-9 ]+):\s+\S/; // `Key: value` at column 0; tables, lists and indented lines never match
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const settingKey = (line) => line.match(SETTING)?.[1];

// Lines grouped by `##` heading; anything before the first heading is the preamble.
export function splitSections(text) {
  const lines = text.split('\n');
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADING);
    if (!m) continue;
    if (current) current.end = i;
    current = { heading: m[1].trim(), start: i, end: lines.length };
    sections.push(current);
  }
  return { lines, sections };
}

// Append missing sections and missing setting lines. Returns the new text and what was added.
export function mergeMarkdown(text, template) {
  const base = splitSections(text);
  const tpl = splitSections(template);
  const existing = new Map(base.sections.map((s) => [s.heading, s]));
  const out = [...base.lines];
  const inserts = [];
  const addedSections = [];
  const addedSettings = [];

  for (const section of tpl.sections) {
    const body = tpl.lines.slice(section.start, section.end);
    while (body.length > 1 && body.at(-1).trim() === '') body.pop();
    const target = existing.get(section.heading);
    if (!target) { addedSections.push(section.heading); continue; } // appended below, in template order
    // Settings the section lacks, matched by key so a user-set value is not duplicated.
    const have = new Set(base.lines.slice(target.start, target.end).map(settingKey).filter(Boolean));
    const missing = body.filter((line) => settingKey(line) && !have.has(settingKey(line)));
    if (missing.length) {
      let at = target.end;
      while (at > target.start + 1 && base.lines[at - 1].trim() === '') at--;
      inserts.push({ at, lines: missing });
      for (const line of missing) addedSettings.push(settingKey(line));
    }
  }

  if (!addedSections.length && !addedSettings.length) return { text, addedSections, addedSettings };
  for (const { at, lines } of inserts.sort((a, b) => b.at - a.at)) out.splice(at, 0, ...lines);

  // Missing sections go at the end, in template order, after one blank line.
  for (const heading of addedSections) {
    const section = tpl.sections.find((s) => s.heading === heading);
    const body = tpl.lines.slice(section.start, section.end);
    while (body.length > 1 && body.at(-1).trim() === '') body.pop();
    while (out.length && out.at(-1).trim() === '') out.pop();
    out.push('', ...body);
  }

  while (out.length && out.at(-1).trim() === '') out.pop();
  out.push(''); // the files end with a newline
  return { text: out.join('\n'), addedSections, addedSettings };
}

// Add the keys `template` has and `doc` lacks, recursively. Existing values win.
export function mergeJson(doc, template) {
  const added = [];
  const walk = (target, source, path) => {
    for (const [key, value] of Object.entries(source)) {
      const name = path ? `${path}.${key}` : key;
      if (!(key in target)) { target[key] = value; added.push(name); }
      else if (isObj(target[key]) && isObj(value)) walk(target[key], value, name);
    }
  };
  if (isObj(doc) && isObj(template)) walk(doc, template, '');
  return { value: doc, added };
}

// Hook modes already listed in the file gain the modes a newer kit added; existing values and a
// file without a `hooks` block are left as they are (an absent mode already means its default).
async function mergeModes(config) {
  if (!isObj(config.hooks)) return [];
  try {
    const { DEFAULT_MODES } = await import('../hooks/lib/config.mjs');
    const added = [];
    for (const [mode, value] of Object.entries(DEFAULT_MODES)) if (!(mode in config.hooks)) { config.hooks[mode] = value; added.push(`hooks.${mode}`); }
    return added;
  } catch { return []; }
}

const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

// Merge every existing project document against the templates. Returns the report; writes unless dryRun.
export async function mergeProject(projectDir, { templates = TEMPLATES, dryRun = false } = {}) {
  const root = resolve(projectDir);
  const kitDir = join(root, '.light-kit');
  const report = { root, templates, files: [], written: [] };
  for (const doc of DOCS) {
    const target = join(kitDir, doc.file);
    const current = read(target);
    if (current === null) continue; // light-init creates missing documents from the template
    const template = read(join(templates, doc.template));
    if (template === null) continue;
    const entry = { path: relative(root, target), addedSections: [], addedSettings: [], addedKeys: [], skipped: null };
    let next;
    if (doc.kind === 'json') {
      let value;
      try { value = JSON.parse(current); } catch { entry.skipped = 'invalid JSON'; report.files.push(entry); continue; }
      const merged = mergeJson(value, JSON.parse(template));
      entry.addedKeys = merged.added;
      if (doc.modes) entry.addedKeys.push(...(await mergeModes(value)));
      // Without additions the file stays byte-for-byte as it was, whatever its formatting.
      next = entry.addedKeys.length ? JSON.stringify(value, null, 2) + '\n' : current;
    } else {
      const merged = mergeMarkdown(current, template);
      entry.addedSections = merged.addedSections;
      entry.addedSettings = merged.addedSettings;
      next = merged.text;
    }
    entry.changed = next !== current;
    if (entry.changed) { if (!dryRun) writeFileSync(target, next); report.written.push(entry.path); }
    report.files.push(entry);
  }
  return report;
}

const line = (entry) => {
  const parts = [];
  if (entry.addedSections.length) parts.push(`${entry.addedSections.length} section${entry.addedSections.length === 1 ? '' : 's'} (${entry.addedSections.join(', ')})`);
  if (entry.addedSettings.length) parts.push(`${entry.addedSettings.length} setting${entry.addedSettings.length === 1 ? '' : 's'} (${entry.addedSettings.join(', ')})`);
  if (entry.addedKeys.length) parts.push(`${entry.addedKeys.length} key${entry.addedKeys.length === 1 ? '' : 's'} (${entry.addedKeys.join(', ')})`);
  return parts.join(', ');
};

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? null : args[i + 1]; };
  const project = opt('project') ?? process.cwd();
  const dryRun = args.includes('--dry-run');
  if (!existsSync(join(project, '.light-kit'))) {
    console.log(`light-kit update: no .light-kit folder in ${resolve(project)}; nothing to update.`);
    process.exit(0);
  }
  if (!existsSync(TEMPLATES)) {
    console.error(`light-kit update: no templates at ${TEMPLATES}; reinstall the kit.`);
    process.exit(1);
  }
  const report = await mergeProject(project, { dryRun });
  const changed = report.files.filter((f) => f.changed);
  for (const entry of report.files) {
    if (entry.skipped) console.log(`  skipped ${entry.path}: ${entry.skipped}`);
    else if (entry.changed) console.log(`  ${dryRun ? 'would update' : 'updated'} ${entry.path}: ${line(entry)}`);
  }
  console.log(changed.length ? `light-kit update: ${changed.length} document${changed.length === 1 ? '' : 's'} ${dryRun ? 'would change' : 'updated'}.` : 'light-kit update: everything is current.');
}
