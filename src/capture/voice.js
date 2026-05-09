const MemoryRepo = require('../repos/memory');

function ingestUtterance(text, confidence) {
  const trimmed = (text || '').trim();
  if (!trimmed) return;
  // Wrap in quotes to match the dashboard memory log style: '"i don\'t trust this CAC..."'
  const display = `"${trimmed}"`;
  MemoryRepo.create({ kind: 'voice', text: display, meta: { confidence: confidence || null } });
}

module.exports = { ingestUtterance };
