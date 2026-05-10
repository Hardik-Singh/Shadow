// Server-side mirror of the firm-verdict synthesis data exposed in
// web/src/mock/data.ts. Lets the dashboard fetch verdicts from the API
// instead of bundling them in the web app, which is what makes the
// "generate firm verdict" button feel real (it now talks to a server).
//
// In a real backend this would aggregate teammate verdicts from
// Hyperspell + run a synthesis prompt; here the synthesis is canned but
// served from the API like everything else.

const VERDICTS = {
  d1: {
    call: 'invest',
    consensus: '3 of 4 partners lean invest, 1 wants to investigate further on burn',
    forSignals: ['Technical founder profile (4/4 partners)', 'Infrastructure thesis match', '3 design partners paying ARR'],
    againstSignals: ['Burn rate at pre-revenue scale', 'TAM tight at niche level'],
    historicalMatch: { company: 'NewRelic', year: 2014, outcome: 'invested at Series A · 8.4× return' },
    recommendation: 'Term sheet at $7M / $32M post · push for board observer · revisit burn at month 6',
  },
  d3: {
    call: 'invest',
    consensus: '4 of 4 partners aligned invest, conviction high across the board',
    forSignals: ['Founder profile matches 4 of last 5 firm wins', 'Distributed inference is firm thesis', 'Design partners paying at scale'],
    againstSignals: ['Valuation could compress in current macro'],
    historicalMatch: { company: 'Datadog', year: 2014, outcome: 'led Series B · 22× return at IPO' },
    recommendation: 'Lead the round · push for board seat · firm should commit $8M of $12M',
  },
  nozomio: {
    call: 'investigate',
    consensus: '3 of 5 partners pass — solo founder, GTM gap, valuation. 2 lean invest on conviction lineage.',
    forSignals: ['Cobra → Nia 4-year obsession', 'Context layer is the right wedge for the next infra fight', 'Backers (PG, Wolf) are closest to dev-tool distribution'],
    againstSignals: ['Solo founder at 18 — no prior infra ship', 'GTM unproven, no design partner ARR yet', 'Round is hot at the top of firm range for unproven distribution'],
    recommendation: 'Pursue if Arlan adds a technical co-founder OR terms come in below $50M post · revisit at month 6 on net new agent-stack integrations.',
  },
};

function byDeal(dealId) {
  if (!dealId) return null;
  return VERDICTS[dealId] || null;
}

// Stub for live synthesis — kept here so the API can be wired into a real
// aggregator later without changing the response shape.
async function synthesize(dealId) {
  const cached = byDeal(dealId);
  if (cached) return cached;
  return {
    call: 'investigate',
    consensus: 'Not enough partner verdicts to synthesize yet — surface the deal in pipeline first.',
    forSignals: [],
    againstSignals: [],
    recommendation: 'Wait for at least two teammate shadows to weigh in.',
  };
}

module.exports = { byDeal, synthesize };
