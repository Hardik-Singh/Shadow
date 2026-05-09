const config = require('../config');
const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const { llmJson, summarizeHits, writeBack } = require('./_synth');

const SYSTEM = `You produce a market/TAM check card.
- Use BEHAVIORAL CONTEXT for the user's TAM skepticism patterns. Echo phrases they actually said.
- Use WORLD FACTS for real comparable companies/exits.
- Output strict JSON. Schema:
{ "claimed_tam": string, "shadow_assessment": string, "comparable_exits": [string],
  "user_skepticism_signals": [string] }`;

async function run({ company }) {
  const co = company || 'this company';
  const [tamSkepticism, deckChunks] = await Promise.all([
    hs.query({ text: 'user TAM skepticism made-up market size', k: 8, halfLifeHours: 168, types: ['voice'] }),
    hs.query({ text: `${co} market size TAM`, k: 6, halfLifeHours: 24, types: ['file'] }),
  ]);
  const [companies, news] = await nia.multiQuery([
    { corpus: 'companies', text: `${co} comparable companies market`, k: 6 },
    { corpus: 'news', text: `${co} market exits`, k: 6 },
  ]);

  const userPrompt = [
    `COMPANY: ${co}`,
    'BEHAVIORAL CONTEXT (TAM skepticism):', summarizeHits(tamSkepticism),
    'DECK CONTEXT (market claims):', summarizeHits(deckChunks),
    'WORLD FACTS — comps:', summarizeHits(companies),
    'WORLD FACTS — exits/news:', summarizeHits(news),
    'Output JSON.',
  ].join('\n');

  let card;
  try { card = await llmJson({ system: SYSTEM, user: userPrompt, maxTokens: 800 }); }
  catch (err) { card = { _error: err.message }; }

  const data = { company: co, card, flags: !nia.enabled ? ['limited external data'] : [] };
  if (!card._error && !card._stub) {
    writeBack({ kind: 'market_check', company: co, text: JSON.stringify(card, null, 2), userId: config.hyperspell.userId });
  }
  return { kind: 'market_check', data };
}

module.exports = { id: 'market_check', label: 'check TAM / market for {company}', run };
