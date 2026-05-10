// ReasoningAgent — minimal observe → hypothesize → updateBelief primitive.
//
// Each agent owns a slice of beliefs in the SQLite `beliefs` table, keyed by
// (agent_id, topic). The base class handles persistence and EMA merging;
// subclasses only override hypothesize().
//
// Contract:
//   observe(input)     → snapshot used by hypothesize (pure, no I/O)
//   hypothesize(snap)  → [{ topic, score, meta? }]      ← override this
//   updateBelief(h)    → upserts via BeliefsRepo
//   tick(input)        → observe → hypothesize → updateBelief loop
//
// Scores are nominally [0, 1] but the merge function tolerates anything finite.

const beliefs = require('../repos/beliefs');

class ReasoningAgent {
  constructor({ id, alpha = 0.3 } = {}) {
    if (!id) throw new Error('ReasoningAgent: id required');
    this.id = id;
    this.alpha = alpha;
  }

  // Default: pass through. Override to project inputs into a smaller snapshot.
  async observe(input) { return input || {}; }

  // Returns array of { topic, score, meta? }. Empty array = no update.
  async hypothesize(/* snapshot */) { return []; }

  async updateBelief({ topic, score, meta }) {
    if (!topic || !Number.isFinite(score)) return null;
    return beliefs.upsert({
      agent_id: this.id,
      topic,
      score,
      alpha: this.alpha,
      meta,
    });
  }

  async tick(input) {
    const snap = await this.observe(input);
    const hyps = (await this.hypothesize(snap)) || [];
    const out = [];
    for (const h of hyps) {
      const row = await this.updateBelief(h);
      if (row) out.push(row);
    }
    return out;
  }

  beliefs({ topic } = {}) {
    return beliefs.list({ agent_id: this.id, topic });
  }

  top(k = 5) {
    return beliefs.top({ agent_id: this.id, k });
  }
}

module.exports = { ReasoningAgent };
