import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Built-in, stack-neutral defaults. The project config only ADDS to the lists and overrides modes.
export const DEFAULT_MODES = {
  'protect-sensitive-files': 'block',
  'block-secrets-in-writes': 'block',
  'redact-prompt-secrets': 'block',
  'guard-dangerous-commands': 'block',
  'protect-paths': 'block',
  'protect-branches': 'block',
  'clean-commit-message': 'block',
  'audit-reminder': 'warn',
  'artifact-header': 'warn',
  'require-spec': 'warn',
  'post-edit-quality': 'warn',
  'warn-secret-output': 'warn',
  'session-context': 'warn',
  'verify-on-stop': 'off',
  'audit-log': 'off',
  'commit-checkpoint': 'warn',
};

export const BUILTIN = {
  sensitiveFiles: ['.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx', 'id_rsa*', 'id_dsa*', 'id_ecdsa*', 'id_ed25519*', '*.secret', '*.secrets', 'secrets.*', 'credentials', 'credentials.*'],
  sensitiveAllow: ['*.example', '*.sample', '*.template', '*.dist', '*.tpl'],
  envKeywords: ['password', 'passwd', 'secret', 'token', 'api_key', 'apikey', 'access_key', 'private_key', 'credential'],
  // "**/" so the same rules hold for every project nested under a workspace root
  protectedPaths: ['**/.git/**', '**/.light-kit/hooks/**', '**/.claude/settings.json', '**/.claude/settings.local.json', '**/.github/hooks/**', '**/.cursor/hooks.json', '**/.codex/hooks.json'],
  specExempt: ['**/specs/**', '**/.light-kit/**', '*.md', '**/.claude/**', '**/.github/**', '**/.cursor/**', '**/.codex/**', '**/.agents/**'],
};

// run.mjs lives in <root>/.light-kit/hooks/, so the install root is two levels up.
export const installRootOf = (metaUrl) => resolve(dirname(fileURLToPath(metaUrl)), '..', '..');

const inside = (root, p) => p === root || p.startsWith(root + sep);

// Scope = the nearest directory at or above `start` (below the root) that has its own .light-kit, i.e. the project; else the root.
export function findScope(root, start) {
  const r = resolve(root);
  let dir = resolve(start);
  if (!inside(r, dir)) return r;
  while (dir !== r) {
    if (existsSync(join(dir, '.light-kit'))) return dir;
    dir = dirname(dir);
  }
  return r;
}

// At user level the kit is installed in the home folder (~/.light-kit) and serves every project. The marker is written by the installer.
const isUserLevel = (home) => { try { return JSON.parse(readFileSync(join(home, '.light-kit', 'kit.config.json'), 'utf8')).level === 'user'; } catch { return false; } };

// Where the action happens, relative to where the kit is installed:
//  root  = the outermost project/workspace folder (has its own .light-kit), or the install folder when the kit is installed there
//  scope = the innermost one (the project the action is about)
//  layers = config folders, outermost first (at user level the home folder is the bottom layer)
//  kitEnabled = false only at user level, in a folder that has no .light-kit of its own (the project has not run `init`)
export function locate(kitHome, start) {
  const home = resolve(kitHome);
  if (!isUserLevel(home)) { const scope = findScope(home, start); return { userLevel: false, kitEnabled: true, root: home, scope, layers: chain(home, scope) }; }
  const found = [];
  for (let d = resolve(start); ; d = dirname(d)) {
    if (d !== home && existsSync(join(d, '.light-kit'))) found.push(d);
    if (d === home || dirname(d) === d) break;
  }
  const outer = found.reverse();
  return { userLevel: true, kitEnabled: outer.length > 0, root: outer[0] ?? resolve(start), scope: outer.at(-1) ?? resolve(start), layers: [home, ...outer] };
}

// Directories from the root down to the scope, each possibly holding a config layer.
const chain = (root, scope) => {
  const r = resolve(root);
  const parts = relative(r, resolve(scope)).split(sep).filter(Boolean);
  return parts.reduce((acc, p) => [...acc, join(acc.at(-1), p)], [r]);
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
// Lists add up, modes and scalars are overridden by the nearer layer, empty values never override.
function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return [...new Set([...a, ...b])];
  if (isObj(a) && isObj(b)) { const o = { ...a }; for (const k of Object.keys(b)) o[k] = k in a ? deepMerge(a[k], b[k]) : b[k]; return o; }
  return b === undefined || b === null || b === '' ? a : b;
}

const readRaw = (dir) => { try { return JSON.parse(readFileSync(join(dir, '.light-kit', 'hooks.config.json'), 'utf8')); } catch { return {}; } };

const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x) : []);
const str = (v) => (typeof v === 'string' ? v : '');

export function loadConfig(layers) {
  const raw = layers.map(readRaw).reduce(deepMerge, {});
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
    extraForbiddenText: arr(raw.commit?.extraForbiddenText),
    protectedBranches: arr(raw.branches?.protected),
    protectedPaths: [...BUILTIN.protectedPaths, ...arr(raw.protect?.paths)],
    specExempt: [...BUILTIN.specExempt, ...arr(raw.spec?.exempt)],
    format: str(raw.quality?.format),
    lint: str(raw.quality?.lint),
    qualityTimeout: Number(raw.quality?.timeoutSec) || 60,
    verify: str(raw.verify?.command),
    verifyTimeout: Number(raw.verify?.timeoutSec) || 300,
    maxUncommitted: Number(raw.commit?.maxUncommittedFiles) || 8,
    suggestInit: raw.session?.suggestInit !== false,
    auditRemind: raw.audit?.remind !== false,
    auditFile: str(raw.audit?.file) || '.light-kit/audit.log',
  };
}

export function regexes(list) {
  return list.flatMap((p) => { try { return [new RegExp(p, 'i')]; } catch { return []; } });
}
