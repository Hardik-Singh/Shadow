// BeliefsRepo — durable per-agent score store, EMA-merged on upsert.
// One row = one (agent_id, topic) belief. Survives restarts via memory.db.
//
// EMA: score' = alpha * newScore + (1 - alpha) * priorScore
// New rows just take newScore as-is.

const store = require('../memory/store');

function _safeMeta(m) {
  if (!m) return null;
  try { return JSON.stringify(m); } catch { return null; }
}

function _parse(row) {
  if (!row) return null;
  let meta = null;
  if (row.meta) { try { meta = JSON.parse(row.meta); } catch {} }
  return {
    id: row.id,
    agent_id: row.agent_id,
    topic: row.topic,
    score: row.score,
    evidence_count: row.evidence_count,
    last_updated: row.last_updated,
    meta,
  };
}

function upsert({ agent_id, topic, score, alpha = 0.3, meta = null }) {
  const db = store.open();
  const now = Date.now();
  const prior = db
    .prepare('SELECT * FROM beliefs WHERE agent_id = ? AND topic = ?')
    .get(agent_id, topic);
  if (!prior) {
    const info = db
      .prepare(
        'INSERT INTO beliefs (agent_id, topic, score, evidence_count, last_updated, meta) VALUES (?, ?, ?, 1, ?, ?)'
      )
      .run(agent_id, topic, score, now, _safeMeta(meta));
    return _parse(db.prepare('SELECT * FROM beliefs WHERE id = ?').get(info.lastInsertRowid));
  }
  const merged = alpha * score + (1 - alpha) * prior.score;
  db.prepare(
    'UPDATE beliefs SET score = ?, evidence_count = evidence_count + 1, last_updated = ?, meta = COALESCE(?, meta) WHERE id = ?'
  ).run(merged, now, _safeMeta(meta), prior.id);
  return _parse(db.prepare('SELECT * FROM beliefs WHERE id = ?').get(prior.id));
}

function list({ agent_id, topic } = {}) {
  const db = store.open();
  if (agent_id && topic) {
    return [_parse(db.prepare('SELECT * FROM beliefs WHERE agent_id = ? AND topic = ?').get(agent_id, topic))]
      .filter(Boolean);
  }
  if (agent_id) {
    return db.prepare('SELECT * FROM beliefs WHERE agent_id = ? ORDER BY score DESC').all(agent_id).map(_parse);
  }
  return db.prepare('SELECT * FROM beliefs ORDER BY score DESC').all().map(_parse);
}

function top({ agent_id, k = 5 }) {
  const db = store.open();
  return db
    .prepare('SELECT * FROM beliefs WHERE agent_id = ? ORDER BY score DESC LIMIT ?')
    .all(agent_id, k)
    .map(_parse);
}

function get({ agent_id, topic }) {
  const db = store.open();
  return _parse(db.prepare('SELECT * FROM beliefs WHERE agent_id = ? AND topic = ?').get(agent_id, topic));
}

function clear({ agent_id }) {
  const db = store.open();
  if (agent_id) db.prepare('DELETE FROM beliefs WHERE agent_id = ?').run(agent_id);
  else db.prepare('DELETE FROM beliefs').run();
}

module.exports = { upsert, list, top, get, clear };
