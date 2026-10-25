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
    return { name: d.name, understood: existsSync(join(base, '10-understanding.md')), workflow: meta.workflow, step: meta.step, state: meta.state };
  });
}

export const activeRequests = (root) => listRequests(root).filter((r) => r.understood && r.state !== 'done');
