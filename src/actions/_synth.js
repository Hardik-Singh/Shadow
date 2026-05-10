const config = require('../config');
const MemoryRepo = require('../repos/memory');
const Artifacts = require('../repos/artifacts');
const { buildRelations } = require('../repos/artifact-relations');

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

function summarizeCitations(citations) {
  if (!citations || !citations.length) return '(no external citations available)';
  return citations
    .map((c, i) => `[${i + 1}] (${c.kind}) ${c.title || c.url}\n    ${(c.summary || '').slice(0, 240)}\n    ${c.url}`)
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

// Dedup citations by URL, preserving the first-seen kind/title/summary.
function mergeCitations(...buckets) {
  const seen = new Map();
  for (const bucket of buckets) {
    for (const hit of bucket || []) {
      if (!hit || !hit.url) continue;
      if (!seen.has(hit.url)) {
        seen.set(hit.url, {
          id: hit.id,
          kind: hit.kind || 'web',
          url: hit.url,
          title: hit.title || hit.url,
          summary: hit.summary || '',
        });
      }
    }
  }
  return Array.from(seen.values());
}

// Allowlist HTML sanitizer. Strips any tag not on the list and any attribute
// other than href on <a>. Keeps it deterministic — runs over LLM output
// before persisting so the dashboard can render via dangerouslySetInnerHTML.
const ALLOWED_TAGS = new Set(['h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'a', 'blockquote', 'code', 'sup', 'br']);
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  // Strip script/style blocks entirely (including inner content).
  let out = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
  // Walk tokens; rebuild with only allowed tags + safe attrs.
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (full, tag, attrs) => {
    const t = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return '';
    if (full.startsWith('</')) return `</${t}>`;
    if (t === 'a') {
      const href = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
      const url = href && href[1];
      if (!url || !/^(https?:|#)/i.test(url)) return '<a>';
      return `<a href="${url.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">`;
    }
    return `<${t}>`;
  });
  return out.trim();
}

// LLM call that produces an artifact's user-facing payload: a one-line `read`,
// a verdict, and an HTML body. Citations are passed in as numbered references
// the LLM is told to inline as <sup><a href="#cite-N">N</a></sup>.
async function llmArtifact({ system, user, citations, model, maxTokens = 2200 }) {
  const sysAugmented = [
    system,
    '',
    'OUTPUT FORMAT — strict JSON only, no preamble:',
    '{',
    '  "verdict": "invest" | "investigate" | "pass",',
    '  "read":    string  // single sentence, partner voice',
    '  "body_html": string  // HTML doc; use only h2,h3,p,ul,ol,li,strong,em,a,blockquote,code,sup,br',
    '  "used_citations": [int]  // 1-indexed citation numbers actually referenced',
    '}',
    '',
    'When you cite a CITATION, inline as <sup><a href="#cite-N">N</a></sup>. Do not invent URLs.',
    'Body must be self-contained, well-structured, partner voice, and grounded in BEHAVIORAL CONTEXT + WORLD FACTS.',
  ].join('\n');

  const userWithCites = [
    user,
    '',
    `CITATIONS (${(citations || []).length} — use [N] to refer):`,
    summarizeCitations(citations),
  ].join('\n');

  const out = await llmJson({ system: sysAugmented, user: userWithCites, model, maxTokens });
  if (out && (out._stub || out._error || out._raw)) return out;
  out.body_html = sanitizeHtml(out.body_html || '');
  if (!Array.isArray(out.used_citations)) out.used_citations = [];
  return out;
}

const KIND_LABEL = {
  ic_memo: 'IC Memo',
  sourcing_sheet: 'Sourcing Sheet',
  founder_profile: 'Founder Background',
  market_check: 'Market Check',
};

function appendCitationsSection(html, citations, used) {
  const refs = (used && used.length ? used : citations.map((_, i) => i + 1))
    .map((n) => citations[n - 1])
    .filter(Boolean);
  if (!refs.length) return html;
  const items = refs
    .map((c, i) => {
      const n = (used && used.length ? used[i] : i + 1);
      const kind = c.kind ? `<em>${c.kind}</em> · ` : '';
      return `<li id="cite-${n}">${kind}<a href="${c.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.title || c.url)}</a></li>`;
    })
    .join('');
  return `${html}<h3>Sources</h3><ol>${items}</ol>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeAgoLabel(ts = Date.now()) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.round(h / 24)} d ago`;
}

// Canonical artifact shape. Compatible with `web/src/mock/data.ts` Artifact +
// adds `citations`, `flags`, `bodyKind: 'html'`, and `raw` for diagnostics.
function buildArtifact({ kind, company, llmOut, citations, stats, niaTotal, mode = 'VC' }) {
  const flags = [];
  if (!stats || !stats.total) flags.push('limited personal context');
  if (!niaTotal) flags.push('limited external data');
  if (llmOut && llmOut._stub) flags.push('synthesis disabled (no anthropic key)');
  if (llmOut && llmOut._error) flags.push(`synth error: ${llmOut._error}`);

  const verdict = (llmOut && llmOut.verdict) || 'investigate';
  const read = (llmOut && llmOut.read) || (llmOut && llmOut._error ? `Synthesis failed: ${llmOut._error}` : `Generated ${KIND_LABEL[kind] || kind} for ${company}.`);
  const bodyHtmlRaw = (llmOut && llmOut.body_html) || '';
  const body = appendCitationsSection(bodyHtmlRaw, citations || [], llmOut && llmOut.used_citations);

  const sources = ['prior'];
  if (citations && citations.length) sources.push('nia');

  return Artifacts.add({
    company: company || 'untitled',
    type: KIND_LABEL[kind] || kind,
    kind,
    mode,
    time: timeAgoLabel(),
    authorId: 'me',
    reviewerIds: [],
    verdict,
    read,
    body,
    bodyKind: 'html',
    sources,
    citations: citations || [],
    flags,
    relations: buildRelations({ company, kind, authorId: 'me' }),
    raw: {
      hyperspell_total: stats && stats.total,
      hyperspell_by_scope: stats && stats.by_scope,
      hyperspell_by_kind: stats && stats.by_kind,
      nia_total: niaTotal || 0,
    },
    createdAt: Date.now(),
  });
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

module.exports = {
  llmJson,
  llmArtifact,
  summarizeHits,
  summarizeCitations,
  hsContextStats,
  mergeCitations,
  buildArtifact,
  sanitizeHtml,
  writeBack,
};
