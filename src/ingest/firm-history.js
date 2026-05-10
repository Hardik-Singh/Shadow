// Firm deal-history connector — surfaces past evaluations of similar
// companies the firm has already looked at. Consumed by sourcing-sheet
// and IC memo to populate the "FROM FIRM MEMORY" block, and exposed on
// the dashboard API as GET /firm/history.
//
// In production this would query a deals warehouse (Affinity / Salesforce
// / internal pipeline DB). For the demo it's a static fixture seeded from
// the firm's actual demo data so verdict cards and memos can cite real
// historical matches.

const HISTORY = [
  {
    id: 'h-newrelic-2014',
    company: 'NewRelic',
    sector: 'b2b infra',
    year: 2014,
    stage: 'Series A',
    outcome: 'invested',
    return: '8.4×',
    partner: 'Marcus Tao',
    notes: 'similar founder profile to current b2b infra wave; technical CEO + enterprise GTM thesis',
  },
  {
    id: 'h-datadog-2014',
    company: 'Datadog',
    sector: 'b2b infra',
    year: 2014,
    stage: 'Series B',
    outcome: 'invested',
    return: '22× at IPO',
    partner: 'Sasha Kim',
    notes: 'led the round; bet on observability becoming infrastructure',
  },
  {
    id: 'h-honeycomb-2018',
    company: 'Honeycomb',
    sector: 'b2b infra',
    year: 2018,
    stage: 'Series A',
    outcome: 'passed',
    partner: 'Marcus Tao',
    notes: 'passed on market sizing concerns; later regretted it',
  },
  {
    id: 'h-mira-precedent',
    company: 'Forge Health',
    sector: 'clinical ai',
    year: 2022,
    stage: 'Series A',
    outcome: 'passed',
    partner: 'Hardik Singh',
    notes: 'hospital sales cycle pattern match; 6 prior passes in this sector',
  },
  {
    id: 'h-volt-precedent',
    company: 'Tide AI',
    sector: 'consumer copilot',
    year: 2023,
    stage: 'seed',
    outcome: 'passed',
    partner: 'Hardik Singh',
    notes: 'consumer is not the firm thesis; no moat shown at seed',
  },
  {
    id: 'h-helix-precedent',
    company: 'Lambda Inference',
    sector: 'distributed inference',
    year: 2018,
    stage: 'Series A',
    outcome: 'invested',
    return: '11×',
    partner: 'Lara Reyes',
    notes: 'legacy precedent for the inference wave; team-as-thesis bet',
  },
];

function findSimilarDeals({ company, sector, limit = 5 } = {}) {
  const c = (company || '').toLowerCase();
  const s = (sector || '').toLowerCase();
  const scored = HISTORY.map((h) => {
    let score = 0;
    if (s && h.sector.toLowerCase().includes(s)) score += 3;
    if (c && h.notes.toLowerCase().includes(c)) score += 1;
    return { ...h, score };
  })
  .filter((h) => h.score > 0 || (!c && !s))
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);
  return scored;
}

function byDealId(dealId) {
  // Cheap mapping for the firm verdict view: known demo deals → curated
  // historical match. Unknown deals fall back to sector-similarity.
  const MAP = {
    d1: 'h-newrelic-2014',
    d3: 'h-datadog-2014',
    d2: 'h-mira-precedent',
    d4: 'h-volt-precedent',
    nozomio: 'h-helix-precedent',
  };
  const id = MAP[dealId];
  if (!id) return null;
  return HISTORY.find((h) => h.id === id) || null;
}

module.exports = { findSimilarDeals, byDealId, HISTORY };
