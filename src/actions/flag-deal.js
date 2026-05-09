const config = require('../config');
const hs = require('../ingest/hyperspell');
const { writeBack } = require('./_synth');

async function run({ company }) {
  const co = company || 'this company';
  const probes = await hs.query({ text: `${co} signals strengths risks`, k: 8, halfLifeHours: 24 });
  const data = {
    company: co,
    flagged_at: Date.now(),
    signals: probes.slice(0, 6).map((h) => h.content || h.text || '').filter(Boolean),
  };
  writeBack({
    kind: 'flag',
    company: co,
    text: `FLAGGED: ${co}\n` + data.signals.map((s) => `- ${s}`).join('\n'),
    userId: config.hyperspell.userId,
  });
  return { kind: 'flag', data };
}

module.exports = { id: 'flag_deal', label: 'flag {company}', run };
