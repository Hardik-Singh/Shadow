const { randomUUID } = require('crypto');
const config = require('../config');
const bus = require('../bus');
const hs = require('../ingest/hyperspell');
const { makeEnvelope } = require('../signal');
const queue = require('../ingest/queue');
const registry = require('../actions/registry');

const DEBOUNCE_MS = 1500;
const recentEnvelopes = [];
const RECENT_KEEP = 30;

let lastRunAt = 0;
let pendingTimer = null;
let lastSuggestions = [];

function pushRecent(env) {
  recentEnvelopes.push(env);
  if (recentEnvelopes.length > RECENT_KEEP) recentEnvelopes.shift();
}

function recentText() {
  return recentEnvelopes
    .slice(-12)
    .map((e) => `[${e.type}] ${e.content}`)
    .join('\n');
}

function extractCompany(text) {
  const m = text.match(/\b([A-Z][a-zA-Z0-9]+(?:\s+(?:Inc|Co|Labs|AI|Technologies|Corp))?)\b/);
  return m ? m[1] : null;
}

async function pickActions(context) {
  const companyHint = extractCompany(context) || 'this company';
  const allActions = registry.list();
  const ranked = await Promise.all(
    allActions.map(async (a) => {
      const probe = await hs.query({
        text: `user clicked ${a.id}`,
        k: 5,
        halfLifeHours: 168,
        types: ['click', 'ignore'],
      });
      const score = probe.reduce((s, h) => s + (h.adjusted || 0), 0);
      return { action: a, score };
    })
  );
  ranked.sort((a, b) => b.score - a.score || Math.random() - 0.5);
  return ranked.slice(0, 3).map(({ action }) => ({
    id: randomUUID(),
    action_id: action.id,
    label: action.label.replace('{company}', companyHint),
    company_hint: companyHint,
    created_at: Date.now(),
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

function schedule() {
  const since = Date.now() - lastRunAt;
  if (pendingTimer) return;
  const wait = Math.max(0, DEBOUNCE_MS - since);
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    run();
  }, wait);
}

function clickSuggestion(id) {
  const s = lastSuggestions.find((x) => x.id === id);
  if (!s) return null;
  const env = makeEnvelope({
    type: 'click',
    content: `user clicked: ${s.action_id} on ${s.company_hint}`,
    meta: { suggestion_id: s.id, action_id: s.action_id, company_hint: s.company_hint },
    valence: 1,
    userId: config.hyperspell.userId,
  });
  bus.emit('signal', env);
  bus.emit('signal:click', env);
  queue.enqueue('click', () => hs.ingest(env));
  for (const sib of lastSuggestions) {
    if (sib.id === s.id) continue;
    ignoreSuggestion(sib);
  }
  return s;
}

function ignoreSuggestion(s) {
  const env = makeEnvelope({
    type: 'ignore',
    content: `user ignored: ${s.action_id} on ${s.company_hint}`,
    meta: { suggestion_id: s.id, action_id: s.action_id, company_hint: s.company_hint },
    valence: -1,
    userId: config.hyperspell.userId,
  });
  bus.emit('signal', env);
  bus.emit('signal:ignore', env);
  queue.enqueue('ignore', () => hs.ingest(env));
}

function start() {
  bus.on('signal', (env) => {
    if (env.type === 'screen' || env.type === 'voice' || env.type === 'file') {
      pushRecent(env);
      schedule();
    }
  });
}

function getLastSuggestions() {
  return lastSuggestions;
}

module.exports = { start, clickSuggestion, getLastSuggestions, extractCompany };
