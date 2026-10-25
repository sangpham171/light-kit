// Minimal glob matching. Patterns without "/" match the file name at any depth;
// patterns with "/" match the path relative to the project root. Case-insensitive.
export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') { i++; re += '(?:.*/)?'; } else re += '.*';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, 'i');
}

export function matchesGlob(glob, relPath) {
  let g = glob.replace(/^\.\//, '');
  const p = relPath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (g.endsWith('/')) g += '**';
  if (g.startsWith('/')) g = g.slice(1);
  const target = g.includes('/') ? p : p.split('/').pop();
  return globToRegExp(g).test(target);
}

export const matchesAny = (globs, relPath) => globs.some((g) => matchesGlob(g, relPath));
