const config = require('../config');
const bus = require('../bus');
const hs = require('../ingest/hyperspell');
const queue = require('../ingest/queue');
const { makeEnvelope } = require('../signal');

async function llmJson({ system, user, model, maxTokens = 1500 }) {
  if (!config.anthropic.enabled) {
    return { _stub: true, note: 'synthesis disabled (no ANTHROPIC_API_KEY)' };
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.anthropic.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || config.models.synth,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).map((b) => b.text || '').join('').trim();
  const match = text.match(/\{[\s\S]*\}$/) || text.match(/\{[\s\S]*?\}/);
  try {
    return JSON.parse(match ? match[0] : text);
  } catch {
    return { _raw: text };
  }
}

function summarizeHits(hits, label, max = 8) {
  const top = (hits || []).slice(0, max);
  if (!top.length) return `(no ${label} memories)`;
  return top
    .map((h, i) => `${i + 1}. ${h.content || h.text || ''}`.trim())
    .join('\n');
}

function writeBack({ kind, company, text, userId }) {
  const env = makeEnvelope({
    type: 'file',
    content: text,
    meta: { file_name: `${kind}_${(company || 'untitled').replace(/\s+/g, '_')}.md`, company_hint: company, artifact_kind: kind },
    userId,
  });
  bus.emit('signal', env);
  queue.enqueue('artifact', () => hs.ingest(env));
}

module.exports = { llmJson, summarizeHits, writeBack };
