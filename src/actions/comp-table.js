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

const SYSTEM = `You produce a comp table card — a structured table of comparable companies and recent rounds in the space.
- Use CITATIONS (Nia) for company names, valuations, and outcomes; use BEHAVIORAL CONTEXT (Hyperspell) to weight which comps matter to the partner.
- Cite every external claim inline as <sup><a href="#cite-N">N</a></sup>.
- Body sections: <h2>Direct Comparables</h2><table>…</table>, <h2>Recent Rounds in Space</h2><ul>…</ul>, <h2>Notes</h2><ul>…</ul>.
- Table columns: Company · Stage · Valuation · Outcome.`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [partnerComps, firmComps, dealMemory] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: 'comparable companies valuations outcomes', sources: ['vault'], k: 6, halfLifeHours: 168 }),
    hs.search({ scope: 'firm', partner, firm, query: `${co} space comp table prior deals`, sources: ['vault'], k: 8, halfLifeHours: 8760 }),
    hs.search({ scope: 'partner', partner, firm, query: `${co} sector valuation`, sources: ['vault'], k: 4, halfLifeHours: 24 }),
  ]);
  const [comps, exits, rounds, pdfs, news, blogs] = await Promise.all([
    nia.web(`${co} comparable companies same space`, 'company'),
    nia.web(`${co} sector exits acquisitions IPO`, 'news'),
    nia.web(`${co} sector recent funding rounds last 90 days`, 'news'),
    nia.web(`${co} sector market map valuation report`, 'pdf'),
    nia.web(`${co} sector seed series A valuations`, 'news'),
    nia.web(`${co} sector deep dive`, 'blog'),
  ]);
  const stats = hsContextStats([partnerComps, firmComps, dealMemory]);
  const citations = mergeCitations(comps, exits, rounds, pdfs, news, blogs);
  const niaTotal = citations.length;

  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL — ${stats.total} memories`,
    `partner comp preferences (${partnerComps.length}):`, summarizeHits(partnerComps),
    `firm comp history (${firmComps.length}):`, summarizeHits(firmComps),
    `recent deal context (${dealMemory.length}):`, summarizeHits(dealMemory),
    `world hits — comps ${(comps || []).length} · exits ${(exits || []).length} · rounds ${(rounds || []).length} · pdfs ${(pdfs || []).length} · news ${(news || []).length} · blogs ${(blogs || []).length}`,
    'Write the comp table card now.',
  ].join('\n');

  let llmOut;
  try { llmOut = await llmArtifact({ system: SYSTEM, user: prompt, citations, maxTokens: 1600 }); }
  catch (err) { llmOut = { _error: err.message }; }

  const artifact = buildArtifact({ kind: 'comp_table', company: co, llmOut, citations, stats, niaTotal });
  if (llmOut && !llmOut._error && !llmOut._stub) writeBack({ kind: 'comp_table', company: co, text: llmOut.body_html || llmOut.read || '' });
  return { kind: 'comp_table', data: { company: co, artifactId: artifact.id, sources: { hyperspell_total: stats.total, nia_total: niaTotal }, flags: artifact.flags } };
}

module.exports = {
  id: 'comp_table',
  label: 'build comp table for {company}',
  triggers: ['comp', 'comparable', 'comps', 'valuation', 'multiples', 'recent rounds', 'precedent'],
  docTypes: ['pitch_deck', 'spreadsheet', 'doc', 'browser'],
  intents: ['research', 'evaluate'],
  entityTypes: ['company', 'market'],
  run,
};
