const hs = require('../ingest/hyperspell');
const ctx = require('../context');
const { writeBack } = require('./_synth');

async function run({ company } = {}) {
  const co = company || 'this company';
  const probes = await hs.search({
    scope: 'partner', partner: ctx.ME, firm: ctx.FIRM,
    query: `${co} signals strengths risks`, sources: ['vault'], k: 8, halfLifeHours: 24,
  });
  const data = {
    company: co,
    flagged_at: Date.now(),
    signals: probes.slice(0, 6).map((h) => (h.text || '').replace(/^\[shadow\|[^\]]+\]\n?/, '').trim()).filter(Boolean),
    sources: { hyperspell_total: probes.length },
  };
  writeBack({ kind: 'flag', company: co, text: `FLAGGED: ${co}\n` + data.signals.map((s) => `- ${s}`).join('\n') });
  return { kind: 'flag', data };
}

module.exports = {
  id: 'flag_deal',
  label: 'flag {company}',
  triggers: ['concern', 'pass', 'reject', 'red flag', 'risk', 'churn', 'lawsuit', 'declining'],
  docTypes: ['pitch_deck', 'doc', 'email', 'chat'],
  intents: ['decide', 'communicate'],
  entityTypes: ['company'],
  run,
};
