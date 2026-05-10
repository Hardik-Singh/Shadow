// Shadow chat: ask any partner's shadow a question. Pulls memories from that
// partner's Hyperspell vault, synthesizes an answer in their voice, returns
// citations alongside.
//
// Same primitive used by both "Ask your Shadow" (partnerId='me') and the
// per-teammate "Chat with X's shadow" panel in the firm-brain view.

const ctx = require('../context');
const hs = require('../ingest/hyperspell');
const { llmJson, summarizeHits } = require('../actions/_synth');

const SYSTEM = `You answer questions in a specific partner's voice, grounded ONLY in their stored memories.
- Speak in first-person as the partner. Concise — 2-4 sentences.
- Echo specific phrases from MEMORIES when they fit. Do not invent positions the memories don't support.
- If MEMORIES is too thin to answer with conviction, say so plainly ("not enough signal yet" + the one thing you'd need to read first).
- Output strict JSON only. Schema:
  { "answer": string, "confidence": "low"|"medium"|"high", "cited_memory_ids": [string] }`;

function buildPartner(partnerId) {
  const p = ctx.partnerById(partnerId);
  if (!p) return null;
  return p;
}

function searchScopeFor(partner) {
  // ME → search own partner vault. Anyone else → teammate scope (which Hyperspell
  // routes to that user's own user_id under the hood).
  if (partner.is_me) return { scope: 'partner', partner, firm: ctx.FIRM };
  return { scope: 'teammate', partner: ctx.ME, firm: ctx.FIRM, teammatePartner: partner };
}

async function chat({ partnerId, question, dealHint, scope }) {
  if (!question || !question.trim()) {
    throw new Error('question is required');
  }
  if (scope === 'firm') {
    return firmChat({ question, dealHint });
  }
  const partner = buildPartner(partnerId);
  if (!partner) throw new Error(`unknown partner ${partnerId}`);

  const scopeArgs = searchScopeFor(partner);
  const query = dealHint ? `${question}\n(context: ${dealHint})` : question;
  let hits = [];
  try {
    hits = await hs.search({
      ...scopeArgs,
      query,
      sources: ['vault'],
      k: 10,
      halfLifeHours: 24 * 30,
    });
  } catch (err) {
    // Memory backend unreachable — return a structured failure the UI can render.
    return {
      partnerName: partner.name,
      answer: `(memory backend unreachable: ${err.message})`,
      confidence: 'low',
      citations: [],
      partnerId: partner.id,
    };
  }

  const memBlock = summarizeHits(hits, 'memory');
  const userPrompt = [
    `PARTNER: ${partner.name} (${partner.role})`,
    dealHint ? `DEAL CONTEXT: ${dealHint}` : null,
    '',
    `MEMORIES (${hits.length}, top first):`,
    memBlock,
    '',
    'Memory ids you may cite (use exactly these strings in cited_memory_ids):',
    hits.slice(0, 10).map((h, i) => `  m${i + 1} = ${(h.id || h.resource_id || `idx_${i}`)}`).join('\n'),
    '',
    `QUESTION: ${question}`,
    '',
    'Answer now. JSON only.',
  ].filter(Boolean).join('\n');

  const out = await llmJson({ system: SYSTEM, user: userPrompt, maxTokens: 600 });
  if (out._stub) {
    // No Anthropic key — degrade gracefully with a memory snapshot.
    return {
      partnerName: partner.name,
      partnerId: partner.id,
      answer: hits.length
        ? `(${partner.name}'s shadow is offline; closest memory: "${(hits[0].text || '').slice(0, 200)}")`
        : `(${partner.name} has no relevant memories yet on this.)`,
      confidence: 'low',
      citations: [],
    };
  }

  // Build citation snippets from the memories the model claimed to cite.
  const idToHit = new Map();
  hits.forEach((h, i) => {
    idToHit.set(`m${i + 1}`, h);
    if (h.id) idToHit.set(String(h.id), h);
    if (h.resource_id) idToHit.set(String(h.resource_id), h);
  });
  const citedIds = Array.isArray(out.cited_memory_ids) ? out.cited_memory_ids : [];
  const citations = citedIds.map((id) => idToHit.get(id)).filter(Boolean).slice(0, 5).map((h) => ({
    id: h.id || h.resource_id || null,
    snippet: (h.text || h.content || '').replace(/^\[shadow\|[^\]]+\]\n?/, '').trim().slice(0, 220),
    score: typeof h.adjusted === 'number' ? Number(h.adjusted.toFixed(3)) : null,
  }));

  return {
    partnerName: partner.name,
    partnerId: partner.id,
    answer: out.answer || out._raw || '(no answer)',
    confidence: out.confidence || 'medium',
    citations,
  };
}

