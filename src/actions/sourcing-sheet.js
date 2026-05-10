const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const firmHistory = require('../ingest/firm-history');
const ctx = require('../context');
const {
  llmArtifact,
  summarizeHits,
  hsContextStats,
  mergeCitations,
  buildArtifact,
  writeBack,
} = require('./_synth');

const SYSTEM = `You produce sourcing sheets in the partner's voice.
- Pull facts from CITATIONS (Nia world data) and quote partner voice from BEHAVIORAL CONTEXT (Hyperspell).
- Cite every external claim inline as <sup><a href="#cite-N">N</a></sup>.
- Body sections: <h2>Snapshot</h2> (founded · location · team · ask), <h2>Product</h2>, <h2>Team</h2>, <h2>Market & Competitors</h2>, <h2>Recent Signals</h2>, <h2>What to dig on</h2><ul>…</ul>.`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [thesis, deck, firmCtx] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: 'what user wants to dig on early-stage companies', sources: ['vault'], k: 8, halfLifeHours: 720 }),
    hs.search({ scope: 'partner', partner, firm, query: `${co} company details`, sources: ['vault'], k: 12, halfLifeHours: 24 }),
    hs.search({ scope: 'firm', partner, firm, query: `${co} sector firm context`, sources: ['vault'], k: 6, halfLifeHours: 8760 }),
  ]);
  const [companies, news, people, tweets, blogs, research] = await Promise.all([
    nia.web(co, 'company'),
    nia.web(co, 'news'),
    nia.web(`${co} founders team`, 'github'),
    nia.web(`${co} launch announcement`, 'tweet'),
    nia.web(`${co} blog post`, 'blog'),
    nia.web(`${co} sector market analyst`, 'research'),
  ]);
  const stats = hsContextStats([thesis, deck, firmCtx]);
  const citations = mergeCitations(companies, news, people, tweets, blogs, research);
  const niaTotal = citations.length;

  // Firm deal-history: surface past evaluations of similar companies so the
  // "FROM FIRM MEMORY" block isn't empty.
  const priorDeals = firmHistory.findSimilarDeals({ company: co, limit: 3 });
  const priorBlock = priorDeals.length
    ? priorDeals.map((p) => `- ${p.company} (${p.year}, ${p.stage}) — ${p.outcome}${p.return ? ` · ${p.return}` : ''} · ${p.notes}`).join('\n')
    : '(no comparable firm deals in history)';

  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL CONTEXT — ${stats.total} memories (${stats.by_scope.partner} personal · ${stats.by_scope.firm} firm)`,
    `dig-areas (${thesis.length}):`, summarizeHits(thesis),
    `deck (${deck.length}):`, summarizeHits(deck),
    `firm context (${firmCtx.length}):`, summarizeHits(firmCtx),
    `firm deal history (${priorDeals.length}):`, priorBlock,
    `world hits — company ${(companies || []).length} · news ${(news || []).length} · people ${(people || []).length} · tweets ${(tweets || []).length} · blogs ${(blogs || []).length} · research ${(research || []).length}`,
    'Write the sourcing sheet now.',
  ].join('\n');

  let llmOut;
  try { llmOut = await llmArtifact({ system: SYSTEM, user: prompt, citations }); }
  catch (err) { llmOut = { _error: err.message }; }

  const artifact = buildArtifact({ kind: 'sourcing_sheet', company: co, llmOut, citations, stats, niaTotal });
  if (llmOut && !llmOut._error && !llmOut._stub) writeBack({ kind: 'sourcing_sheet', company: co, text: llmOut.body_html || llmOut.read || '' });
  return { kind: 'sourcing_sheet', data: { company: co, artifactId: artifact.id, sources: { hyperspell_total: stats.total, nia_total: niaTotal }, flags: artifact.flags } };
}

module.exports = {
  id: 'sourcing_sheet',
  label: 'generate sourcing sheet for {company}',
  triggers: ['sourcing', 'pipeline', 'spreadsheet', 'crm', 'airtable', 'batch', 'directory', 'list of companies'],
  docTypes: ['spreadsheet', 'browser'],
  intents: ['source', 'browse'],
  entityTypes: ['company', 'none'],
  run,
};
