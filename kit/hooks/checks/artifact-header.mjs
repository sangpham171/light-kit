import { readFileSync } from 'node:fs';

// Documents the kit's agents write must start with a `runs:` provenance header (see the templates).
const ARTIFACT = [/(^|\/)specs\/[^/]+\/\d\d-[^/]+\.md$/, /(^|\/)\.light-kit\/(codebase-map|assessment|standardization-backlog)\.md$/, /(^|\/)\.light-kit\/audits\/[^/]+\.md$/];

export default {
  id: 'artifact-header',
  events: ['post-tool'],
  run(ctx) {
    if (ctx.tool.kind !== 'write' || !ctx.kitEnabled) return null;
    for (const f of ctx.files) {
      const rel = ctx.rel(f).replace(/\\/g, '/');
      if (!ARTIFACT.some((re) => re.test(rel))) continue;
      let text = '';
      try { text = readFileSync(f.startsWith('/') ? f : `${ctx.cwd}/${f}`, 'utf8'); } catch { continue; }
      const header = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const lines = header.split('\n').filter((l) => /^\s*- /.test(l));
      const ok = /^runs:/m.test(header) && lines.some((l) => /\bagent:\s*\S/.test(l) && /\bmodel:\s*\S/.test(l) && /\bthinking:\s*\S/.test(l));
      if (!ok) return { message: `${rel} must start with a \`runs:\` header listing each agent run (step | agent | model | thinking | level), as in the templates. Add your line; write \`unknown\` for what you cannot tell.` };
    }
    return null;
  },
};
