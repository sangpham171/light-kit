import { statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { activeRequests, listProjectDirs, listRequests } from '../lib/specs.mjs';

// Explicit implement intent, so a mention of the word in passing does not fire.
const INTENT = [
  /^\s*(?:please\s+|ok(?:ay)?[,! ]+|now\s+|so\s+)?(?:go ahead|proceed|implement|do it|ship it|make it so|let'?s do it)\b/i,
  /\b(?:implement|build|code)\s+(?:it|this|that|these|them|the\s+(?:plan|change|feature|request|design))\b/i,
];
// A question or a refusal is not an instruction to start work.
const NOT_INTENT = /^\s*(?:how|what|why|when|where|who|which|can|could|should|shall|would|is|are|was|were|will|i\s+(?:do\s*n[o']?t|don'?t|did\s*n[o']?t|didn'?t|am\s+not|won'?t))\b/i;

// A request being implemented or reviewed is the one the prompt is about.
const WORKING = ['implement', 'fix', 'review'];
const touched = (r) => { try { return statSync(join(r.home, 'specs', r.name)).mtimeMs; } catch { return 0; } };
const current = (active) => {
  const pool = active.filter((r) => WORKING.includes(r.step));
  return (pool.length ? pool : active).sort((a, b) => touched(b) - touched(a))[0];
};

export default {
  id: 'capture-discussion',
  events: ['prompt'],
  run(ctx) {
    if (!ctx.kitEnabled) return null;
    const prompt = (ctx.prompt ?? '').trim();
    if (!prompt || /\?\s*$/.test(prompt) || NOT_INTENT.test(prompt)) return null;
    if (!INTENT.some((re) => re.test(prompt))) return null;
    const projects = listProjectDirs(ctx.root);
    const active = activeRequests(ctx.scope, ctx.root, ...projects);
    if (!active.length) {
      const started = [ctx.scope, ctx.root, ...projects]
        .flatMap((home) => listRequests(home).filter((r) => r.requested && r.state !== 'done').map((r) => ({ ...r, home })));
      const where = started.map((r) => join(relative(ctx.root, r.home), 'specs', r.name));
      if (where.length) {
        return {
          message: `the user is asking to implement, but ${where.join(', ')} has \`00-request.md\` and no \`10-understanding.md\` yet. Finish this request: add the turns, decisions and constraints of the discussion so far to \`00-request.md\` (see the \`light-conversation-capture\` skill), write \`10-understanding.md\` and \`40-plan.md\`, then implement; do not code straight from the chat.`,
        };
      }
      return {
        message: 'the user is asking to implement. If this continues a discussion or a plan-mode session, the whole exchange is the request: create `specs/<NNN-slug>/` and write `00-request.md` with every turn, decision and constraint (see the `light-conversation-capture` skill), then `10-understanding.md` and `40-plan.md`, before changing code; log the work in `50-implementation.md`.',
      };
    }
    const request = current(active);
    if (request.planned) return null;
    const where = join(relative(ctx.root, request.home), 'specs', request.name);
    return {
      message: `${where} has no \`40-plan.md\` yet. Write the agreed plan first (transcribe the discussion; see the \`light-conversation-capture\` skill), then implement task by task and log in \`50-implementation.md\`; do not code straight from the chat.`,
    };
  },
};
