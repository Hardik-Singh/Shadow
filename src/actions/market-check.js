const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const ctx = require('../context');
const {
  llmArtifact,
  summarizeHits,
  hsContextStats,
  mergeCitations,
  buildArtifact,
  writeBack,
} = require('./_synth');

const SYSTEM = `You produce a market / TAM check card in the partner's voice.
- Pull comparable exits + market data from CITATIONS (Nia); pull TAM-skepticism patterns from BEHAVIORAL CONTEXT (Hyperspell).
- Cite every external claim inline as <sup><a href="#cite-N">N</a></sup>.
- Body sections: <h2>Claimed TAM</h2>, <h2>Shadow Assessment</h2>, <h2>Comparable Exits</h2><ul>…</ul>, <h2>Skepticism Signals</h2><ul>… (echo partner phrases) …</ul>.`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [tamSkepticism, deckMarket, firmComps] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: 'TAM skepticism made-up market size', sources: ['vault'], k: 8, halfLifeHours: 168 }),
    hs.search({ scope: 'partner', partner, firm, query: `${co} market TAM`, sources: ['vault'], k: 6, halfLifeHours: 24 }),
    hs.search({ scope: 'firm', partner, firm, query: `comparable exits ${co} space`, sources: ['vault'], k: 6, halfLifeHours: 8760 }),
  ]);
  const [comps, news] = await Promise.all([
    nia.web(`${co} comparable companies market`, 'company'),
    nia.web(`${co} market exits`, 'news'),
  ]);
  const stats = hsContextStats([tamSkepticism, deckMarket, firmComps]);
  const citations = mergeCitations(comps, news);
  const niaTotal = (comps || []).length + (news || []).length;

  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL — ${stats.total} memories`,
    `TAM skepticism (${tamSkepticism.length}):`, summarizeHits(tamSkepticism),
    `deck market claims (${deckMarket.length}):`, summarizeHits(deckMarket),
    `firm comp history (${firmComps.length}):`, summarizeHits(firmComps),
    `world hits — comps ${(comps || []).length} · exits/news ${(news || []).length}`,
    'Write the market check card now.',
  ].join('\n');

  let llmOut;
  try { llmOut = await llmArtifact({ system: SYSTEM, user: prompt, citations, maxTokens: 1600 }); }
  catch (err) { llmOut = { _error: err.message }; }

  const artifact = buildArtifact({ kind: 'market_check', company: co, llmOut, citations, stats, niaTotal });
  if (llmOut && !llmOut._error && !llmOut._stub) writeBack({ kind: 'market_check', company: co, text: llmOut.body_html || llmOut.read || '' });
  return { kind: 'market_check', data: { company: co, artifactId: artifact.id, sources: { hyperspell_total: stats.total, nia_total: niaTotal }, flags: artifact.flags } };
}

module.exports = {
  id: 'market_check',
  label: 'check TAM / market for {company}',
  triggers: ['market', 'tam', 'sam', 'competitors', 'industry report', 'market size', 'segment'],
  docTypes: ['pitch_deck', 'doc', 'browser'],
  intents: ['research', 'evaluate'],
  entityTypes: ['company', 'market'],
  run,
};
