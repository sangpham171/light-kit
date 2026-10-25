import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

// Built-in, stack-neutral defaults. The project config only ADDS to the lists and overrides modes.
export const DEFAULT_MODES = {
  'protect-sensitive-files': 'block',
  'block-secrets-in-writes': 'block',
  'redact-prompt-secrets': 'block',
  'guard-dangerous-commands': 'block',
  'protect-paths': 'block',
  'require-spec': 'warn',
  'post-edit-quality': 'warn',
  'warn-secret-output': 'warn',
  'session-context': 'warn',
  'verify-on-stop': 'off',
  'audit-log': 'off',
};

export const BUILTIN = {
  sensitiveFiles: ['.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx', 'id_rsa*', 'id_dsa*', 'id_ecdsa*', 'id_ed25519*', '*.secret', '*.secrets', 'secrets.*', 'credentials', 'credentials.*'],
  sensitiveAllow: ['*.example', '*.sample', '*.template', '*.dist', '*.tpl'],
  envKeywords: ['password', 'passwd', 'secret', 'token', 'api_key', 'apikey', 'access_key', 'private_key', 'credential'],
  protectedPaths: ['.git/**', '.light-kit/hooks/**', '.claude/settings.json', '.claude/settings.local.json', '.github/hooks/**', '.cursor/hooks.json', '.codex/hooks.json'],
  specExempt: ['specs/**', '.light-kit/**', '*.md', '.claude/**', '.github/**', '.cursor/**', '.codex/**', '.agents/**'],
};

export function findRoot(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, '.light-kit'))) return dir;
    const up = dirname(dir);
    if (up === dir) return resolve(start);
    dir = up;
  }
}

const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : []);
const str = (v) => (typeof v === 'string' ? v : '');

export function loadConfig(root) {
  let raw = {};
  try { raw = JSON.parse(readFileSync(join(root, '.light-kit', 'hooks.config.json'), 'utf8')); } catch { /* defaults */ }
  const modes = { ...DEFAULT_MODES };
  for (const [k, v] of Object.entries(raw.hooks ?? {})) if (k in modes && ['block', 'warn', 'off'].includes(v)) modes[k] = v;
  return {
    modes,
    sensitiveFiles: [...BUILTIN.sensitiveFiles, ...arr(raw.sensitive?.extraFiles)],
    sensitiveAllow: [...BUILTIN.sensitiveAllow, ...arr(raw.sensitive?.allow)],
    envKeywords: [...BUILTIN.envKeywords, ...arr(raw.sensitive?.extraEnvKeywords)],
    extraSecretPatterns: arr(raw.secrets?.extraPatterns),
    extraDeny: arr(raw.commands?.extraDeny),
    allowCommands: arr(raw.commands?.allow),
    protectedPaths: [...BUILTIN.protectedPaths, ...arr(raw.protect?.paths)],
    specExempt: [...BUILTIN.specExempt, ...arr(raw.spec?.exempt)],
    format: str(raw.quality?.format),
    lint: str(raw.quality?.lint),
    qualityTimeout: Number(raw.quality?.timeoutSec) || 60,
    verify: str(raw.verify?.command),
    verifyTimeout: Number(raw.verify?.timeoutSec) || 300,
    auditFile: str(raw.audit?.file) || '.light-kit/audit.log',
  };
}

export function regexes(list) {
  return list.flatMap((p) => { try { return [new RegExp(p, 'i')]; } catch { return []; } });
}
