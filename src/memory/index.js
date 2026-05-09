// Memory orchestrator: ticks the distiller on a timer + on screen-context change,
// emits saved rows to a listener (the main process forwards them to the HUD).
const buffer = require('./buffer');
const store = require('./store');
const distiller = require('./distiller');

const TICK_MS = 30_000;

let timer = null;
let onSavedCb = null;
let lastScreenForTrigger = null;
let running = false;

async function tickNow(reason) {
  if (running) return;
  running = true;
  try {
    const saved = await distiller.distill();
    if (saved.length && onSavedCb) {
      for (const row of saved) onSavedCb(row, reason);
    }
  } finally {
    running = false;
  }
}

function start() {
  store.open();
  if (timer) return;
  timer = setInterval(() => tickNow('tick'), TICK_MS);
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
}

function onSaved(cb) { onSavedCb = cb; }

function noteTranscript(text) { buffer.add('transcript', text); }
function noteScreen(caption) {
  buffer.add('screen', caption);
  // Trigger a distill if the screen context shifted meaningfully (different first 4 words).
  const sig = String(caption || '').split(/\s+/).slice(0, 4).join(' ');
  if (sig && sig !== lastScreenForTrigger) {
    lastScreenForTrigger = sig;
    setTimeout(() => tickNow('screen-change'), 1500);
  }
}

function recent(n) { return store.recent(n); }
function sessionId() { return store.getSessionId(); }

module.exports = {
  start, stop, onSaved,
  noteTranscript, noteScreen,
  recent, sessionId,
};
