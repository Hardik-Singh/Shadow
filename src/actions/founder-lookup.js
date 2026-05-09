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

const SYSTEM = `You produce a founder/CTO profile card in the partner's voice.
- Pull GitHub & company data from CITATIONS (Nia); pull pattern-match from BEHAVIORAL CONTEXT (Hyperspell — partner's prior reactions to founder profiles).
- Cite every external claim inline as <sup><a href="#cite-N">N</a></sup>.
- Body sections: <h2>Profile</h2> (name · role · highlights), <h2>Previous</h2><ul>…</ul>, <h2>GitHub Signal</h2>, <h2>Prior Startups</h2>, <h2>Shadow Read</h2> (pattern-match against the partner's prior wins).`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [founderViews, firmFounderHistory] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: 'what user thinks about technical founders', sources: ['vault'], k: 8, halfLifeHours: 720 }),
    hs.search({ scope: 'firm', partner, firm, query: 'firm founder profile patterns successful invests', sources: ['vault'], k: 6, halfLifeHours: 8760 }),
  ]);
  // Founder context fans out across every public surface where founders leak
  // signal: GitHub commits, tweets/threads, long-form essays, news, prior
  // startup directories. Universal mode picks up cross-source matches.
  const [github, companies, news, tweets, blogs, universal] = await Promise.all([
    nia.web(`${co} CTO founder background`, 'github'),
    nia.web(co, 'company'),
    nia.web(`${co} founder press interview`, 'news'),
    nia.web(`${co} founder twitter thread`, 'tweet'),
    nia.web(`${co} founder essay personal blog`, 'blog'),
    nia.universal(`${co} founders prior startups exits`, 10),
  ]);
  const stats = hsContextStats([founderViews, firmFounderHistory]);
  const citations = mergeCitations(github, companies, news, tweets, blogs, universal);
  const niaTotal = citations.length;

  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL — ${stats.total} memories (${stats.by_scope.partner} personal · ${stats.by_scope.firm} firm)`,
    `founder preferences (${founderViews.length}):`, summarizeHits(founderViews),
    `firm history (${firmFounderHistory.length}):`, summarizeHits(firmFounderHistory),
    `world hits — github ${(github || []).length} · company ${(companies || []).length} · news ${(news || []).length} · tweets ${(tweets || []).length} · blogs ${(blogs || []).length} · universal ${(universal || []).length}`,
    'Write the founder profile now.',
  ].join('\n');

  let llmOut;
  try { llmOut = await llmArtifact({ system: SYSTEM, user: prompt, citations, maxTokens: 1600 }); }
  catch (err) { llmOut = { _error: err.message }; }

  const artifact = buildArtifact({ kind: 'founder_profile', company: co, llmOut, citations, stats, niaTotal });
  if (llmOut && !llmOut._error && !llmOut._stub) writeBack({ kind: 'founder_profile', company: co, text: llmOut.body_html || llmOut.read || '' });
  return { kind: 'founder_profile', data: { company: co, artifactId: artifact.id, sources: { hyperspell_total: stats.total, nia_total: niaTotal }, flags: artifact.flags } };
}

module.exports = {
  id: 'founder_lookup',
  label: 'look up founder of {company}',
  triggers: ['founder', 'linkedin', 'team slide', 'about us', 'co-founder', 'ceo', 'cto'],
  docTypes: ['pitch_deck', 'browser', 'doc'],
  intents: ['research', 'evaluate'],
  entityTypes: ['founder', 'company'],
  run,
};
