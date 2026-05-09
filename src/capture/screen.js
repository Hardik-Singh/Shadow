const { desktopCapturer, screen } = require('electron');
const crypto = require('crypto');
const config = require('../config');
const bus = require('../bus');
const { makeEnvelope } = require('../signal');
const { captionImage } = require('./caption');
const queue = require('../ingest/queue');
const hs = require('../ingest/hyperspell');

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
  const env = makeEnvelope({
    type: 'screen',
    content: caption,
    meta: { dwell_ms: dwellMs },
    userId: config.hyperspell.userId,
  });
  bus.emit('signal', env);
  queue.enqueue('screen', () => hs.ingest(env));
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
