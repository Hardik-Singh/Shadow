const config = require('../config');

const TIMEOUT_MS = 4000;

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

async function query({ corpus, text, k = 8 }) {
  if (!config.nia.enabled) return [];
  const corpusId = config.nia.corpora[corpus];
  if (!corpusId) {
    console.warn(`[nia] no corpus mapping for ${corpus}`);
    return [];
  }
  try {
    const res = await withTimeout(
      fetch(`${config.nia.base}/v1/search`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${config.nia.apiKey}`,
        },
        body: JSON.stringify({ corpus_id: corpusId, query: text, k }),
      }),
      TIMEOUT_MS
    );
    if (!res.ok) throw new Error(`nia ${res.status}`);
    const data = await res.json();
    return Array.isArray(data.hits) ? data.hits : [];
  } catch (err) {
    console.warn('[nia] query failed', corpus, err && err.message);
    return [];
  }
}

async function multiQuery(reqs) {
  return Promise.all(reqs.map(query));
}

module.exports = { query, multiQuery, enabled: config.nia.enabled };
