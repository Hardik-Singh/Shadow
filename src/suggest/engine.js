const { randomUUID } = require('crypto');
const config = require('../config');
const bus = require('../bus');
const hs = require('../ingest/hyperspell');
const ctx = require('../context');
const MemoryRepo = require('../repos/memory');
const registry = require('../actions/registry');
const { parseScreenSignal } = require('./vision-signal');
const { scoreAction } = require('./vision-rank');

const DEBOUNCE_MS = 1500;
const RECENT_KEEP = 30;
const VISION_WEIGHT = 0.6;       // blended weight on screen-relevance score
const BEHAVIORAL_WEIGHT = 0.4;   // blended weight on past click/ignore signal
const recentMems = [];           // recent Memory rows (newest at end)

let lastRunAt = 0;
let pendingTimer = null;
let lastSuggestions = [];
let paused = false;
let lastScreen = '';

function pushRecent(m) {
  recentMems.push(m);
  if (recentMems.length > RECENT_KEEP) recentMems.shift();
}

function recentText() {
  return recentMems.slice(-12).map((m) => `[${m.kind}] ${m.text}`).join('\n');
}

function extractCompany(text) {
  const m = text.match(/\b([A-Z][a-zA-Z0-9]+(?:\s+(?:Inc|Co|Labs|AI|Technologies|Corp))?)\b/);
  return m ? m[1] : null;
}

// Extract the "specific thing in view" tail from BASE_PROMPT format:
//   "Document/Context · Specific thing in view"
// Falls back to the trimmed caption.
function extractFocus(text) {
  if (!text) return '';
  const parts = text.split('·').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] || text.slice(0, 80);
}

async function pickActions(context, { proactive = false } = {}) {
  const signal = parseScreenSignal(lastScreen);
  const companyHint = signal.entity || extractCompany(context) || 'this company';
  const allActions = registry.list();

  // Behavioral signal: probe Hyperspell for past click/ignore per action_id.
  const probed = await Promise.all(
    allActions.map(async (a) => {
      try {
        const probe = await hs.search({
          scope: 'partner', partner: ctx.ME, firm: ctx.FIRM,
          query: `user clicked ${a.id}`, k: 5, halfLifeHours: 168,
          sources: ['vault'],
        });
        const raw = probe.reduce((s, h) => s + (h.adjusted || 0), 0);
        return { action: a, raw };
      } catch {
        return { action: a, raw: 0 };
      }
    })
  );

  // Normalize behavioral to [0,1] across this batch so it composes with vision.
  const maxRaw = probed.reduce((m, p) => Math.max(m, p.raw), 0);
  const ranked = probed.map(({ action, raw }) => {
    const behavioral = maxRaw > 0 ? raw / maxRaw : 0;
    const vision = scoreAction(action, signal);
    const final = VISION_WEIGHT * vision + BEHAVIORAL_WEIGHT * behavioral;
    return { action, behavioral, vision, final };
  });
  ranked.sort((a, b) => b.final - a.final || Math.random() - 0.5);

  const focus = extractFocus(lastScreen);
  const visionReason = signal.docType !== 'other' && signal.entity
    ? `because you're on a ${signal.docType.replace('_', ' ')} for ${signal.entity}`
    : signal.docType !== 'other'
    ? `because you're on a ${signal.docType.replace('_', ' ')}`
    : focus ? `because you're on ${focus}` : 'based on recent activity';

  return ranked.slice(0, 3).map(({ action, vision, behavioral, final }) => ({
    id: randomUUID(),
    action_id: action.id,
    label: action.label.replace('{company}', companyHint),
    reason: visionReason,
    company_hint: companyHint,
    proactive,
    created_at: Date.now(),
    screen_signal: { docType: signal.docType, entity: signal.entity, intents: signal.intents },
    scores: { vision, behavioral, final },
  }));
}

function emitSuggestions(suggestions) {
  for (const old of lastSuggestions) {
    const stillThere = suggestions.find((s) => s.action_id === old.action_id);
    if (!stillThere && Date.now() - old.created_at > config.capture.suggestionTtlMs) {
      ignoreSuggestion(old);
    }
  }
  lastSuggestions = suggestions;
  bus.emit('suggestions', suggestions);
}

async function run() {
  if (paused) return;
  lastRunAt = Date.now();
  const context = recentText();
  if (!context) return;
  try {
    const suggestions = await pickActions(context);
    emitSuggestions(suggestions);
  } catch (err) {
    console.warn('[suggest] failed', err && err.message);
  }
}

// Cron-driven re-rank, decoupled from memory:write. Runs even when the
// recent buffer is empty — falls back to the last-known suggestions'
// company hint so the engine still has something to ground on.
async function runProactive() {
  if (paused) return;
  lastRunAt = Date.now();
  let context = recentText();
  if (!context) {
    const last = lastSuggestions[0];
    context = last && last.company_hint ? last.company_hint : 'idle';
  }
  try {
    const suggestions = await pickActions(context, { proactive: true });
    emitSuggestions(suggestions);
  } catch (err) {
    console.warn('[suggest] proactive failed', err && err.message);
  }
}

function schedule() {
  if (paused) return;
  const since = Date.now() - lastRunAt;
  if (pendingTimer) return;
  const wait = Math.max(0, DEBOUNCE_MS - since);
  pendingTimer = setTimeout(() => { pendingTimer = null; run(); }, wait);
}

// Called from main.js after each successful Gemini-Flash screen caption.
// Stores the latest caption (used for the visible reason on each pill) and
// triggers a fresh re-rank — independent of memory:write debounce timing.
function bumpFromScreen(text) {
  if (!text) return;
  lastScreen = text;
  schedule();
}

function pauseEngine()  { paused = true;  if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; } }
function resumeEngine() { paused = false; schedule(); }

function clickSuggestion(id) {
  const s = lastSuggestions.find((x) => x.id === id);
  if (!s) return null;
  // Click → first-class memory, valence +1
  MemoryRepo.create({
    kind: 'click',
    text: `clicked: ${s.action_id} on ${s.company_hint}`,
    valence: 1,
    meta: {
      suggestion_id: s.id,
      action_id: s.action_id,
      company_hint: s.company_hint,
      screen_signal: s.screen_signal,
      scores: s.scores,
    },
  });
  // Sibling suggestions become ignores (the user picked X over Y, Z)
  for (const sib of lastSuggestions) {
    if (sib.id === s.id) continue;
    ignoreSuggestion(sib);
  }
  return s;
}

function ignoreSuggestion(s) {
  MemoryRepo.create({
    kind: 'ignore',
    text: `ignored: ${s.action_id} on ${s.company_hint}`,
    valence: -1,
    meta: {
      suggestion_id: s.id,
      action_id: s.action_id,
      company_hint: s.company_hint,
      screen_signal: s.screen_signal,
      scores: s.scores,
    },
  });
}

function start() {
  bus.on('memory:write', ({ entry }) => {
    if (entry.kind === 'screen' || entry.kind === 'voice' || entry.kind === 'file') {
      pushRecent(entry);
      schedule();
    }
  });
}

function getLastSuggestions() { return lastSuggestions; }

module.exports = {
  start, clickSuggestion, getLastSuggestions, extractCompany,
  bumpFromScreen, pause: pauseEngine, resume: resumeEngine,
  runProactive,
};
