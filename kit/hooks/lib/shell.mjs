// Tiny shell-command helpers (no full parser: good enough for policy checks).
export const segments = (command) => command.split(/&&|\|\||;|\||\n/).map((s) => s.trim()).filter(Boolean);

export function words(segment) {
  const w = (segment.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map((x) => x.replace(/^["']|["']$/g, ''));
  while (w.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w[0]) || ['sudo', 'time', 'nohup', 'command', 'exec'].includes(w[0]))) w.shift();
  return w;
}

export const shellQuote = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
