import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { segments, words } from '../lib/shell.mjs';
import { gitSubcommand } from '../lib/git.mjs';
import { regexes } from '../lib/config.mjs';

// Names of assistants and AI vendors. Short generic words are only used in the "generated with" form, never in co-author lines.
const VENDORS = 'claude|anthropic|openai|chatgpt|gpt|codex|copilot|cursor|gemini|mistral|llama|deepseek|aider|windsurf';
const RULES = [
  [new RegExp(`co-authored-by:[^\\n]*\\b(?:${VENDORS})(?![a-z])`, 'i'), 'an AI co-author trailer'],
  [/co-authored-by:[^\n]*noreply@(?:anthropic|openai)\.com/i, 'an AI co-author trailer'],
  [new RegExp(`\\b(?:generated|created|written|authored|assisted|made|co-authored)\\s+(?:with|by|using)\\b[^\\n]{0,40}?\\b(?:${VENDORS}|ai|llm)(?![a-z])`, 'i'), 'a "generated with …" credit'],
  [new RegExp(`signed-off-by:[^\\n]*\\b(?:${VENDORS})(?![a-z])`, 'i'), 'an AI sign-off'],
];
const TEXT_COMMANDS = new Set(['commit', 'merge', 'tag', 'notes']);

export default {
  id: 'clean-commit-message',
  events: ['pre-tool'],
  run(ctx, cfg) {
    if (ctx.tool.kind !== 'shell' || !ctx.command) return null;
    let text = '', carries = false;
    for (const seg of segments(ctx.command)) {
      const w = words(seg);
      const git = TEXT_COMMANDS.has(gitSubcommand(w));
      const pr = w[0] === 'gh' && w[1] === 'pr' && ['create', 'edit'].includes(w[2]);
      if (!git && !pr) continue;
      carries = true;
      for (let i = 0; i < w.length; i++) { // a message read from a file (-F path, --file path, --file=path, -body-file …)
        const m = w[i].match(/^(?:-F|--file|--body-file|-b)=?(.+)$/) ?? (/^(?:-F|--file|--body-file)$/.test(w[i]) ? [null, w[i + 1]] : null);
        const f = m?.[1] && resolve(ctx.cwd, m[1]);
        if (f && f !== '-' && existsSync(f)) { try { text += `\n${readFileSync(f, 'utf8')}`; } catch { /* unreadable */ } }
      }
    }
    if (!carries) return null;
    text = `${ctx.command}\n${text}`.replace(/\\n/g, '\n'); // literal \n sequences count as line breaks
    const hit = RULES.find(([re]) => re.test(text)) ?? regexes(cfg.extraForbiddenText).map((re) => [re, `text matching ${re.source}`]).find(([re]) => re.test(text));
    return hit
      ? { message: `the message contains ${hit[1]}. Commit messages and pull request text hold only the description of the change: remove that line and run the command again.` }
      : null;
  },
};
