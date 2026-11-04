import { join, relative } from 'node:path';
import { activeRequests } from '../lib/specs.mjs';

// Explicit implement intent, so a mention of the word in passing does not fire.
const INTENT = [
  /^\s*(?:please\s+|ok(?:ay)?[,! ]+|now\s+|so\s+)?(?:go ahead|proceed|implement|build|do it|ship it)\b/i,
  /\b(?:implement|build|code)\s+(?:it|this|that|these|them|the\s+(?:plan|change|feature|request|design))\b/i,
  /\b(?:go ahead|do it|ship it|make it so)\b/i,
];

export default {
  id: 'capture-discussion',
  events: ['prompt'],
  run(ctx) {
    if (!ctx.kitEnabled || !INTENT.some((re) => re.test(ctx.prompt))) return null;
    const active = activeRequests(ctx.scope, ctx.root);
    if (!active.length) {
      return {
        message: 'the user is asking to implement. If this continues a discussion or a plan-mode session, the whole exchange is the request: create `specs/<NNN-slug>/` and write `00-request.md` with every turn, decision and constraint (see the `light-conversation-capture` skill), then `10-understanding.md` and `40-plan.md`, before changing code; log the work in `50-implementation.md`.',
      };
    }
    const unplanned = active.filter((r) => !r.planned);
    if (!unplanned.length) return null;
    const where = unplanned.map((r) => join(relative(ctx.root, r.home), 'specs', r.name)).join(', ');
    return {
      message: `${where} has no \`40-plan.md\` yet. Write the agreed plan first (transcribe the discussion; see the \`light-conversation-capture\` skill), then implement task by task and log in \`50-implementation.md\`; do not code straight from the chat.`,
    };
  },
};
