// Hyperspell adapter — the spine. Pulling HYPERSPELL_API_KEY bricks the app.
//
// The npm `hyperspell` SDK targets stale paths (/documents/*) that 404 against the
// real API. So we hit the real endpoints (POST /memories/add, POST /memories/query)
// directly with fetch. Headers: Authorization: Bearer + X-As-User.
//
// Two-tier user model:
//   user_id "partner:<id>"  → personal vault + their OAuth-connected sources
//   user_id "firm:<id>"     → the firm brain — auto-mirror of every partner write
//
// Every memory write fans out to BOTH user_ids in parallel. The firm vault becomes
// the single source of truth for cross-partner queries — no fan-out at read time.
//
// Mock mode (HYPERSPELL_BASE=mock://local) preserved for offline dev with the same
// surface. Set HYPERSPELL_BASE to mock:// to use the in-memory adapter.

const config = require('../config');

const isMock = (config.hyperspell.base || '').startsWith('mock://');
const REAL_BASE = config.hyperspell.base.replace(/\/$/, '') || 'https://api.hyperspell.com';
const API_KEY = config.hyperspell.apiKey;

// ─────────────────────────────────────────────────────────────────────
// Real API — raw fetch, paths from the live OpenAPI spec.
// ─────────────────────────────────────────────────────────────────────

