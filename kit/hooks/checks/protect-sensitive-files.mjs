import { matchesAny } from '../lib/glob.mjs';
import { segments, words } from '../lib/shell.mjs';

const SAFE_PROGRAMS = new Set(['ls', 'stat', 'test', '[', 'file']);
const SAFE_GIT = new Set(['check-ignore', 'ls-files', 'status']);

export const isSensitive = (rel, cfg) => matchesAny(cfg.sensitiveFiles, rel) && !matchesAny(cfg.sensitiveAllow, rel);

export default {
  id: 'protect-sensitive-files',
  events: ['pre-tool'],
  run(ctx, cfg) {
    const hint = 'Do not read or edit files that hold secrets. Ask the user for the information, or refer to values by variable name.';
    if (ctx.tool.kind === 'read' || ctx.tool.kind === 'write') {
      for (const f of ctx.files) { const r = ctx.rel(f); if (isSensitive(r, cfg)) return { message: `"${r}" is a sensitive file. ${hint}` }; }
    }
    if (ctx.tool.kind === 'shell') {
      for (const seg of segments(ctx.command)) {
        const w = words(seg);
        if (!w.length || SAFE_PROGRAMS.has(w[0]) || (w[0] === 'git' && SAFE_GIT.has(w[1]))) continue;
        for (const token of w.slice(1)) {
          if (token.startsWith('-')) continue;
          const t = token.replace(/^[<>]+/, '');
          if (t && isSensitive(ctx.rel(t), cfg)) return { message: `the command touches sensitive file "${t}". ${hint}` };
        }
      }
    }
    return null;
  },
};
