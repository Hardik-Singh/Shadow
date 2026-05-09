const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const ctx = require('../context');
const { llmJson, summarizeHits, hsContextStats, writeBack } = require('./_synth');

const SYSTEM = `You produce a founder/CTO profile card. JSON only.
Schema: { "name": str, "role": str, "previous": [str], "github_signal": str,
  "prior_startups": [str], "shadow_read": str }`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [founderViews, firmFounderHistory] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: 'what user thinks about technical founders', sources: ['vault'], k: 8, halfLifeHours: 720 }),
    hs.search({ scope: 'firm', partner, firm, query: 'firm founder profile patterns successful invests', sources: ['vault'], k: 6, halfLifeHours: 8760 }),
  ]);
  const [people, companies] = await Promise.all([
    nia.web ? nia.web(`${co} CTO founder background`, 'github') : Promise.resolve([]),
    nia.web ? nia.web(co, 'company') : Promise.resolve([]),
  ]);
  const stats = hsContextStats([founderViews, firmFounderHistory]);
  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL — ${stats.total} memories (${stats.by_scope.partner} personal · ${stats.by_scope.firm} firm)`,
    `founder preferences (${founderViews.length}):`, summarizeHits(founderViews),
    `firm history (${firmFounderHistory.length}):`, summarizeHits(firmFounderHistory),
    `world — people (${(people || []).length}):`, summarizeHits(people),
    `world — company (${(companies || []).length}):`, summarizeHits(companies),
    'Output JSON.',
  ].join('\n');
  let card;
  try { card = await llmJson({ system: SYSTEM, user: prompt, maxTokens: 800 }); }
  catch (err) { card = { _error: err.message }; }
  const data = { company: co, card, sources: { hyperspell_total: stats.total }, flags: ((people || []).length + (companies || []).length) === 0 ? ['limited external data'] : [] };
  if (!card._error && !card._stub) writeBack({ kind: 'founder_profile', company: co, text: JSON.stringify(card, null, 2) });
  return { kind: 'founder_profile', data };
}

module.exports = { id: 'founder_lookup', label: 'look up founder of {company}', run };
