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

const SYSTEM = `You write IC (investment committee) memos in the partner's voice.
- Every BEHAVIORAL CONTEXT line is a real memory pulled from Hyperspell — echo phrases the partner actually said.
- Use WORLD FACTS / CITATIONS for company, founder, and market data; cite each external claim inline as <sup><a href="#cite-N">N</a></sup>.
- The body must include sections: <h2>Read</h2>, <h2>Reasons</h2><ul>…</ul>, <h2>Risks</h2><ul>…</ul>, <h2>Open Questions</h2><ul>…</ul>.`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME;
  const firm = ctx.FIRM;
  const connected = await hs.listConnectedSources(partner);

  const [voiceOnCo, thesis, deckChunks, firmPriorMemos] = await Promise.all([
    hs.search({
      scope: 'partner', partner, firm,
      query: `what does ${partner.name} think about ${co}`,
      sources: ['vault', ...connected.filter((s) => s !== 'collections')],
      k: 8, halfLifeHours: 24,
    }),
    hs.search({
      scope: 'partner', partner, firm,
      query: 'investment thesis and skepticisms',
      sources: ['vault'],
      k: 8, halfLifeHours: 720,
    }),
    hs.search({
      scope: 'partner', partner, firm,
      query: `${co} pitch deck details`,
      sources: ['vault'],
      k: 12, halfLifeHours: 24,
    }),
    hs.search({
      scope: 'firm', partner, firm,
      query: `${co} comparable deals firm thesis`,
      sources: ['vault'],
      k: 8, halfLifeHours: 720 * 12,
    }),
  ]);

  // Wide Nia fan-out — every public surface that might inform an IC decision.
  // All in parallel; per-call 8s timeout in the adapter caps total latency.
  const [companies, news, github, tweets, blogs, research, pdfs, coinvestors] = await Promise.all([
    nia.web(`${co} comparable companies`, 'company'),
    nia.web(`${co} fundraise news`, 'news'),
    nia.web(`${co} founders`, 'github'),
    nia.web(`${co} founders launch`, 'tweet'),
    nia.web(`${co} founder essay writing`, 'blog'),
    nia.web(`${co} market research analyst report`, 'research'),
    nia.web(`${co} sector market size whitepaper`, 'pdf'),
    nia.web(`${co} round investors lead`, 'news'),
  ]);

  const stats = hsContextStats([voiceOnCo, thesis, deckChunks, firmPriorMemos]);
  const citations = mergeCitations(companies, news, github, tweets, blogs, research, pdfs, coinvestors);
  const niaTotal = citations.length;

  const userPrompt = [
    `COMPANY: ${co}`,
    `PARTNER: ${partner.name} (firm: ${firm.name})`,
    `HYPERSPELL CONTEXT — drawn from ${stats.total} memories (${stats.by_scope.partner} personal · ${stats.by_scope.firm} firm-wide)`,
    '',
    `BEHAVIORAL CONTEXT — partner voice on ${co} (${voiceOnCo.length}):`,
    summarizeHits(voiceOnCo, 'voice'),
    '',
    `BEHAVIORAL CONTEXT — long-running thesis (${thesis.length}):`,
    summarizeHits(thesis, 'thesis'),
    '',
    `DECK CONTEXT — file chunks from this deal (${deckChunks.length}):`,
    summarizeHits(deckChunks, 'deck'),
    '',
    `FIRM MEMORY — prior firm-level context on space (${firmPriorMemos.length}):`,
    summarizeHits(firmPriorMemos, 'firm'),
    '',
    `WORLD FACTS — company ${(companies || []).length} · news ${(news || []).length} · github ${(github || []).length} · tweets ${(tweets || []).length} · blogs ${(blogs || []).length} · research ${(research || []).length} · pdfs ${(pdfs || []).length} · co-investors ${(coinvestors || []).length}. See CITATIONS list below.`,
    '',
    'Write the IC memo now.',
  ].join('\n');

  let llmOut;
  try { llmOut = await llmArtifact({ system: SYSTEM, user: userPrompt, citations }); }
  catch (err) { llmOut = { _error: err.message }; }

  const artifact = buildArtifact({ kind: 'ic_memo', company: co, llmOut, citations, stats, niaTotal });

  if (llmOut && !llmOut._error && !llmOut._stub) {
    writeBack({ kind: 'ic_memo', company: co, text: llmOut.body_html || llmOut.read || '' });
  }
  return { kind: 'ic_memo', data: { company: co, artifactId: artifact.id, sources: { hyperspell_total: stats.total, hyperspell_by_scope: stats.by_scope, hyperspell_by_kind: stats.by_kind, nia_total: niaTotal }, flags: artifact.flags } };
}

module.exports = {
  id: 'ic_memo',
  label: 'generate IC memo for {company}',
  triggers: ['pitch deck', 'memo', 'investment thesis', 'dataroom', 'company overview', 'deck'],
  docTypes: ['pitch_deck', 'doc'],
  intents: ['evaluate', 'write', 'decide'],
  entityTypes: ['company'],
  run,
};
