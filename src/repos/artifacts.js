// In-memory artifact store. Real artifacts produced by action handlers
// (Hyperspell + Nia + LLM synthesis) land here, get pushed onto the bus,
// and are exposed to the web dashboard over the HTTP/SSE bridge.
//
// Mock seed data lives in `web/src/mock/data.ts` — the frontend merges those
// with whatever this store returns, so we don't duplicate the seeds here.

const crypto = require('crypto');
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
  const a = { id: input.id || genId(), ...input };
  items.unshift(a);
  while (items.length > CAP) items.pop();
  if (bus) bus.emit('artifacts:new', a);
  return a;
}

function list({ limit = 100 } = {}) {
  return items.slice(0, limit);
}

function get(id) {
  return items.find((a) => a.id === id) || null;
}

module.exports = { add, list, get };
