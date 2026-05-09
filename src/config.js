const fs = require('fs');
const path = require('path');

function loadDotenv() {
  const p = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadDotenv();

const required = ['HYPERSPELL_API_KEY', 'HYPERSPELL_BASE', 'HYPERSPELL_USER_ID'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  process.env.HYPERSPELL_API_KEY ||= 'sk-test-mock';
  process.env.HYPERSPELL_BASE ||= 'mock://local';
  process.env.HYPERSPELL_USER_ID ||= 'hardik';
  console.warn(`[config] missing ${missing.join(', ')}; using mock Hyperspell for local demo`);
}

const niaCorporaRaw = process.env.NIA_CORPORA || '';
const niaCorpora = Object.fromEntries(
  niaCorporaRaw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p.split(':').map((s) => s.trim()))
    .filter((kv) => kv.length === 2)
);

module.exports = {
  hyperspell: {
    apiKey: process.env.HYPERSPELL_API_KEY,
    base: process.env.HYPERSPELL_BASE.replace(/\/$/, ''),
    userId: process.env.HYPERSPELL_USER_ID,
  },
  nia: {
    apiKey: process.env.NIA_API_KEY || '',
    base: (process.env.NIA_BASE || '').replace(/\/$/, ''),
    corpora: niaCorpora,
    enabled: Boolean(process.env.NIA_API_KEY && process.env.NIA_BASE),
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    enabled: Boolean(process.env.ANTHROPIC_API_KEY),
  },
  models: {
    vision: process.env.SHADOW_VISION_MODEL || 'claude-haiku-4-5',
    suggest: process.env.SHADOW_SUGGEST_MODEL || 'claude-haiku-4-5',
    synth: process.env.SHADOW_SYNTH_MODEL || 'claude-sonnet-4-5',
  },
  capture: {
    screenIntervalMs: Number(process.env.SHADOW_SCREEN_INTERVAL_MS || 3000),
    dwellRefreshMs: Number(process.env.SHADOW_DWELL_REFRESH_MS || 30000),
    suggestionTtlMs: Number(process.env.SHADOW_SUGGESTION_TTL_MS || 60000),
  },
  proactive: {
    enabled: process.env.SHADOW_PROACTIVE_DISABLED ? false : true,
    suggestionsMs:    Number(process.env.SHADOW_PROACTIVE_SUGGESTIONS_MS    || 90_000),
    memoryScanMs:     Number(process.env.SHADOW_PROACTIVE_MEMORY_SCAN_MS    || 300_000),
    profileRefreshMs: Number(process.env.SHADOW_PROACTIVE_PROFILE_MS        || 600_000),
    jitter: 0.1,
  },
};
