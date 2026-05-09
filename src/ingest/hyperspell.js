// Hyperspell adapter — the spine. Pulling HYPERSPELL_API_KEY bricks the app.
//
// Two-tier user model:
//   - clientFor(partner)  → user_id "partner:<id>"  (personal vault + their OAuth sources)
//   - clientFor(firm)     → user_id "firm:<id>"     (the firm brain — everything mirrors here)
//
// Every memory write fans out to BOTH clients in parallel. That means the firm vault
// is the single source of truth for cross-partner queries — no fan-out at read time.
//
// Mock mode (`HYPERSPELL_BASE=mock://local`) is preserved for offline dev. It exercises
// the same write/read paths with an in-memory token-overlap index.

const config = require('../config');
const HyperspellPkg = require('hyperspell');
const Hyperspell = HyperspellPkg.default || HyperspellPkg;

const isMock = (config.hyperspell.base || '').startsWith('mock://');

// ─────────────────────────────────────────────────────────────────────
// Real SDK clients — one per `userID`, lazy-cached.
// ─────────────────────────────────────────────────────────────────────

const clients = new Map();

function clientForUser(hsUserId) {
  if (!clients.has(hsUserId)) {
    clients.set(
      hsUserId,
      new Hyperspell({ apiKey: config.hyperspell.apiKey, userID: hsUserId })
    );
  }
  return clients.get(hsUserId);
}

const partnerUserId = (partnerId) => `partner:${partnerId}`;
const firmUserId = (firmId) => `firm:${firmId}`;

// ─────────────────────────────────────────────────────────────────────
// Mock store — in-memory, keyed by user_id; same shape Hyperspell SDK returns.
// ─────────────────────────────────────────────────────────────────────

const mockStores = new Map(); // user_id -> [{ resource_id, text, collection, metadata }]

