import { segments, words } from '../lib/shell.mjs';
import { regexes } from '../lib/config.mjs';

const WIPE_TARGETS = new Set(['/', '/*', '~', '~/', '$HOME', '${HOME}', '.', '..', './', '*', './*', '../*']);
const WHOLE = [
  [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh|dash)\b/i, 'piping a downloaded script into a shell'],
  [/\bmkfs(\.\w+)?\b/, 'formatting a filesystem'],
  [/\bdd\b[^|;&]*\bof=\/dev\//, 'writing directly to a device'],
  [/>\s*\/dev\/(sd|nvme|disk|hd)/, 'writing directly to a device'],
  [/:\(\)\s*\{\s*:\s*\|\s*:&\s*\}\s*;\s*:/, 'a fork bomb'],
  [/\bchmod\s+(-\w+\s+)*-R\s+0?777\b/, 'making a tree world-writable'],
  [/\b(drop|truncate)\s+(table|database|schema)\b/i, 'a destructive database statement'],
  [/\/proc\/[^\s]*\/environ/, 'dumping process environment'],
  [/\bgit\s+(commit|push|merge|rebase)\b[^|;&]*--no-verify\b/, 'skipping verification hooks'],
];
const ENV_DUMP = /^\s*(env|printenv|export\s+-p|declare\s+-x|set)\s*($|[|;&>])/;

export default {
  id: 'guard-dangerous-commands',
  events: ['pre-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'shell' || !ctx.command) return null;
    const cmd = ctx.command;
    if (regexes(cfg.allowCommands).some((re) => re.test(cmd))) return null;
    const stop = (why) => ({ message: `${why}. Ask the user to run it themselves if it is really intended.` });
    for (const [re, why] of WHOLE) if (re.test(cmd)) return stop(`blocked ${why}`);
    for (const re of regexes(cfg.extraDeny)) if (re.test(cmd)) return stop(`blocked by project rule ${re.source}`);
    const kw = cfg.envKeywords.map((k) => k.replace(/[_-]/g, '[_-]?')).join('|');
    const secretVar = new RegExp(`\\$\\{?[A-Za-z0-9_]*(?:${kw})[A-Za-z0-9_]*\\}?`, 'i');
    for (const seg of segments(cmd)) {
      if (ENV_DUMP.test(seg)) return stop('blocked dumping every environment variable, which can expose secrets');
      const w = words(seg);
      if (w[0] === 'rm') {
        const flags = w.filter((x) => /^-/.test(x)).join('');
        const recursive = /r/i.test(flags.replace(/--force/g, '')) || w.includes('--recursive');
        const force = /f/.test(flags.replace(/--recursive/g, '')) || w.includes('--force');
        const targets = w.slice(1).filter((x) => !x.startsWith('-'));
        if (recursive && force && targets.some((t) => WIPE_TARGETS.has(t) || /^\/[^/]*\/?$/.test(t))) return stop('blocked recursive forced deletion of a root, home or whole-tree path');
      }
      if (w[0] === 'git') {
        const rest = w.slice(1);
        if (rest[0] === 'push' && rest.some((x) => x === '-f' || x === '--force')) return stop('blocked force push');
        if (rest[0] === 'reset' && rest.includes('--hard')) return stop('blocked hard reset, which discards uncommitted work');
        if (rest[0] === 'clean' && rest.some((x) => /^-\w*f/.test(x))) return stop('blocked forced clean, which deletes untracked files');
      }
      if (['echo', 'printf', 'print', 'cat'].includes(w[0]) && secretVar.test(seg)) return stop('blocked printing a secret-looking environment variable');
    }
    return null;
  },
};
