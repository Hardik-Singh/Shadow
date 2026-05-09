const config = require('../config');
const bus = require('../bus');
const hs = require('../ingest/hyperspell');
const { getSessionId } = require('../signal');

const CATEGORIES = [
  { id: 'technical_founders', label: 'technical founders' },
  { id: 'b2b_infra', label: 'B2B infrastructure' },
  { id: 'consumer', label: 'consumer plays' },
];

const NORMALIZER = 3;
let timer = null;
let signalCount = 0;
let lastSignalTs = 0;

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

async function refreshProfile() {
  const session = getSessionId();
  try {
    const cats = await Promise.all(
      CATEGORIES.map(async (c) => {
        const ctx = require('../context');
        const hits = await hs.search({
          scope: 'partner',
          partner: ctx.ME,
          firm: ctx.FIRM,
          query: c.label,
          k: 20,
          halfLifeHours: 72,
          sources: ['vault'],
        });
        const sum = hits.reduce((a, h) => a + (h.adjusted || 0), 0);
        const score = sigmoid(sum / NORMALIZER - 0.5);
        return { id: c.id, label: c.label, score };
      })
    );
    const confidence = Math.min(1, signalCount / 50);
    const profile = {
      categories: cats,
      confidence,
      signal_count: signalCount,
      session_id: session,
      ts: Date.now(),
    };
    bus.emit('profile', profile);
    return profile;
  } catch (err) {
    console.warn('[profile] refresh failed', err && err.message);
    const empty = {
      categories: CATEGORIES.map((c) => ({ ...c, score: 0 })),
      confidence: 0,
      signal_count: signalCount,
      session_id: session,
      ts: Date.now(),
      error: 'memory unavailable',
    };
    bus.emit('profile', empty);
    return empty;
  }
}

function start() {
  if (timer) return;
  bus.on('signal', () => {
    signalCount++;
    lastSignalTs = Date.now();
  });
  bus.on('signal:click', () => refreshProfile());
  bus.on('signal:ignore', () => refreshProfile());
  timer = setInterval(refreshProfile, 10000);
  setTimeout(refreshProfile, 1000);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop, refreshProfile, CATEGORIES };
