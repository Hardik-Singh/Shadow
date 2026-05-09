const config = require('../config');
const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const { llmJson, summarizeHits, writeBack } = require('./_synth');

const SYSTEM = `You produce sourcing sheets for the user — a one-page company brief in the user's voice.
- Use BEHAVIORAL CONTEXT for tone and what the user typically wants to dig on.
- Use WORLD FACTS for the company / market / team data.
- Output strict JSON. Schema:
{ "company": string, "founded": string, "location": string, "team_size": string,
  "ask": string, "product": string, "team": string, "market": string,
  "competitors": [string], "recent_news": [string],
  "what_to_dig_on": [string] }`;

async function run({ company }) {
  const co = company || 'this company';
  const [thesis, deckChunks] = await Promise.all([
    hs.query({ text: 'what the user wants to dig on in early-stage companies', k: 8, halfLifeHours: 720 }),
    hs.query({ text: `${co} company details`, k: 12, halfLifeHours: 24, types: ['file'] }),
  ]);
  const [companies, news, people] = await nia.multiQuery([
    { corpus: 'companies', text: co, k: 6 },
    { corpus: 'news', text: co, k: 6 },
    { corpus: 'people', text: `${co} founders team`, k: 6 },
  ]);

  const userPrompt = [
    `COMPANY: ${co}`,
    'BEHAVIORAL CONTEXT (user dig-areas):', summarizeHits(thesis),
    'DECK CONTEXT:', summarizeHits(deckChunks),
    'WORLD FACTS — company:', summarizeHits(companies),
    'WORLD FACTS — news:', summarizeHits(news),
    'WORLD FACTS — people:', summarizeHits(people),
    'Output JSON.',
  ].join('\n');

  let sheet;
  try { sheet = await llmJson({ system: SYSTEM, user: userPrompt }); }
  catch (err) { sheet = { _error: err.message }; }

  const data = { company: co, sheet, flags: !nia.enabled ? ['limited external data'] : [] };
  if (!sheet._error && !sheet._stub) {
    writeBack({ kind: 'sourcing_sheet', company: co, text: JSON.stringify(sheet, null, 2), userId: config.hyperspell.userId });
  }
  return { kind: 'sourcing_sheet', data };
}

module.exports = { id: 'sourcing_sheet', label: 'generate sourcing sheet for {company}', run };
