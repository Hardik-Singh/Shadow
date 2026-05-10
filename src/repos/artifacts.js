// In-memory artifact store. Real artifacts produced by action handlers
// (Hyperspell + Nia + LLM synthesis) land here, get pushed onto the bus,
// and are exposed to the web dashboard over the HTTP/SSE bridge.
//
// Mock seed data lives in `web/src/mock/data.ts` — the frontend merges those
// with whatever this store returns, so we don't duplicate the seeds here.

const crypto = require('crypto');
const { dedupeRelations } = require('./artifact-relations');
let bus = null;
try { bus = require('../bus'); } catch {}

const CAP = 200;
const items = []; // newest-first

function genId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(3).toString('hex');
  return `art_${ts}_${rand}`;
}

function add(input) {
  const a = { id: input.id || genId(), ...input, relations: dedupeRelations(input.relations || []) };
  items.unshift(a);
  while (items.length > CAP) items.pop();
  if (bus) bus.emit('artifacts:new', a);
  return a;
}

function relations({ company, type, id } = {}) {
  const rows = items.filter((a) => {
    if (id && a.id !== id) return false;
    if (company && String(a.company || '').toLowerCase() !== String(company).toLowerCase()) return false;
    return true;
  });
  const rels = rows.flatMap((a) =>
    (a.relations || []).map((r) => ({ ...r, artifactId: a.id, artifactType: a.type, company: a.company })),
  );
  return type ? rels.filter((r) => r.type === type) : rels;
}

function list({ limit = 100 } = {}) {
  return items.slice(0, limit);
}

function get(id) {
  return items.find((a) => a.id === id) || null;
}

module.exports = { add, list, get, relations };