// Firm-scope query: searches the firm-wide vault (every partner's memories)
// and synthesizes a single firm-voice answer with citations.
const FIRM_SYSTEM = `You answer in the voice of a venture firm's collective memory — a synthesis of every partner who runs Shadow.
- Cite which partners and which deals informed the answer when MEMORIES make it clear.
- Concise — 3-5 sentences. Plain language. No marketing tone.
- If MEMORIES is too thin, say so plainly and suggest who to ask.
- Output strict JSON only. Schema:
  { "answer": string, "confidence": "low"|"medium"|"high", "cited_memory_ids": [string] }`;

async function firmChat({ question, dealHint }) {
  let hits = [];
  try {
    hits = await hs.search({
      scope: 'firm',
      partner: ctx.ME,
      firm: ctx.FIRM,
      query: dealHint ? `${question}\n(context: ${dealHint})` : question,
      sources: ['vault'],
      k: 12,
      halfLifeHours: 24 * 365,
    });
  } catch (err) {
    return {
      partnerId: 'firm',
      partnerName: (ctx.FIRM && ctx.FIRM.name) || 'firm',
      answer: `(firm memory backend unreachable: ${err.message})`,
      confidence: 'low',
      citations: [],
    };
  }

  const memBlock = summarizeHits(hits, 'firm memory');
  const userPrompt = [
    `FIRM: ${(ctx.FIRM && ctx.FIRM.name) || 'firm'}`,
    dealHint ? `DEAL CONTEXT: ${dealHint}` : null,
    '',
    `MEMORIES (${hits.length}, top first):`,
    memBlock,
    '',
    'Memory ids you may cite:',
    hits.slice(0, 12).map((h, i) => `  m${i + 1} = ${(h.id || h.resource_id || `idx_${i}`)}`).join('\n'),
    '',
    `QUESTION: ${question}`,
    '',
    'Answer now. JSON only.',
  ].filter(Boolean).join('\n');

  const out = await llmJson({ system: FIRM_SYSTEM, user: userPrompt, maxTokens: 700 });
  if (out._stub) {
    return {
      partnerId: 'firm',
      partnerName: (ctx.FIRM && ctx.FIRM.name) || 'firm',
      answer: hits.length
        ? `(firm synthesis offline; closest memory: "${(hits[0].text || '').slice(0, 200)}")`
        : '(no firm memories yet on this.)',
      confidence: 'low',
      citations: [],
    };
  }

  const idToHit = new Map();
  hits.forEach((h, i) => {
    idToHit.set(`m${i + 1}`, h);
    if (h.id) idToHit.set(String(h.id), h);
    if (h.resource_id) idToHit.set(String(h.resource_id), h);
  });
  const citedIds = Array.isArray(out.cited_memory_ids) ? out.cited_memory_ids : [];
  const citations = citedIds.map((id) => idToHit.get(id)).filter(Boolean).slice(0, 6).map((h) => ({
    id: h.id || h.resource_id || null,
    snippet: (h.text || h.content || '').replace(/^\[shadow\|[^\]]+\]\n?/, '').trim().slice(0, 220),
    score: typeof h.adjusted === 'number' ? Number(h.adjusted.toFixed(3)) : null,
  }));

  return {
    partnerId: 'firm',
    partnerName: (ctx.FIRM && ctx.FIRM.name) || 'firm',
    answer: out.answer || out._raw || '(no answer)',
    confidence: out.confidence || 'medium',
    citations,
  };
}

module.exports = { chat };
