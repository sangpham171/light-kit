import { readFileSync } from 'node:fs';

// Documents the kit's agents write must start with a `step:` line and a `runs:` header (see the templates).
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
      // One block-sequence entry per run; its fields may share the `- ` line or follow on indented lines.
      const entries = header.split(/\n(?=\s*- )/).filter((b) => /^\s*- /.test(b));
      const complete = (b) => /\bagent:\s*\S/.test(b) && /\bmodel:\s*\S/.test(b) && /\bthinking:\s*\S/.test(b);
      // The step sits at the top of the header; headers written before it moved there carry it on each run.
      const step = /^step:\s*\S/m.test(header) || entries.some((b) => /^\s*(?:-\s+)?step:\s*\S/m.test(b));
      const ok = step && /^runs:/m.test(header) && entries.some(complete);
      if (!ok) return { message: `${rel} must start with a \`step:\` line and a \`runs:\` header listing each agent run (agent | model | thinking | level), as in the templates. Add your entry; write \`unknown\` for what you cannot tell.` };
    }
    return null;
  },
};
