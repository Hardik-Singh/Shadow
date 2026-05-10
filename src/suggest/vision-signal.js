// Parses screen captions into structured signals: { docType, entity, intents, raw }.
//
// The vision prompts emit a free-text "Document/Context · Specific thing in view"
// line followed by an optional structured "SIGNAL: doc_type=X | entity=Y | intents=a,b"
// line. If the SIGNAL line is missing or malformed, we infer from the free text
// using simple keyword heuristics so the ranker keeps working.

const DOC_TYPES = [
  'pitch_deck', 'spreadsheet', 'email', 'doc',
  'code', 'browser', 'chat', 'calendar', 'other',
];
const INTENTS = ['evaluate', 'source', 'research', 'write', 'communicate', 'decide', 'browse'];
const NOZOMIO_DEMO_KEYWORDS = ['arlan', 'linkedin', 'nozomio', 'rakhmetzhanov', 'deck', '.pdf', 'slide', 'series f', 'series-f', 'seriesf', 'pitch'];
const DEMO_THOUGHTS = [];

function demoShortcutEnabled() {
  return process.env.SHADOW_DEMO_NOZOMIO !== '0';
}

function detectNozomioDemoSignal(text) {
  if (!demoShortcutEnabled()) return null;
  const raw = (text || '').trim();
  const haystack = raw.toLowerCase();
  if (!haystack) return null;
  const isDeck = ['deck', '.pdf', 'slide'].some((k) => haystack.includes(k));
  const keyword = isDeck
    ? ['deck', '.pdf', 'slide'].find((k) => haystack.includes(k))
    : NOZOMIO_DEMO_KEYWORDS.find((k) => haystack.includes(k));
  if (!keyword) return null;
  return {
    docType: isDeck ? 'pitch_deck' : 'browser',
    entity: 'Nozomio',
    intents: isDeck ? ['evaluate', 'write', 'communicate'] : ['research', 'source'],
    raw,
    demo: 'nozomio',
    keyword,
  };
}

function detectDemoThoughtSignal(text) {
  if (!demoShortcutEnabled()) return null;
  const raw = (text || '').trim();
  if (!raw) return null;
  for (const t of DEMO_THOUGHTS) {
    if (!t.re.test(raw)) continue;
    if (t.require && !t.require.test(raw)) continue;
    return { id: t.id, text: t.text, label: t.label, raw };
  }
  return null;
}

const DOC_KEYWORDS = [
  [/\bpitch\s*deck\b|\bdeck\b|\bslide\b/i, 'pitch_deck'],
  [/\bspreadsheet\b|\bairtable\b|\bsheet\b|\bnotion\s+database\b/i, 'spreadsheet'],
  [/\bemail\b|\bgmail\b|\boutlook\b|\binbox\b/i, 'email'],
  [/\bvs\s*code\b|\.tsx?\b|\.py\b|\.js\b|\bcode\b/i, 'code'],
  [/\bslack\b|\bdiscord\b|\bchat\b|\bdm\b/i, 'chat'],
  [/\bcalendar\b|\bgoogle\s+calendar\b|\bevent\b/i, 'calendar'],
  [/\bchrome\b|\bsafari\b|\bbrowser\b|https?:\/\//i, 'browser'],
  [/\bmemo\b|\bdoc\b|\bnotion\b|\bgoogle\s+doc\b/i, 'doc'],
];

function inferDocType(raw) {
  for (const [re, t] of DOC_KEYWORDS) if (re.test(raw)) return t;
  return 'other';
}

function inferEntity(raw) {
  // Prefer explicit "for X" / "X Inc" patterns; fall back to first TitleCase token.
  const named = raw.match(/\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,2}(?:\s+(?:Inc|Co|Labs|AI|Technologies|Corp))?)\b/);
  return named ? named[1] : '';
}

function inferIntents(raw) {
  const out = [];
  if (/\bmemo\b|\bIC\b|\binvest(ment)?\b/i.test(raw)) out.push('evaluate');
  if (/\bsourcing\b|\bbatch\b|\bdirectory\b|\bpipeline\b/i.test(raw)) out.push('source');
  if (/\bmarket\b|\bcompetitors?\b|\bfounder\b|\blinkedin\b/i.test(raw)) out.push('research');
  if (/\bdraft\b|\bwrit\w+\b|\bcursor\b|\bediting\b/i.test(raw)) out.push('write');
  if (/\bemail\b|\bslack\b|\bchat\b|\breply\b/i.test(raw)) out.push('communicate');
  if (/\bflag\b|\bpass\b|\bdecid\w+\b|\brisk\b/i.test(raw)) out.push('decide');
  if (!out.length) out.push('browse');
  return Array.from(new Set(out)).slice(0, 3);
}

function parseStructuredLine(line) {
  // Format: "SIGNAL: doc_type=X | entity=Y | intents=a,b,c"
  const m = line.match(/SIGNAL:\s*(.+)$/i);
  if (!m) return null;
  const fields = {};
  for (const part of m[1].split('|')) {
    const [k, v] = part.split('=').map((s) => (s || '').trim());
    if (k && v != null) fields[k.toLowerCase()] = v;
  }
  const docType = (fields.doc_type || '').toLowerCase();
  const entity = fields.entity && fields.entity !== '—' ? fields.entity : '';
  const intents = (fields.intents || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter((s) => INTENTS.includes(s));
  if (!DOC_TYPES.includes(docType)) return null;
  return { docType, entity, intents };
}

function parseScreenSignal(text) {
  const raw = (text || '').trim();
  if (!raw) return { docType: 'other', entity: '', intents: ['browse'], raw: '' };

  const demo = detectNozomioDemoSignal(raw);
  if (demo) return demo;

  for (const line of raw.split('\n')) {
    const parsed = parseStructuredLine(line);
    if (parsed) {
      return {
        docType: parsed.docType,
        entity: parsed.entity || inferEntity(raw),
        intents: parsed.intents.length ? parsed.intents : inferIntents(raw),
        raw,
      };
    }
  }

  return {
    docType: inferDocType(raw),
    entity: inferEntity(raw),
    intents: inferIntents(raw),
    raw,
  };
}

module.exports = {
  parseScreenSignal,
  detectNozomioDemoSignal,
  detectDemoThoughtSignal,
  DOC_TYPES,
  INTENTS,
  NOZOMIO_DEMO_KEYWORDS,
};
