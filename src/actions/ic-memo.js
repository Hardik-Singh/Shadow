const config = require('../config');
const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const { llmJson, summarizeHits, writeBack } = require('./_synth');

const SYSTEM = `You write IC (investment committee) memos in the user's voice.
- Use the BEHAVIORAL CONTEXT for tone, skepticisms, and conviction. Echo phrases the user actually said.
- Use the WORLD FACTS for company/founder/market data. Cite nothing else.
- Output strict JSON only, no preamble. Schema:
{ "recommendation": "invest" | "pass" | "investigate",
  "conviction": "low" | "medium" | "medium-high" | "high",
  "reasons": [string],
  "risks": [string],
  "questions": [string] }`;

async function run({ company }) {
  const co = company || 'this company';
  const [voiceOnCo, thesis, deckChunks] = await Promise.all([
    hs.query({ text: `what does the user think about ${co}`, k: 8, halfLifeHours: 24, types: ['voice', 'click', 'ignore'] }),
    hs.query({ text: 'user investment thesis and skepticisms', k: 8, halfLifeHours: 720 }),
    hs.query({ text: `${co} pitch deck details`, k: 12, halfLifeHours: 24, types: ['file'] }),
  ]);

  const [companies, news, people] = await nia.multiQuery([
    { corpus: 'companies', text: co, k: 6 },
    { corpus: 'news', text: co, k: 6 },
    { corpus: 'people', text: `${co} founders`, k: 6 },
  ]);

  const niaTagged = !nia.enabled || (companies.length + news.length + people.length === 0);

  const userPrompt = [
    `COMPANY: ${co}`,
    '',
    'BEHAVIORAL CONTEXT — what user has said about this company:',
    summarizeHits(voiceOnCo, 'voice'),
    '',
    'BEHAVIORAL CONTEXT — long-running thesis:',
    summarizeHits(thesis, 'thesis'),
    '',
    'DECK CONTEXT (from dropped file chunks):',
    summarizeHits(deckChunks, 'deck'),
    '',
    'WORLD FACTS — company:',
    summarizeHits(companies, 'company'),
    'WORLD FACTS — news:',
    summarizeHits(news, 'news'),
    'WORLD FACTS — people:',
    summarizeHits(people, 'people'),
    '',
    'Write the memo now. JSON only.',
  ].join('\n');

  let memo;
  try {
    memo = await llmJson({ system: SYSTEM, user: userPrompt });
  } catch (err) {
    memo = { _error: err.message };
  }

  const data = {
    company: co,
    memo,
    sources: { hyperspell_hits: voiceOnCo.length + thesis.length + deckChunks.length, nia_hits: companies.length + news.length + people.length },
    flags: niaTagged ? ['limited external data'] : [],
  };

  if (!memo._error && !memo._stub) {
    const text = JSON.stringify(memo, null, 2);
    writeBack({ kind: 'ic_memo', company: co, text, userId: config.hyperspell.userId });
  }
  return { kind: 'ic_memo', data };
}

module.exports = { id: 'ic_memo', label: 'generate IC memo for {company}', run };
