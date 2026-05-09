// Nia adapter — world knowledge for action cards.
// Hyperspell answers "what does the partner think?"; Nia answers "what's the
// fact about this company / founder / market?"
//
// API: POST https://apigcp.trynia.ai/v2/search
// Auth: Authorization: Bearer NIA_API_KEY
// Body: { mode: 'web' | 'universal' | 'deep' | 'query', query, num_results?, category? }
// Response: { github_repos: [...], documentation: [...], other_content: [{url,title,summary}], total_results }

const crypto = require('crypto');
const config = require('../config');

const BASE = (config.nia.base && config.nia.base.replace(/\/$/, '')) || 'https://apigcp.trynia.ai/v2';
const KEY = config.nia.apiKey;
const ENABLED = config.nia.enabled;
const TIMEOUT_MS = 8000;
const DEBUG = !!process.env.NIA_DEBUG;

const STATS = { callCount: 0, hitCount: 0, errorCount: 0 };

function hitId(url, title) {
  const seed = (url || '') + '|' + (title || '');
  return 'nia_' + crypto.createHash('md5').update(seed).digest('hex').slice(0, 10);
}

async function withTimeout(p, ms, label) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timeout`)), ms)),
  ]);
}

function flattenHits(data) {
  if (!data) return [];
  const hits = [];
  const push = (kind, item) => {
    const url = item.url || item.html_url;
    const title = item.title || item.full_name || url;
    if (!url && !title) return;
    hits.push({
      id: hitId(url, title),
      kind,
      url,
      title,
      summary: item.summary || item.description || item.content || '',
      score: item.score,
    });
  };
  for (const item of data.github_repos || []) push('github', item);
  for (const item of data.documentation || []) push('doc', item);
  for (const item of data.other_content || []) push('web', item);
  return hits;
}

async function callSearch(body, label = 'nia') {
  if (!ENABLED) return { github_repos: [], documentation: [], other_content: [], total_results: 0 };
  STATS.callCount += 1;
  try {
    const res = await withTimeout(
      fetch(`${BASE}/search`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      TIMEOUT_MS,
      label
    );
    if (!res.ok) throw new Error(`${label} ${res.status}`);
    const json = await res.json();
    const n = (json.github_repos || []).length + (json.documentation || []).length + (json.other_content || []).length;
    STATS.hitCount += n;
    if (DEBUG) console.log(`[nia] ${label} → ${n} hits`);
    return json;
  } catch (err) {
    STATS.errorCount += 1;
    console.warn(`[nia] ${label} failed:`, err && err.message);
    return { github_repos: [], documentation: [], other_content: [], total_results: 0 };
  }
}

// Web search — public news, blogs, company pages. `category` shifts ranking
// (e.g. 'company', 'news', 'github', 'research', 'blog', 'pdf', 'tweet').
async function web(query, category, num_results = 6) {
  const body = { mode: 'web', query, num_results };
  if (category) body.category = category;
  const data = await callSearch(body, `web(${category || 'any'})`);
  return flattenHits(data);
}

// Universal search — semantic + hybrid across pre-indexed code repos + docs + web.
async function universal(query, top_k = 12) {
  const body = { mode: 'universal', query, top_k, include_repos: true, include_docs: true };
  const data = await callSearch(body, 'universal');
  return flattenHits(data);
}

// Code search — query against specific GitHub repos.
async function code(query, repositories) {
  const body = {
    mode: 'query',
    messages: [{ role: 'user', content: query }],
    repositories,
    search_mode: 'repositories',
  };
  const data = await callSearch(body, 'code');
  return flattenHits(data);
}

// Deep / Oracle research — wired behind explicit user click only.
async function deep(query) {
  const body = { mode: 'deep', query };
  const data = await callSearch(body, 'deep');
  return flattenHits(data);
}

// Backward-compat: old action handlers call multiQuery / query({corpus,text,k}).
// Map corpus name to category.
const CORPUS_TO_CATEGORY = { companies: 'company', news: 'news', people: 'github' };

async function query({ corpus, text, k = 6 }) {
  return web(text, CORPUS_TO_CATEGORY[corpus] || corpus, k);
}

async function multiQuery(reqs) {
  return Promise.all(reqs.map(query));
}

function diagnostics() {
  return { enabled: ENABLED, base: BASE, ...STATS };
}

module.exports = {
  enabled: ENABLED,
  web, universal, code, deep,
  query, multiQuery,
  diagnostics,
};
