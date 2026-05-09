const bus = require('../bus');

const CONCURRENCY = 2;
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 400;

const pending = [];
let active = 0;
let droppedTotal = 0;
let writtenTotal = 0;

async function runOne(job) {
  active++;
  let attempt = 0;
  while (true) {
    try {
      await job.fn();
      writtenTotal++;
      bus.emit('queue:depth', pending.length);
      bus.emit('queue:written', writtenTotal);
      break;
    } catch (err) {
      attempt++;
      if (attempt >= MAX_RETRIES) {
        droppedTotal++;
        bus.emit('signal_lost', { reason: err && err.message, type: job.label });
        console.warn('[queue] dropped', job.label, err && err.message);
        break;
      }
      await new Promise((r) => setTimeout(r, BASE_BACKOFF_MS * Math.pow(2, attempt - 1)));
    }
  }
  active--;
  drain();
}

function drain() {
  while (active < CONCURRENCY && pending.length) {
    const job = pending.shift();
    runOne(job);
  }
  bus.emit('queue:depth', pending.length);
}

function enqueue(label, fn) {
  pending.push({ label, fn });
  drain();
}

function stats() {
  return { depth: pending.length, active, written: writtenTotal, dropped: droppedTotal };
}

module.exports = { enqueue, stats };
