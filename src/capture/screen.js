const { desktopCapturer, screen } = require('electron');
const crypto = require('crypto');
const config = require('../config');
const { captionImage } = require('./caption');
const MemoryRepo = require('../repos/memory');

let timer = null;
let lastHash = null;
let lastCaption = null;
let dwellStartTs = 0;
let lastIngestTs = 0;

function hashCaption(s) {
  return crypto.createHash('md5').update(s).digest('hex');
}

async function tick() {
  try {
    const display = screen.getPrimaryDisplay();
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1280, height: 800 },
    });
    const source =
      sources.find((s) => String(s.display_id) === String(display.id)) || sources[0];
    if (!source || source.thumbnail.isEmpty()) return;
    const png = source.thumbnail.toPNG();
    const caption = await captionImage(png);
    const h = hashCaption(caption);
    const now = Date.now();
    const stable = h === lastHash;
    if (!stable) {
      lastHash = h;
      lastCaption = caption;
      dwellStartTs = now;
      lastIngestTs = now;
      writeEnvelope(caption, 0);
    } else if (now - lastIngestTs >= config.capture.dwellRefreshMs) {
      lastIngestTs = now;
      writeEnvelope(caption, now - dwellStartTs);
    }
  } catch (err) {
    console.warn('[screen] tick failed', err && err.message);
  }
}

function writeEnvelope(caption, dwellMs) {
  const dwellSec = Math.round(dwellMs / 1000);
  const text = dwellSec >= 5
    ? `${caption} · ${dwellSec}s dwell`
    : caption;
  MemoryRepo.create({ kind: 'screen', text, meta: { dwell_ms: dwellMs } });
}

function start() {
  if (timer) return;
  timer = setInterval(tick, config.capture.screenIntervalMs);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop };
