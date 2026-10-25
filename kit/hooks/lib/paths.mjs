import { existsSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Resolve symlinks even for paths that do not exist yet (real prefix + remainder), so root and targets compare equal.
export function realish(p) {
  const abs = resolve(p);
  let d = abs, rest = '';
  while (!existsSync(d)) { const up = dirname(d); if (up === d) return abs; rest = rest ? `${d.slice(up.length + 1)}/${rest}` : d.slice(up.length + 1); d = up; }
  try { return rest ? resolve(realpathSync(d), rest) : realpathSync(d); } catch { return abs; }
}
