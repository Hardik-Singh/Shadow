// SQLite store for distilled behavioral signals.
// One row = one durable observation about the user. No raw audio/frames ever land here.
const path = require('path');
const fs = require('fs');
const os = require('os');

let db = null;
let sessionId = null;

function open() {
  if (db) return db;
  const Database = require('better-sqlite3');
  const dir = path.join(os.homedir(), '.shadow');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(path.join(dir, 'memory.db'));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      ts           INTEGER NOT NULL,
      verb         TEXT    NOT NULL,
      text         TEXT    NOT NULL,
      evidence_ts  INTEGER,
      session_id   TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS signals_ts_idx ON signals(ts);
    CREATE INDEX IF NOT EXISTS signals_session_idx ON signals(session_id);
  `);
  sessionId = `s_${Date.now().toString(36)}`;
  return db;
}

function append(rows) {
  open();
  if (!rows || !rows.length) return [];
  const stmt = db.prepare(
    'INSERT INTO signals (ts, verb, text, evidence_ts, session_id) VALUES (?, ?, ?, ?, ?)'
  );
  const out = [];
  const now = Date.now();
  const insertMany = db.transaction((items) => {
    for (const r of items) {
      const info = stmt.run(now, r.verb, r.text, r.evidence_ts || null, sessionId);
      out.push({ id: info.lastInsertRowid, ts: now, ...r, session_id: sessionId });
    }
  });
  insertMany(rows);
  return out;
}

function recent(n = 50) {
  open();
  return db.prepare('SELECT * FROM signals ORDER BY id DESC LIMIT ?').all(n);
}

function search(q, n = 20) {
  open();
  return db
    .prepare('SELECT * FROM signals WHERE text LIKE ? ORDER BY id DESC LIMIT ?')
    .all(`%${q}%`, n);
}

function getSessionId() { open(); return sessionId; }

module.exports = { open, append, recent, search, getSessionId };
