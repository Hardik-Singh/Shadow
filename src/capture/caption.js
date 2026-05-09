const config = require('../config');

const PROMPT =
  'In one sentence, describe what the user is looking at. Focus on entity names ' +
  '(companies, people), document type, and which slide/section. No preamble. No quotes.';

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
    return text.replace(/\s+/g, ' ').slice(0, 400);
  } catch (err) {
    console.warn('[caption] failed', err && err.message);
    return 'screen content (caption error)';
  }
}

module.exports = { captionImage };
