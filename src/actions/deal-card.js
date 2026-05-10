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

// Lightweight pipeline-management card. Less narrative than IC memo; more
// pattern-matching than sourcing sheet. Pulls cached signal from memory and
// summarizes into a deterministic structure: shadow verdict, likely take,
// star/warn bullets, firm-shadow agreement count.
const SYSTEM = `You produce a deal card — a compact, pipeline-style summary.
- Use BEHAVIORAL CONTEXT (Hyperspell) to infer the partner's likely take and the firm-shadow agreement count.
- Use CITATIONS (Nia) only to back up star/warn bullets; do not pad with research.
- Cite external claims inline as <sup><a href="#cite-N">N</a></sup>.
- Body sections (in order):
  <h2>Shadow Verdict</h2><p>(invest / investigate / pass) + one-line rationale</p>
  <h2>Your Likely Take</h2><p>partner voice, single sentence</p>
  <h2>Stars</h2><ul>… (★ bullets)</ul>
  <h2>Warnings</h2><ul>… (⚠ bullets)</ul>
  <h2>Firm Shadows</h2><p>"N agree · M disagree" with one-line synthesis if available</p>`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME, firm = ctx.FIRM;
  const [partnerTake, recentDeal, firmShadows, redFlags] = await Promise.all([
    hs.search({ scope: 'partner', partner, firm, query: `${co} take conviction`, sources: ['vault'], k: 6, halfLifeHours: 168 }),
    hs.search({ scope: 'partner', partner, firm, query: `${co} pitch deck founders`, sources: ['vault'], k: 6, halfLifeHours: 24 }),
    hs.search({ scope: 'firm', partner, firm, query: `${co} verdict opinion`, sources: ['vault'], k: 8, halfLifeHours: 8760 }),
    hs.search({ scope: 'partner', partner, firm, query: 'red flags always-flag patterns', sources: ['vault'], k: 6, halfLifeHours: 168 }),
  ]);
  const [news, comps, social] = await Promise.all([
    nia.web(`${co} latest`, 'news'),
    nia.web(`${co} comparable companies`, 'company'),
    nia.web(`${co} founders twitter linkedin`, 'social'),
  ]);
  const stats = hsContextStats([partnerTake, recentDeal, firmShadows, redFlags]);
  const citations = mergeCitations(news, comps, social);
  const niaTotal = citations.length;

  const prompt = [
    `COMPANY: ${co}`,
    `HYPERSPELL — ${stats.total} memories`,
    `partner take history (${partnerTake.length}):`, summarizeHits(partnerTake),
    `recent deal context (${recentDeal.length}):`, summarizeHits(recentDeal),
    `firm shadow verdicts (${firmShadows.length}):`, summarizeHits(firmShadows),
    `red flag patterns (${redFlags.length}):`, summarizeHits(redFlags),
    `world hits — news ${(news || []).length} · comps ${(comps || []).length} · social ${(social || []).length}`,
    'Write the deal card now. Keep it tight — pipeline-management view, not a memo.',
  ].join('\n');

  let llmOut;
  try { llmOut = await llmArtifact({ system: SYSTEM, user: prompt, citations, maxTokens: 1100 }); }
  catch (err) { llmOut = { _error: err.message }; }

  const artifact = buildArtifact({ kind: 'deal_card', company: co, llmOut, citations, stats, niaTotal });
  if (llmOut && !llmOut._error && !llmOut._stub) writeBack({ kind: 'deal_card', company: co, text: llmOut.body_html || llmOut.read || '' });
  return { kind: 'deal_card', data: { company: co, artifactId: artifact.id, sources: { hyperspell_total: stats.total, nia_total: niaTotal }, flags: artifact.flags } };
}

module.exports = {
  id: 'deal_card',
  label: 'show deal card for {company}',
  triggers: ['pipeline', 'deal', 'pass', 'verdict', 'shortlist', 'review'],
  docTypes: ['pitch_deck', 'doc', 'browser', 'spreadsheet'],
  intents: ['evaluate', 'decide', 'browse'],
  entityTypes: ['company'],
  run,
};
