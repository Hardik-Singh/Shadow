const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const ctx = require('../context');
const { llmJson, summarizeHits, hsContextStats, writeBack } = require('./_synth');

const SYSTEM = `You produce a market/TAM check card. JSON only.
Schema: { "claimed_tam": str, "shadow_assessment": str, "comparable_exits": [str], "user_skepticism_signals": [str] }`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [tamSkepticism, deckMarket, firmComps] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: 'TAM skepticism made-up market size', sources: ['vault'], k: 8, halfLifeHours: 168 }),
    hs.search({ scope: 'partner', partner, firm, query: `${co} market TAM`, sources: ['vault'], k: 6, halfLifeHours: 24 }),
    hs.search({ scope: 'firm', partner, firm, query: `comparable exits ${co} space`, sources: ['vault'], k: 6, halfLifeHours: 8760 }),
  ]);
  const [comps, news] = await Promise.all([
    nia.web ? nia.web(`${co} comparable companies market`, 'company') : Promise.resolve([]),
    nia.web ? nia.web(`${co} market exits`, 'news') : Promise.resolve([]),
  ]);
  const stats = hsContextStats([tamSkepticism, deckMarket, firmComps]);
  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL — ${stats.total} memories`,
    `TAM skepticism (${tamSkepticism.length}):`, summarizeHits(tamSkepticism),
    `deck market claims (${deckMarket.length}):`, summarizeHits(deckMarket),
    `firm comp history (${firmComps.length}):`, summarizeHits(firmComps),
    `world — comps (${(comps || []).length}):`, summarizeHits(comps),
    `world — exits/news (${(news || []).length}):`, summarizeHits(news),
    'Output JSON.',
  ].join('\n');
  let card;
  try { card = await llmJson({ system: SYSTEM, user: prompt, maxTokens: 800 }); }
  catch (err) { card = { _error: err.message }; }
  const data = { company: co, card, sources: { hyperspell_total: stats.total } };
  if (!card._error && !card._stub) writeBack({ kind: 'market_check', company: co, text: JSON.stringify(card, null, 2) });
  return { kind: 'market_check', data };
}

module.exports = { id: 'market_check', label: 'check TAM / market for {company}', run };
