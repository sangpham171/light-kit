import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Documents the kit's agents write must start with a `step:` line and a `runs:` header (see the templates).
const ARTIFACT = [/(^|\/)specs\/[^/]+\/\d\d-[^/]+\.md$/, /(^|\/)\.light-kit\/(codebase-map|assessment|standardization-backlog)\.md$/, /(^|\/)\.light-kit\/audits\/[^/]+\.md$/];
const REQUEST_ARTIFACT = /(^|\/)specs\/[^/]+\/\d\d-[^/]+\.md$/;
const workflowDirs = (ctx) => [join(ctx.root, '.light-kit', 'workflows'), join(ctx.kitHome, '.light-kit', 'workflows')];

// A workflow step line: `3. implement — agent: light-developer — skill: light-tech-debt — writes: 50-implementation.md`.
function workflowSteps(ctx, workflow) {
  for (const dir of workflowDirs(ctx)) {
    let text;
    try { text = readFileSync(join(dir, `${workflow}.md`), 'utf8'); } catch { continue; }
    return text.split('\n').flatMap((line) => {
      const m = line.match(/^\s*\d+\.\s+([\w-]+)(?:\s*\([^)]*\))?\s+—\s+agents?:\s+([\w-]+(?:\s*,\s*[\w-]+)*)/);
      if (!m) return [];
      return [{ name: m[1], agents: m[2].split(/\s*,\s*/), writes: line.match(/—\s*writes?:\s*([^—\n]+)/)?.[1] ?? '' }];
    });
  }
  return [];
}

const workflowOf = (file) => {
  try { return readFileSync(join(dirname(file), 'status.md'), 'utf8').match(/^workflow:\s*([\w-]+)/m)?.[1] ?? ''; } catch { return ''; }
};

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
      // Stop at the usage block: its `- step:` rows are not runs.
      const entries = header.split(/\nusage:/)[0].split(/\n(?=\s*- )/).filter((b) => /^\s*- /.test(b) && /\bagent:/.test(b));
      const complete = (b) => /\bagent:\s*\S/.test(b) && /\bmodel:\s*\S/.test(b) && /\bthinking:\s*\S/.test(b);
      const hasPart = (b) => /\bpart:\s*\S/.test(b);
      // The step sits at the top of the header; headers written before it moved there carry it on each run.
      const step = /^step:\s*\S/m.test(header) || entries.some((b) => /^\s*(?:-\s+)?step:\s*\S/m.test(b));
      const ok = step && /^runs:/m.test(header) && entries.some(complete);
      if (!ok) return { message: `${rel} must start with a \`step:\` line and a \`runs:\` header listing each agent run (agent | part | model | thinking | level), as in the templates. Add your entry; write \`unknown\` for what you cannot tell.` };

      if (!REQUEST_ARTIFACT.test(rel)) continue;
      const agents = [...new Set(entries.map((b) => b.match(/\bagent:\s*(\S+)/)?.[1]).filter(Boolean))];
      const places = entries.filter((b) => !hasPart(b)).length;
      const workflow = workflowOf(f.startsWith('/') ? f : `${ctx.cwd}/${f}`);
      const owners = workflow
        ? workflowSteps(ctx, workflow).filter((s) => s.writes.includes(rel.split('/').pop()))
        : [];
      const expected = [...new Set(owners.flatMap((s) => s.agents))];
      const messages = [];
      if (agents.length > 1 && places)
        messages.push(`${rel} credits ${agents.length} agents but ${places} \`runs:\` ${places === 1 ? 'entry has' : 'entries have'} no \`part:\`; add \`part: <what that run produced>\` to each, so the reader sees which agent did which part.`);
      if (expected.length && !agents.some((a) => expected.includes(a)) && places)
        messages.push(`${rel} credits ${agents.join(', ')} but the ${workflow} workflow runs its ${owners.map((s) => s.name).join(' / ')} step as ${expected.join(', ')}; record the agent that produced the work, not the one that called it, and add \`part:\` when the orchestrator did the step itself.`);
      if (messages.length) return { message: messages.join(' ') };
    }
    return null;
  },
};