function tokenize(s) {
  return ((s || '') + '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function mockAdd(userId, params) {
  if (!mockStores.has(userId)) mockStores.set(userId, []);
  const id = params.resource_id || `mock_${userId}_${mockStores.get(userId).length}_${Date.now()}`;
  const row = {
    resource_id: id,
    text: params.text,
    collection: params.collection,
    title: params.title,
    date: params.date,
    metadata: params.metadata || {},
  };
  // upsert by resource_id
  const store = mockStores.get(userId);
  const existing = store.findIndex((r) => r.resource_id === id);
  if (existing >= 0) store[existing] = row;
  else store.push(row);
  return { resource_id: id, status: 'ok' };
}

function mockSearch(userId, { query, max_results = 12, sources, collection_filter }) {
  const qToks = new Set(tokenize(query));
  const store = mockStores.get(userId) || [];
  const filtered = store.filter((r) => {
    if (collection_filter && r.collection !== collection_filter) return false;
    return true;
  });
  const scored = filtered.map((r) => {
    const toks = tokenize(r.text + ' ' + (r.title || ''));
    let overlap = 0;
    for (const t of toks) if (qToks.has(t)) overlap++;
    const score = overlap / Math.max(qToks.size, 1);
    return { content: r.text, text: r.text, metadata: r.metadata, score, resource_id: r.resource_id, collection: r.collection };
  });
  scored.sort((a, b) => b.score - a.score);
  return { documents: scored.slice(0, max_results) };
}

// ─────────────────────────────────────────────────────────────────────
// Core write — fans out to partner vault + firm vault.
// ─────────────────────────────────────────────────────────────────────

async function addMemory({ partner, firm, text, kind, valence = 0, dealId, companyHint, sqlId, ts, fileName, chunkIdx, chunkTotal }) {
  const collection = `${firm.id}__${kind}`;
  const title = chunkIdx != null ? `${kind} · ${fileName} (${chunkIdx + 1}/${chunkTotal})` : kind;
  const date = new Date(ts || Date.now()).toISOString();
  // Encode metadata into text prefix so it round-trips even if the API drops unknown fields.
  // The `[shadow|...]` envelope is parseable by parseShadowMeta() and is invisible to the LLM
  // when stripped at retrieval time.
  const metaTags = [
    `partner=${partner.id}`,
    `firm=${firm.id}`,
    `kind=${kind}`,
    `valence=${valence}`,
    sqlId && `sql_id=${sqlId}`,
    dealId && `deal=${dealId}`,
    companyHint && `co=${companyHint.replace(/[|\]]/g, '_').slice(0, 60)}`,
  ].filter(Boolean).join('|');
  const wrappedText = `[shadow|${metaTags}]\n${text}`;

  const sharedParams = { text: wrappedText, collection, title, date };
  const writes = [
    write(partnerUserId(partner.id), { ...sharedParams }),
    write(firmUserId(firm.id), { ...sharedParams, collection: `firm__${kind}` }),
  ];
  const [partnerRes, firmRes] = await Promise.all(writes);
  return {
    hs_resource_id_partner: partnerRes && partnerRes.resource_id,
    hs_resource_id_firm: firmRes && firmRes.resource_id,
  };
}

async function write(userId, params) {
  if (isMock) return mockAdd(userId, params);
  return clientForUser(userId).documents.add(params);
}

// ─────────────────────────────────────────────────────────────────────
// Update — re-add by resource_id (Hyperspell upserts).
// ─────────────────────────────────────────────────────────────────────

async function updateMemory({ partner, firm, partnerResourceId, firmResourceId, text, kind, valence, sqlId, dealId, companyHint }) {
  if (!partnerResourceId && !firmResourceId) return { skipped: true };
  const metaTags = [
    `partner=${partner.id}`, `firm=${firm.id}`, `kind=${kind}`, `valence=${valence}`,
    sqlId && `sql_id=${sqlId}`, dealId && `deal=${dealId}`, companyHint && `co=${companyHint.slice(0, 60)}`, 'edited=1',
  ].filter(Boolean).join('|');
  const wrappedText = `[shadow|${metaTags}]\n${text}`;
  const collectionPartner = `${firm.id}__${kind}`;
  const collectionFirm = `firm__${kind}`;
  await Promise.all([
    partnerResourceId && write(partnerUserId(partner.id), { text: wrappedText, collection: collectionPartner, resource_id: partnerResourceId }),
    firmResourceId && write(firmUserId(firm.id), { text: wrappedText, collection: collectionFirm, resource_id: firmResourceId }),
  ]);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Delete — soft-delete via tombstone text. The HS API surface in the SDK
// doesn't expose a documents.delete; we overwrite the resource with an
// empty "deleted" tombstone so retrieval no longer surfaces meaningful
// content. (When the SDK exposes a delete endpoint this gets swapped in.)
// ─────────────────────────────────────────────────────────────────────

async function tombstoneMemory({ partner, firm, partnerResourceId, firmResourceId }) {
  const text = '[shadow|deleted=1]\n';
  await Promise.all([
    partnerResourceId && write(partnerUserId(partner.id), { text, collection: `${firm.id}__deleted`, resource_id: partnerResourceId }),
    firmResourceId && write(firmUserId(firm.id), { text, collection: 'firm__deleted', resource_id: firmResourceId }),
  ]);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────
// Search — partner-scoped, firm-scoped, or teammate-scoped.
// Layered with recency + valence weighting on top of HS semantic ranking.
// ─────────────────────────────────────────────────────────────────────

const VALID_HS_SOURCES = new Set([
  'collections', 'web_crawler', 'notion', 'slack', 'google_calendar', 'reddit', 'box',
  'google_drive', 'airtable', 'algolia', 'amplitude', 'asana', 'ashby', 'bamboohr',
  'basecamp', 'bubbles', 'calendly', 'confluence', 'clickup', 'datadog', 'deel',
  'discord', 'dropbox', 'exa', 'facebook', 'front', 'github', 'gitlab', 'google_docs',
  'google_mail', 'google_sheet', 'hubspot', 'jira', 'linear', 'microsoft_teams',
  'mixpanel', 'monday', 'outlook', 'perplexity', 'rippling', 'salesforce', 'segment',
  'todoist', 'twitter', 'zoom',
]);

function normalizeSources(sources) {
  if (!sources || !sources.length) return ['collections'];
  return Array.from(new Set(sources.map((s) => {
    if (s === 'vault') return 'collections';
    if (s === 'gmail') return 'google_mail';
    if (s === 'gcal') return 'google_calendar';
    if (s === 'gdocs') return 'google_docs';
    return s;
  }).filter((s) => VALID_HS_SOURCES.has(s))));
}

function parseShadowMeta(text) {
  const m = (text || '').match(/^\[shadow\|([^\]]+)\]\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = Object.fromEntries(m[1].split('|').map((kv) => {
    const i = kv.indexOf('=');
    return i > 0 ? [kv.slice(0, i), kv.slice(i + 1)] : [kv, true];
  }));
  return { meta, body: text.slice(m[0].length) };
}

function rerank(rawDocs, { halfLifeHours = 24 }) {
  const now = Date.now();
  return (rawDocs || [])
    .map((d) => {
      const { meta, body } = parseShadowMeta(d.text || d.content || '');
      if (meta.deleted === '1') return null;
      const ts = d.metadata && d.metadata.ts ? +d.metadata.ts : (meta.ts ? +meta.ts : now);
      const ageH = Math.max(0, (now - ts) / 3.6e6);
      const recency = Math.pow(0.5, ageH / halfLifeHours);
      const valence = Number(meta.valence || 0);
      const adjusted = (d.score || 0) * recency * (1 + 0.25 * valence);
      return {
        text: body,
        meta,
        raw: d,
        score: d.score || 0,
        adjusted,
        resource_id: d.resource_id,
        scope: meta.firm && d.collection && d.collection.startsWith('firm__') ? 'firm' : 'partner',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.adjusted - a.adjusted);
}

async function search({ scope, partner, firm, teammatePartner, query, sources, k = 12, halfLifeHours = 24 }) {
  // Pick which user_id to query against.
  let hsUserId;
  if (scope === 'firm') hsUserId = firmUserId(firm.id);
  else if (scope === 'teammate' && teammatePartner) hsUserId = partnerUserId(teammatePartner.id);
  else hsUserId = partnerUserId(partner.id);

  const hsSources = normalizeSources(sources);
  const params = { query, sources: hsSources, max_results: k * 3 };
  let raw;
  if (isMock) raw = mockSearch(hsUserId, { query, max_results: k * 3, sources: hsSources });
  else raw = await clientForUser(hsUserId).query.search(params);
  const reranked = rerank(raw.documents || [], { halfLifeHours });
  return reranked.slice(0, k);
}

// ─────────────────────────────────────────────────────────────────────
// Connection state — read-through cache of OAuth integrations the
// partner has authorized in Hyperspell. Used to decide which `sources`
// to include in action-time queries.
// ─────────────────────────────────────────────────────────────────────

async function listConnectedSources(partner) {
  if (isMock) return ['collections'];
  try {
    // SDK surface: client.collections.list() lists collections; client.integrations.revoke() exists.
    // Without a connected-providers endpoint exposed by the SDK, we fall back to assuming `collections`
    // (the partner's vault) is the only guaranteed source. If/when SDK exposes integrations.list,
    // wire it here.
    return ['collections'];
  } catch (err) {
    console.warn('[hs] listConnectedSources failed', err && err.message);
    return ['collections'];
  }
}

// ─────────────────────────────────────────────────────────────────────
// Diagnostics — for the demo dev panel.
// ─────────────────────────────────────────────────────────────────────

function diagnostics() {
  if (!isMock) {
    return { mode: 'real', users_cached: clients.size, base: config.hyperspell.base };
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
  diagnostics,
  parseShadowMeta,
  // Test/util:
  _clientForUser: clientForUser,
};
