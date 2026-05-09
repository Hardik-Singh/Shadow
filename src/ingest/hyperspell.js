const config = require('../config');

const isMock = config.hyperspell.base.startsWith('mock://');
const mockStore = [];

async function realIngest(envelope) {
  const res = await fetch(`${config.hyperspell.base}/v1/memories`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.hyperspell.apiKey}`,
    },
    body: JSON.stringify({
      user_id: envelope.user_id,
      memory: {
        type: envelope.type,
        content: envelope.content,
        metadata: {
          ...envelope.meta,
          ts: envelope.ts,
          valence: envelope.valence,
          session_id: envelope.session_id,
          envelope_id: envelope.id,
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`hyperspell ingest ${res.status}`);
  return res.json();
}

async function realQuery({ text, k = 12, types }) {
  const res = await fetch(`${config.hyperspell.base}/v1/query`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.hyperspell.apiKey}`,
    },
    body: JSON.stringify({
      user_id: config.hyperspell.userId,
      query: text,
      k,
      filter: types ? { types } : undefined,
    }),
  });
  if (!res.ok) throw new Error(`hyperspell query ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.results) ? data.results : [];
}

function tokenize(s) {
  return (s || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

async function mockIngest(envelope) {
  mockStore.push({
    content: envelope.content,
    metadata: {
      ...envelope.meta,
      ts: envelope.ts,
      valence: envelope.valence,
      session_id: envelope.session_id,
      envelope_id: envelope.id,
      type: envelope.type,
    },
  });
  return { ok: true };
}

async function mockQuery({ text, k = 12, types }) {
  const qToks = new Set(tokenize(text));
  const scored = mockStore
    .filter((r) => !types || types.includes(r.metadata.type))
    .map((r) => {
      const toks = tokenize(r.content);
      let overlap = 0;
      for (const t of toks) if (qToks.has(t)) overlap++;
      const score = overlap / Math.max(qToks.size, 1);
      return { content: r.content, metadata: r.metadata, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k * 3);
  return scored;
}

async function ingest(envelope) {
  return isMock ? mockIngest(envelope) : realIngest(envelope);
}

async function rawQuery(args) {
  return isMock ? mockQuery(args) : realQuery(args);
}

async function query({ text, k = 12, halfLifeHours = 24, types }) {
  const raw = await rawQuery({ text, k, types });
  const now = Date.now();
  return raw
    .map((r) => {
      const ts = (r.metadata && r.metadata.ts) || now;
      const ageH = Math.max(0, (now - ts) / 3.6e6);
      const recency = Math.pow(0.5, ageH / halfLifeHours);
      const valence = (r.metadata && r.metadata.valence) || 0;
      const adjusted = (r.score || 0) * recency * (1 + 0.25 * valence);
      return { ...r, adjusted };
    })
    .sort((a, b) => b.adjusted - a.adjusted)
    .slice(0, k);
}

module.exports = { ingest, query, isMock };
