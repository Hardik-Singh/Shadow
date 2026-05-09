// ScreenFocusAgent — caption-aware belief about what the user is currently
// focused on. Topic = company/entity extracted from the latest caption +
// recent memory. Score = recency-weighted mention count, normalized to [0,1].
//
// Closes the caption → ranker gap by writing a persistent belief that any
// downstream surface (suggest engine, thought emitter) can read.

const { ReasoningAgent } = require('../agent');

const HALF_LIFE_MS = 5 * 60 * 1000; // 5min recency half-life

class ScreenFocusAgent extends ReasoningAgent {
  constructor({ extractCompany } = {}) {
    super({ id: 'screen-focus', alpha: 0.4 });
    this.extractCompany = extractCompany || (() => null);
  }

  async observe({ recentMemory = [], lastCaption = '', now = Date.now() } = {}) {
    return { recentMemory, lastCaption, now };
  }

  async hypothesize({ recentMemory, lastCaption, now }) {
    const counts = new Map(); // topic -> { weight, lastSeen }
    const bump = (topic, ts) => {
      if (!topic) return;
      const decay = Math.pow(0.5, Math.max(0, now - ts) / HALF_LIFE_MS);
      const prev = counts.get(topic) || { weight: 0, lastSeen: 0 };
      counts.set(topic, {
        weight: prev.weight + decay,
        lastSeen: Math.max(prev.lastSeen, ts),
      });
    };

    if (lastCaption) bump(this.extractCompany(lastCaption), now);
    for (const m of recentMemory) {
      const ts = m.created_at || m.ts || now;
      bump(this.extractCompany(m.text || ''), ts);
    }

    if (counts.size === 0) return [];
    const total = Array.from(counts.values()).reduce((s, v) => s + v.weight, 0) || 1;
    const out = [];
    for (const [topic, { weight, lastSeen }] of counts) {
      out.push({
        topic,
        score: Math.min(1, weight / total),
        meta: { last_seen: lastSeen, raw_weight: weight },
      });
    }
    return out;
  }
}

module.exports = { ScreenFocusAgent };
