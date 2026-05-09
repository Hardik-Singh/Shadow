const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const ctx = require('../context');
const { llmJson, summarizeHits, hsContextStats, writeBack } = require('./_synth');

const SYSTEM = `You produce sourcing sheets in the partner's voice. JSON only.
Schema: { "company": str, "founded": str, "location": str, "team_size": str,
  "ask": str, "product": str, "team": str, "market": str,
  "competitors": [str], "recent_news": [str], "what_to_dig_on": [str] }`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [thesis, deck, firmCtx] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: 'what user wants to dig on early-stage companies', sources: ['vault'], k: 8, halfLifeHours: 720 }),
    hs.search({ scope: 'partner', partner, firm, query: `${co} company details`, sources: ['vault'], k: 12, halfLifeHours: 24 }),
    hs.search({ scope: 'firm', partner, firm, query: `${co} sector firm context`, sources: ['vault'], k: 6, halfLifeHours: 8760 }),
  ]);
  const [companies, news, people] = await Promise.all([
    nia.web ? nia.web(co, 'company') : Promise.resolve([]),
    nia.web ? nia.web(co, 'news') : Promise.resolve([]),
    nia.web ? nia.web(`${co} founders team`, 'github') : Promise.resolve([]),
  ]);
  const stats = hsContextStats([thesis, deck, firmCtx]);
  const niaTotal = (companies || []).length + (news || []).length + (people || []).length;
  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL CONTEXT — ${stats.total} memories (${stats.by_scope.partner} personal · ${stats.by_scope.firm} firm)`,
    `dig-areas (${thesis.length}):`, summarizeHits(thesis),
    `deck (${deck.length}):`, summarizeHits(deck),
    `firm context (${firmCtx.length}):`, summarizeHits(firmCtx),
    `world — company (${(companies || []).length}):`, summarizeHits(companies),
    `world — news (${(news || []).length}):`, summarizeHits(news),
    `world — team (${(people || []).length}):`, summarizeHits(people),
    'Output JSON.',
  ].join('\n');
  let sheet;
  try { sheet = await llmJson({ system: SYSTEM, user: prompt }); }
  catch (err) { sheet = { _error: err.message }; }
  const data = { company: co, sheet, sources: { hyperspell_total: stats.total, nia_total: niaTotal }, flags: niaTotal === 0 ? ['limited external data'] : [] };
  if (!sheet._error && !sheet._stub) writeBack({ kind: 'sourcing_sheet', company: co, text: JSON.stringify(sheet, null, 2) });
  return { kind: 'sourcing_sheet', data };
}

module.exports = { id: 'sourcing_sheet', label: 'generate sourcing sheet for {company}', run };
