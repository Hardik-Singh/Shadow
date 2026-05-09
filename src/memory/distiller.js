// Reads the rolling buffer, asks Flash to extract durable behavioral signals,
// dedupes against recent saved signals, returns rows ready for store.append().
const buffer = require('./buffer');
const store = require('./store');

const MODEL = 'gemini-flash-latest';

const PROMPT = [
  'You watch a venture capital partner work. From the recent observations below, extract DURABLE behavioral signals — preferences, patterns, instincts, biases. Things that would still be true tomorrow.',
  '',
  'Strict rules:',
  '- Output JSON only: {"signals":[{"verb":"saving|updating|flagging|linking","text":"<one short sentence>","evidence_ts":<ms epoch or null>}]}',
  '- 0–3 signals. Empty array is fine and often correct.',
  '- NO verbatim quotes longer than 8 words. Paraphrase.',
  '- NO transient facts ("they are looking at Acme deck right now"). Only patterns.',
  '- NO speculation. Only what the observations directly support.',
  '- Keep each `text` under 90 characters.',
].join('\n');

function buildUserContent(entries) {
  const lines = entries.map((e) => `[${new Date(e.ts).toISOString()}] (${e.kind}) ${e.text}`);
  return 'RECENT OBSERVATIONS:\n' + lines.join('\n');
}

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function dedupe(rows) {
  const recent = store.recent(50).map((r) => normalize(r.text));
  const seen = new Set(recent);
  const out = [];
  for (const r of rows) {
    const key = normalize(r.text);
    if (!key || seen.has(key)) continue;
    // crude overlap check against most-recent items
    let dup = false;
    for (const k of recent.slice(0, 20)) {
      if (k && (k.includes(key) || key.includes(k))) { dup = true; break; }
    }
    if (dup) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function distill() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];
  const entries = buffer.snapshot();
  if (entries.length < 3) return [];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: PROMPT + '\n\n' + buildUserContent(entries) }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 400,
      responseMimeType: 'application/json',
    },
  };

  let parsed;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('[distiller] http', res.status, (await res.text()).slice(0, 200));
      return [];
    }
    const j = await res.json();
    const text = (j.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
    parsed = JSON.parse(text);
  } catch (e) {
    console.error('[distiller]', e && e.message);
    return [];
  }

  const raw = Array.isArray(parsed?.signals) ? parsed.signals : [];
  const cleaned = raw
    .filter((r) => r && typeof r.text === 'string' && r.text.trim().length)
    .map((r) => ({
      verb: ['saving', 'updating', 'flagging', 'linking'].includes(r.verb) ? r.verb : 'saving',
      text: r.text.trim().slice(0, 140),
      evidence_ts: typeof r.evidence_ts === 'number' ? r.evidence_ts : null,
    }));

  const fresh = dedupe(cleaned);
  if (!fresh.length) return [];
  return store.append(fresh);
}

module.exports = { distill };
