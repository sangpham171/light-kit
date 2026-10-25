// Stack-neutral secret detection: formats and assignment shapes, not vendors.
import { regexes } from './config.mjs';

const KEYWORDS = 'password|passwd|pwd|secret|token|api[_-]?key|apikey|access[_-]?key|private[_-]?key|credential|authorization';
const ASSIGN = new RegExp(`([A-Za-z0-9_.-]*(?:${KEYWORDS})[A-Za-z0-9_.-]*)(?:\\\\?["'])?\\s*(?::=|[:=])\\s*(?:\\\\?["'])?([^\\s"',;)}\\]]{8,})`, 'gi');
const PLACEHOLDER = /example|placeholder|change[-_]?me|your[-_ ]|dummy|sample|redacted|xxxx|\*{4}|todo|fake|test/i;

export function entropy(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  let h = 0;
  for (const n of counts.values()) { const p = n / s.length; h -= p * Math.log2(p); }
  return h;
}

const looksSecretValue = (v) => {
  if (/^(\$|%|<|\{|\*+$|\.{3})/.test(v) || PLACEHOLDER.test(v)) return false;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) && !/\/\/[^/\s:@]+:[^/\s:@]+@/.test(v)) return false; // plain URL
  if (/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+$/.test(v)) return false; // property access
  const letter = /[A-Za-z]/.test(v), digit = /\d/.test(v);
  if (v.length >= 8 && letter && digit) return true;
  return v.length >= 24 && entropy(v) >= 4.2 && !/^[A-Za-z]+$/.test(v);
};

const preview = (s) => `${s.slice(0, 4)}…`;

export function findSecrets(text, extraPatterns = []) {
  const found = [];
  if (!text) return found;
  const t = String(text);
  for (const m of t.matchAll(/-----BEGIN [A-Z ]*PRIVATE KEY-----/g)) found.push({ rule: 'private key block', preview: preview(m[0]) });
  for (const m of t.matchAll(/\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s:@]{3,}@/gi)) found.push({ rule: 'credentials inside a URL', preview: preview(m[0]) });
  for (const m of t.matchAll(/\bbearer\s+([A-Za-z0-9\-._~+/]{20,})/gi)) if (!PLACEHOLDER.test(m[1])) found.push({ rule: 'bearer token', preview: preview(m[1]) });
  for (const m of t.matchAll(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g)) found.push({ rule: 'signed token', preview: preview(m[0]) });
  for (const m of t.matchAll(ASSIGN)) if (looksSecretValue(m[2])) found.push({ rule: `value assigned to "${m[1]}"`, preview: preview(m[2]) });
  for (const m of t.matchAll(/(?<![A-Za-z0-9+/_-])[A-Za-z0-9+/_-]{40,}={0,2}(?![A-Za-z0-9+/_-])/g))
    if (/\d/.test(m[0]) && /[a-z]/.test(m[0]) && /[A-Z]/.test(m[0]) && entropy(m[0]) >= 4.5) found.push({ rule: 'long random token', preview: preview(m[0]) });
  for (const re of regexes(extraPatterns)) { const m = t.match(re); if (m) found.push({ rule: `project pattern ${re.source}`, preview: preview(m[0]) }); }
  return found;
}

export const describe = (found) => found.slice(0, 3).map((f) => `${f.rule} (${f.preview})`).join('; ');

export function redact(text, extraPatterns = []) {
  let out = String(text);
  out = out.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g, '[redacted]');
  out = out.replace(/\bbearer\s+[A-Za-z0-9\-._~+/]{20,}/gi, 'Bearer [redacted]');
  out = out.replace(/(:\/\/[^/\s:@]+:)[^/\s:@]{3,}(@)/g, '$1[redacted]$2');
  out = out.replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, '[redacted]');
  out = out.replace(ASSIGN, (m, name, value) => (looksSecretValue(value) ? m.replace(value, '[redacted]') : m));
  for (const re of regexes(extraPatterns)) out = out.replace(new RegExp(re.source, 'gi'), '[redacted]');
  return out;
}
