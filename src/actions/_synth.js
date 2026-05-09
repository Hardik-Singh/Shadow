const config = require('../config');
const MemoryRepo = require('../repos/memory');

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
    .map((h, i) => {
      const body = (h.text || h.content || '').replace(/^\[shadow\|[^\]]+\]\n?/, '').trim();
      const score = typeof h.adjusted === 'number' ? h.adjusted.toFixed(2) : '';
      return `${i + 1}. [${score}] ${body}`;
    })
    .join('\n');
}

// Aggregate counts across multiple retrieval bundles so the prompt and the
// resulting artifact card can both display "drawn from N hyperspell memories".
function hsContextStats(bundles) {
  const flat = bundles.flat();
  return {
    total: flat.length,
    by_scope: {
      partner: flat.filter((h) => h.scope === 'partner').length,
      firm: flat.filter((h) => h.scope === 'firm').length,
    },
    by_kind: flat.reduce((acc, h) => {
      const k = (h.meta && h.meta.kind) || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  };
}

function writeBack({ kind, company, text }) {
  // Generated artifacts mirror back into Hyperspell as a memory so future
  // queries see prior outputs. The MemoryRepo handles the partner+firm fanout.
  MemoryRepo.create({
    kind: 'note',
    text: `[artifact:${kind}] ${company || 'untitled'}\n${text}`,
    meta: { artifact_kind: kind, company_hint: company },
  });
}

module.exports = { llmJson, summarizeHits, hsContextStats, writeBack };
