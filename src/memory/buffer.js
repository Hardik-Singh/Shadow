// In-memory ring buffer of recent observations. Lives only for the running process.
// Holds short transcript chunks + last-known screen caption + timestamps.
// The distiller reads from here; nothing in this file ever touches disk.

const MAX_ENTRIES = 200;
const MAX_AGE_MS = 5 * 60 * 1000;

const entries = [];
let lastScreen = null;

function add(kind, text) {
  if (!text) return;
  entries.push({ kind, text: String(text).slice(0, 1000), ts: Date.now() });
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  if (kind === 'screen') lastScreen = text;
}

function snapshot() {
  const cutoff = Date.now() - MAX_AGE_MS;
  return entries.filter((e) => e.ts >= cutoff);
}

function clear() { entries.length = 0; lastScreen = null; }

function getLastScreen() { return lastScreen; }

module.exports = { add, snapshot, clear, getLastScreen };