async function hsRequest(path, hsUserId, body, method = 'POST') {
  const res = await fetch(`${REAL_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'X-As-User': hsUserId,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`hyperspell ${path} ${res.status}: ${text.slice(0, 300)}`);
  }
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

const partnerUserId = (partnerId) => `partner:${partnerId}`;
const firmUserId = (firmId) => `firm:${firmId}`;

// ─────────────────────────────────────────────────────────────────────
// Mock store — same surface, in-memory.
// ─────────────────────────────────────────────────────────────────────

const mockStores = new Map(); // hsUserId -> array of memory rows

function tokenize(s) {
  return ((s || '') + '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function mockAddMemory(hsUserId, params) {
  if (!mockStores.has(hsUserId)) mockStores.set(hsUserId, []);
  const store = mockStores.get(hsUserId);
  const id = params.resource_id || `mock_${hsUserId.replace(':', '_')}_${store.length}_${Date.now()}`;
  const row = {
    resource_id: id,
    source: 'vault',
    text: params.text,
    title: params.title,
    metadata: params.metadata || {},
    created_at: Date.now(),
  };
  const i = store.findIndex((r) => r.resource_id === id);
  if (i >= 0) store[i] = row;
  else store.push(row);
  return { resource_id: id, source: 'vault', status: 'ok' };
}

function mockQuery(hsUserId, body) {
  const qToks = new Set(tokenize(body.query));
  const filter = body.options && body.options.filter;
  const store = mockStores.get(hsUserId) || [];
  const filtered = store.filter((r) => {
    if (!filter) return true;
    for (const [k, v] of Object.entries(filter)) {
      if (r.metadata[k] !== v) return false;
    }
    return true;
  });
  const scored = filtered.map((r) => {
    const toks = tokenize(r.text + ' ' + (r.title || ''));
    let overlap = 0;
    for (const t of toks) if (qToks.has(t)) overlap++;
    const score = overlap / Math.max(qToks.size, 1);
    return {
      resource_id: r.resource_id,
      source: 'vault',
      title: r.title,
      score,
      data: [{ text: r.text, __type: 'Text' }],
      summary: r.text.slice(0, 200),
      highlights: [{ text: r.text, score }],
      metadata: r.metadata,
    };
  });
  scored.sort((a, b) => b.score - a.score);
  return { documents: scored };
}

// ─────────────────────────────────────────────────────────────────────
// Core API: addMemory, updateMemory, tombstoneMemory, search.
// ─────────────────────────────────────────────────────────────────────

function buildMetadata({ partner, firm, kind, valence, sqlId, ts, dealId, companyHint, fileName, chunkIdx, chunkTotal, scope, extra }) {
  const md = {
    kind,
    firm_id: firm.id,
    partner_id: partner.id,
    scope,
    valence: valence || 0,
  };
  if (sqlId) md.sql_id = sqlId;
  if (ts) md.ts = ts;
  if (dealId) md.deal_id = dealId;
  if (companyHint) md.company_hint = companyHint.slice(0, 64);
  if (fileName) md.file_name = fileName.slice(0, 64);
  if (chunkIdx != null) md.chunk_idx = chunkIdx;
  if (chunkTotal != null) md.chunk_total = chunkTotal;
  if (extra) Object.assign(md, extra);
  return md;
}

async function addAt(hsUserId, params) {
  if (isMock) return mockAddMemory(hsUserId, params);
  return hsRequest('/memories/add', hsUserId, params);
}

async function addMemory({ partner, firm, text, kind, valence = 0, dealId, companyHint, sqlId, ts, fileName, chunkIdx, chunkTotal }) {
  const date = new Date(ts || Date.now()).toISOString();
  const title = chunkIdx != null && chunkIdx >= 0
    ? `${kind} · ${fileName} (${chunkIdx + 1}/${chunkTotal})`
    : kind;

  const partnerMd = buildMetadata({ partner, firm, kind, valence, sqlId, ts, dealId, companyHint, fileName, chunkIdx, chunkTotal, scope: 'partner' });
  const firmMd = buildMetadata({ partner, firm, kind, valence, sqlId, ts, dealId, companyHint, fileName, chunkIdx, chunkTotal, scope: 'firm' });

  const [partnerRes, firmRes] = await Promise.all([
    addAt(partnerUserId(partner.id), { text, title, date, metadata: partnerMd }),
    addAt(firmUserId(firm.id),       { text, title, date, metadata: firmMd }),
  ]);

  return {
    hs_resource_id_partner: partnerRes && partnerRes.resource_id,
    hs_resource_id_firm: firmRes && firmRes.resource_id,
  };
}

async function updateMemory({ partner, firm, partnerResourceId, firmResourceId, text, kind, valence = 0, sqlId, dealId, companyHint }) {
  if (!partnerResourceId && !firmResourceId) return { skipped: true };
  const partnerMd = buildMetadata({ partner, firm, kind, valence, sqlId, dealId, companyHint, scope: 'partner', extra: { edited: true } });
  const firmMd = buildMetadata({ partner, firm, kind, valence, sqlId, dealId, companyHint, scope: 'firm', extra: { edited: true } });
  await Promise.all([
    partnerResourceId && addAt(partnerUserId(partner.id), { text, title: kind, metadata: partnerMd, resource_id: partnerResourceId }),
    firmResourceId    && addAt(firmUserId(firm.id),       { text, title: kind, metadata: firmMd,    resource_id: firmResourceId }),
  ]);
  return { ok: true };
}

async function tombstoneMemory({ partner, firm, partnerResourceId, firmResourceId }) {
  // Real API has DELETE /memories/delete/{source}/{resource_id} per OpenAPI; use it.
  // In mock mode we overwrite with empty deleted text.
  if (isMock) {
    if (partnerResourceId) {
      await addAt(partnerUserId(partner.id), { text: '', title: 'deleted', metadata: { deleted: true }, resource_id: partnerResourceId });
    }
    if (firmResourceId) {
      await addAt(firmUserId(firm.id), { text: '', title: 'deleted', metadata: { deleted: true }, resource_id: firmResourceId });
    }
    return { ok: true };
  }
  const dels = [];
  if (partnerResourceId) {
    dels.push(hsRequest(`/memories/delete/vault/${partnerResourceId}`, partnerUserId(partner.id), null, 'DELETE').catch((e) => console.warn('[hs] delete partner failed', e.message)));
  }
  if (firmResourceId) {
    dels.push(hsRequest(`/memories/delete/vault/${firmResourceId}`, firmUserId(firm.id), null, 'DELETE').catch((e) => console.warn('[hs] delete firm failed', e.message)));
  }
  await Promise.all(dels);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Source name normalization — README/docs use `vault`; npm SDK type-defs
// claim `collections`. The OpenAPI spec uses `vault` so we standardize on that.
// ─────────────────────────────────────────────────────────────────────

const SOURCE_ALIASES = {
  vault: 'vault',
  collections: 'vault',
  gmail: 'google_mail',
  gcal: 'google_calendar',
  gdocs: 'google_docs',
};

function normalizeSources(sources) {
  if (!sources || !sources.length) return ['vault'];
  return Array.from(new Set(sources.map((s) => SOURCE_ALIASES[s] || s)));
}

// ─────────────────────────────────────────────────────────────────────
// Search — partner-scoped, firm-scoped, or teammate-scoped. Layers
// recency + valence weighting on top of HS semantic ranking.
// ─────────────────────────────────────────────────────────────────────

function rerank(rawDocs, { halfLifeHours = 24 }) {
  const now = Date.now();
  return (rawDocs || [])
    .map((d) => {
      const md = d.metadata || {};
      if (md.deleted === true || md.deleted === 'true' || md.deleted === '1') return null;
      // Body: prefer data[0].text (real shape), fall back to summary, then title.
      const body =
        (d.data && d.data[0] && d.data[0].text) ||
        d.summary ||
        d.title ||
        '';
      const ts =
        (md.ts && +md.ts) ||
        (md.created_at && Date.parse(md.created_at)) ||
        now;
      const ageH = Math.max(0, (now - ts) / 3.6e6);
      const recency = Math.pow(0.5, ageH / halfLifeHours);
      const valence = Number(md.valence || 0);
      const adjusted = (d.score || 0) * recency * (1 + 0.25 * valence);
      return {
        text: body,
        title: d.title,
        meta: md,
        score: d.score || 0,
        adjusted,
        resource_id: d.resource_id,
        scope: md.scope || (d.title && d.title.includes('firm') ? 'firm' : 'partner'),
        summary: d.summary,
        highlights: d.highlights,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.adjusted - a.adjusted);
}

async function search({ scope, partner, firm, teammatePartner, query, sources, k = 12, halfLifeHours = 24, filter, answer = false }) {
  let hsUserId;
  if (scope === 'firm') hsUserId = firmUserId(firm.id);
  else if (scope === 'teammate' && teammatePartner) hsUserId = partnerUserId(teammatePartner.id);
  else hsUserId = partnerUserId(partner.id);

  const hsSources = normalizeSources(sources);
  const body = { query, sources: hsSources };
  if (filter && Object.keys(filter).length) body.options = { filter };
  if (answer) body.answer = true;

  let raw;
  if (isMock) raw = mockQuery(hsUserId, body);
  else {
    try { raw = await hsRequest('/memories/query', hsUserId, body); }
    catch (err) {
      console.warn('[hs] query failed', err.message);
      return [];
    }
  }
  const reranked = rerank(raw.documents || [], { halfLifeHours });
  return reranked.slice(0, k);
}

// ─────────────────────────────────────────────────────────────────────
// Connection state — reads what OAuth providers a partner has authorized.
// ─────────────────────────────────────────────────────────────────────

async function listConnectedSources(partner) {
  if (isMock) return ['vault'];
  try {
    const r = await hsRequest('/connections/list', partnerUserId(partner.id), null, 'GET');
    const conns = (r && r.connections) || (Array.isArray(r) ? r : []);
    const providers = conns
      .filter((c) => (c.status || c.state) !== 'revoked' && (c.status || c.state) !== 'disconnected')
      .map((c) => c.provider || c.source)
      .filter(Boolean);
    return ['vault', ...providers];
  } catch (err) {
    console.warn('[hs] listConnectedSources failed:', err.message);
    return ['vault'];
  }
}

async function whoAmI(hsUserId) {
  if (isMock) return { mock: true, hs_user_id: hsUserId };
  try {
    return await hsRequest('/auth/me', hsUserId, null, 'GET');
  } catch (err) {
    return { error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────
// Diagnostics
// ─────────────────────────────────────────────────────────────────────

function diagnostics() {
  if (!isMock) {
    return { mode: 'real', base: REAL_BASE };
  }
  let total = 0;
  for (const v of mockStores.values()) total += v.length;
  return { mode: 'mock', users: mockStores.size, total_docs: total };
}

module.exports = {
  isMock,
  addMemory,
  updateMemory,
  tombstoneMemory,
  search,
  listConnectedSources,
  whoAmI,
  diagnostics,
  partnerUserId,
  firmUserId,
};
