const config = require('../config');
const bus = require('../bus');
const { makeEnvelope } = require('../signal');
const queue = require('../ingest/queue');
const hs = require('../ingest/hyperspell');

function ingestUtterance(text, confidence) {
  const trimmed = (text || '').trim();
  if (!trimmed) return;
  const env = makeEnvelope({
    type: 'voice',
    content: trimmed,
    meta: { confidence: confidence || null },
    userId: config.hyperspell.userId,
  });
  bus.emit('signal', env);
  queue.enqueue('voice', () => hs.ingest(env));
}

module.exports = { ingestUtterance };
