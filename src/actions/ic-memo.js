const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const ctx = require('../context');
const { llmJson, summarizeHits, hsContextStats, writeBack } = require('./_synth');

const SYSTEM = `You write IC (investment committee) memos in the partner's voice.
- Every BEHAVIORAL CONTEXT line is a real memory pulled from Hyperspell — echo phrases the partner actually said.
- Use WORLD FACTS for company/founder/market data. Cite nothing else.
- Output strict JSON only, no preamble. Schema:
{ "recommendation": "invest" | "pass" | "investigate",
  "conviction": "low" | "medium" | "medium-high" | "high",
  "reasons": [string],
  "risks": [string],
  "questions": [string] }`;

async function run({ company } = {}) {
  const co = company || 'this company';
  const partner = ctx.ME;
  const firm = ctx.FIRM;
  const connected = await hs.listConnectedSources(partner);

  // Hyperspell — partner vault for personal voice.
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
    // Firm vault — what has the firm previously said/written about this space?
    hs.search({
      scope: 'firm', partner, firm,
      query: `${co} comparable deals firm thesis`,
      sources: ['vault'],
      k: 8, halfLifeHours: 720 * 12, // 12-month half-life — institutional memory decays slowly
    }),
  ]);

  // Nia — world knowledge.
  const [companies, news, people] = await Promise.all([
    nia.web ? nia.web(`${co} comparable companies`, 'company') : nia.multiQuery([{ corpus: 'companies', text: co }]).then((r) => r[0] || []),
    nia.web ? nia.web(`${co} fundraise news`, 'news') : nia.multiQuery([{ corpus: 'news', text: co }]).then((r) => r[0] || []),
    nia.web ? nia.web(`${co} founders`, 'github') : nia.multiQuery([{ corpus: 'people', text: `${co} founders` }]).then((r) => r[0] || []),
  ]);

  const stats = hsContextStats([voiceOnCo, thesis, deckChunks, firmPriorMemos]);
  const niaTotal = (companies || []).length + (news || []).length + (people || []).length;

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
    `WORLD FACTS — company (${(companies || []).length}):`,
    summarizeHits(companies, 'company'),
    `WORLD FACTS — news (${(news || []).length}):`,
    summarizeHits(news, 'news'),
    `WORLD FACTS — people (${(people || []).length}):`,
    summarizeHits(people, 'people'),
    '',
    'Write the memo now. JSON only.',
  ].join('\n');

  let memo;
  try { memo = await llmJson({ system: SYSTEM, user: userPrompt }); }
  catch (err) { memo = { _error: err.message }; }

  const data = {
    company: co,
    memo,
    sources: {
      hyperspell_total: stats.total,
      hyperspell_by_scope: stats.by_scope,
      hyperspell_by_kind: stats.by_kind,
      nia_total: niaTotal,
    },
    flags: niaTotal === 0 ? ['limited external data'] : [],
    prompt_preview: userPrompt.slice(0, 600), // for the demo card debug subtitle
  };

  if (!memo._error && !memo._stub) {
    writeBack({ kind: 'ic_memo', company: co, text: JSON.stringify(memo, null, 2) });
  }
  return { kind: 'ic_memo', data };
}

module.exports = { id: 'ic_memo', label: 'generate IC memo for {company}', run };
