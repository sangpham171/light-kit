#!/usr/bin/env node
// Import the agent and skill calls that ran before the `agent-skill-usage` hook was installed.
// node tools/backfill-usage.mjs [--root <project>] [--transcripts <dir>] [--stats <file>] [--dry-run]
//
// Reads the Claude Code session records (every `.jsonl` under `--transcripts`, default
// `~/.claude/projects`), keeps each `Agent`/`Task`/`Skill` tool call whose `cwd` is inside the
// project, attributes it to the `specs/<slug>` it names when that folder exists (else
// `(no request)`), and merges it into `.light-kit/agent-skill-usage.json` and `.md` through the
// same reader and counter the hook uses. A call already counted — live or by an earlier import —
// is skipped, so the command is safe to run again.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NO_REQUEST, callOf, readStats, recordCall, renderTable, saveStats, saveText } from '../kit/hooks/lib/usage-stats.mjs';

const JSON_FILE = 'agent-skill-usage.json';
const MD_FILE = 'agent-skill-usage.md';
const SLUG = /\b\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\b/g;

const transcriptFiles = (dir, out = []) => {
  let entries = [];
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) transcriptFiles(full, out);
    else if (entry.name.endsWith('.jsonl')) out.push(full);
  }
  return out;
};

const inside = (cwd, root) => typeof cwd === 'string' && (cwd === root || cwd.startsWith(root + sep));

// The request a call belongs to: the first `NNN-slug` in its input that names an existing spec
// folder. A skill that creates a request runs before the folder exists, so it stays unassigned.
export function requestOf(input, root) {
  const text = JSON.stringify(input ?? {});
  for (const slug of text.match(SLUG) ?? []) if (existsSync(join(root, 'specs', slug))) return slug;
  return NO_REQUEST;
}

// Every agent and skill call in the session records that belongs to this project, oldest first, one
// entry per tool-call id (a sidechain copy of a call carries the same id and is dropped).
export function callsIn(transcripts, root) {
  const project = resolve(root);
  const calls = [];
  for (const file of transcriptFiles(transcripts)) {
    let text = '';
    try { text = readFileSync(file, 'utf8'); } catch { continue; }
    for (const line of text.split('\n')) {
      if (!line.includes('"tool_use"')) continue;
      let event;
      try { event = JSON.parse(line); } catch { continue; }
      if (typeof event.timestamp !== 'string' || !inside(event.cwd, project)) continue;
      for (const block of Array.isArray(event.message?.content) ? event.message.content : []) {
        if (block?.type !== 'tool_use' || typeof block.id !== 'string') continue;
        const call = callOf(block.name, block.input);
        if (!call) continue;
        calls.push({ id: block.id, at: event.timestamp, ...call, request: requestOf(block.input, project) });
      }
    }
  }
  calls.sort((a, b) => a.at.localeCompare(b.at));
  return calls;
}

// Merge the calls into the stats files. Returns what changed; `dryRun` reads and counts only.
export function backfill({ root = process.cwd(), transcripts = join(homedir(), '.claude', 'projects'), statsFile, dryRun = false } = {}) {
  const project = resolve(root);
  const dir = join(project, '.light-kit');
  if (!existsSync(dir)) throw new Error(`${project} has no .light-kit folder`);
  const file = statsFile ?? join(dir, JSON_FILE);
  const stats = readStats(file);
  const calls = callsIn(transcripts, project);
  let added = 0;
  for (const call of calls) if (recordCall(stats, call)) added += 1;
  if (added && !dryRun) {
    saveStats(file, stats);
    saveText(join(dir, MD_FILE), renderTable(stats));
  }
  return { added, found: calls.length, foundFiles: transcriptFiles(transcripts).length, stats, file, dryRun };
}

const arg = (name, fallback = '') => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = backfill({
      root: arg('root', process.cwd()),
      transcripts: arg('transcripts', join(homedir(), '.claude', 'projects')),
      statsFile: arg('stats') || undefined,
      dryRun: process.argv.includes('--dry-run'),
    });
    const verb = result.dryRun ? 'would import' : 'imported';
    console.log(`${verb} ${result.added} agent/skill calls (${result.found} found in ${result.foundFiles} session files) into ${result.file}`);
  } catch (e) {
    console.error(`backfill-usage: ${e.message}`);
    process.exitCode = 1;
  }
}
