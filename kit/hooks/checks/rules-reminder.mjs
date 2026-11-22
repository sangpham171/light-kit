import { existsSync } from 'node:fs';
import { join } from 'node:path';

// A user message that reports a defect. A feature request that merely mentions a failure
// ("add a retry when the request fails") can match too; the message below is advisory and
// tells the agent to judge whether an earlier change is actually broken.
const DEFECT = [
  /\bbugs?\b(?!\s+(?:tracker|bount(?:y|ies)|labels?|status))/i,
  /\b(?:regression|regressions)\b/i,
  /\b(?:still|now)\s+(?:not|isn'?t|doesn'?t|didn'?t|won'?t)\b/i,
  /\b(?:doesn'?t|does not|didn'?t|did not|isn'?t|is not|won'?t|will not)\s+(?:work|working|be fixed|fix|pass|load|run|show)\b/i,
  /\b(?:no longer|not)\s+work(?:s|ing)?\b/i,
  /\b(?:broken|broke)\b/i,
  /\b(?:is|are|was|were)\s+wrong\b/i,
  /\b(?:fails?|failed|failing)\b/i,
  /\bcrash(?:es|ed|ing)?\b/i,
  /\b(?:returns?|returned|throws?|threw|shows?|showed)\s+(?:an?\s+)?(?:error|exception)\b/i,
  /\b(?:test|tests|build|lint|check|checks|verification)\b.{0,30}\b(?:fail|fails|failed|failing|error|errors)\b/i,
  /\b(?:fail|fails|failed|failing)\b.{0,30}\b(?:test|tests|build|lint|check|checks|verification)\b/i,
];

const hasRules = (ctx) => [ctx.scope, ctx.root].some((dir) => dir && existsSync(join(dir, '.light-kit/rules.md')));

export default {
  id: 'rules-reminder',
  events: ['prompt'],
  run(ctx) {
    if (!ctx.kitEnabled || !hasRules(ctx)) return null;
    const prompt = (ctx.prompt ?? '').trim();
    if (!prompt || !DEFECT.some((re) => re.test(prompt))) return null;
    return {
      message: 'this reads like a defect report. If something from an earlier request or change is broken, apply the `light-rules` skill before fixing it: record the rule that should have prevented it, or add a `pending` rule with this report and the earlier request as evidence. A review is not the only trigger; a user-reported bug, a failed check or a correction counts too.',
    };
  },
};
