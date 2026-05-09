const config = require('../config');
const hs = require('../ingest/hyperspell');
const nia = require('../ingest/nia');
const { llmJson, summarizeHits, writeBack } = require('./_synth');

const SYSTEM = `You produce a founder/CTO profile card.
- Use BEHAVIORAL CONTEXT for what the user typically values in founders.
- Use WORLD FACTS for actual background data.
- Output strict JSON. Schema:
{ "name": string, "role": string, "previous": [string],
  "github_signal": string, "prior_startups": [string],
  "shadow_read": string }`;

async function run({ company }) {
  const co = company || 'this company';
  const [founderViews] = await Promise.all([
    hs.query({ text: 'what the user thinks about technical founders', k: 8, halfLifeHours: 720 }),
  ]);
  const [people, companies] = await nia.multiQuery([
    { corpus: 'people', text: `${co} founder CTO`, k: 6 },
    { corpus: 'companies', text: co, k: 4 },
  ]);

  const userPrompt = [
    `COMPANY: ${co}`,
    'BEHAVIORAL CONTEXT (founder preferences):', summarizeHits(founderViews),
    'WORLD FACTS — people:', summarizeHits(people),
    'WORLD FACTS — company:', summarizeHits(companies),
    'Output JSON.',
  ].join('\n');

  let card;
  try { card = await llmJson({ system: SYSTEM, user: userPrompt, maxTokens: 800 }); }
  catch (err) { card = { _error: err.message }; }

  const data = { company: co, card, flags: !nia.enabled ? ['limited external data'] : [] };
  if (!card._error && !card._stub) {
    writeBack({ kind: 'founder_profile', company: co, text: JSON.stringify(card, null, 2), userId: config.hyperspell.userId });
  }
  return { kind: 'founder_profile', data };
}

module.exports = { id: 'founder_lookup', label: 'look up founder of {company}', run };
