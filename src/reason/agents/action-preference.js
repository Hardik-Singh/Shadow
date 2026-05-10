// ActionPreferenceAgent — learned per-action preference from click/ignore
// memory rows. Topic = action_id. Score is a sigmoid over a running net of
// (click - ignore) counts, EMA-merged across ticks for smooth updates.
//
// Replaces (eventually) the per-tick Hyperspell click probe in
// src/suggest/engine.js with a persisted belief that survives restarts.

const { ReasoningAgent } = require('../agent');

function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

class ActionPreferenceAgent extends ReasoningAgent {
  constructor() { super({ id: 'action-preference', alpha: 0.25 }); }

  async observe({ recentMemory = [] } = {}) {
    // Keep only click / ignore rows; both carry meta.action_id.
    const signals = recentMemory.filter(
      (m) => m.kind === 'click' || m.kind === 'ignore'
    );
    return { signals };
  }

  async hypothesize({ signals }) {
    if (!signals.length) return [];
    const net = new Map(); // action_id -> { pos, neg }
    for (const s of signals) {
      const aid = (s.meta && s.meta.action_id)
        || extractActionFromText(s.text);
      if (!aid) continue;
      const cur = net.get(aid) || { pos: 0, neg: 0 };
      if (s.kind === 'click') cur.pos += 1;
      else cur.neg += 1;
      net.set(aid, cur);
    }
    const out = [];
    for (const [aid, { pos, neg }] of net) {
      out.push({
        topic: aid,
        score: sigmoid(pos - neg),
        meta: { pos, neg, summary: `${pos} clicks / ${neg} ignores` },
      });
    }
    return out;
  }
}

// Fallback for older memory rows where meta wasn't populated.
//   "clicked: ic-memo on Anthropic" → "ic-memo"
function extractActionFromText(text) {
  if (!text) return null;
  const m = text.match(/^(?:clicked|ignored):\s*([a-z0-9_-]+)\s+on/i);
  return m ? m[1] : null;
}

module.exports = { ActionPreferenceAgent };
