import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function listRequests(root) {
  const dir = join(root, 'specs');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
    const base = join(dir, d.name);
    let meta = {};
    try {
      const fm = readFileSync(join(base, 'status.md'), 'utf8').match(/^---\n([\s\S]*?)\n---/);
      for (const line of fm?.[1].split('\n') ?? []) { const m = line.match(/^(\w+):\s*(.*)$/); if (m) meta[m[1]] = m[2].trim(); }
    } catch { /* no status file */ }
    return { name: d.name, understood: existsSync(join(base, '10-understanding.md')), workflow: meta.workflow, step: meta.step, state: meta.state, work_branch: meta.work_branch, base_commit: meta.base_commit };
  });
}

export const activeRequests = (...dirs) =>
  [...new Set(dirs)].flatMap((home) => listRequests(home).filter((r) => r.understood && r.state !== 'done').map((r) => ({ ...r, home })));

// Directories (below the root, a few levels deep) that carry their own .light-kit: the workspace's projects.
export function listProjectDirs(root, depth = 3) {
  const found = [];
  const walk = (dir, d) => {
    if (d > depth || found.length >= 200) return;
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('.')) continue;
      const full = join(dir, e.name);
      if (existsSync(join(full, '.light-kit'))) found.push(full);
      walk(full, d + 1);
    }
  };
  walk(root, 1);
  return found;
}
