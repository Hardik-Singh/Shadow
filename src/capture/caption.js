const config = require('../config');

const PROMPT = [
  'In one sentence, describe what the user is looking at. Focus on entity names',
  '(companies, people), document type, and which slide/section. No preamble. No quotes.',
  '',
  'After that sentence, output a SECOND line with structured fields:',
  '  SIGNAL: doc_type=<one of pitch_deck, spreadsheet, email, doc, code, browser, chat, calendar, other> | entity=<company/person/topic, or —> | intents=<1-3 from evaluate, source, research, write, communicate, decide, browse, comma-separated>',
  'TWO lines total.',
].join('\n');

async function captionImage(pngBuffer) {
  if (!config.anthropic.enabled) {
    return 'screen content (vision disabled)';
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.anthropic.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.models.vision,
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: pngBuffer.toString('base64'),
                },
              },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`vision ${res.status}`);
    const data = await res.json();
    const text =
      (data.content || []).map((b) => b.text || '').join(' ').trim() || 'screen content';
    // Preserve newlines (the SIGNAL: line lives on its own line). Collapse
    // runs of horizontal whitespace within each line.
    return text
      .split('\n')
      .map((l) => l.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, 600);
  } catch (err) {
    console.warn('[caption] failed', err && err.message);
    return 'screen content (caption error)';
  }
}

module.exports = { captionImage };
