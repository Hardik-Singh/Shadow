// Vision-relevance scorer. Pure function: maps (action_metadata, screen_signal)
// to a score in [0,1]. Designed to be replaced by a learned model later — the
// engine treats this as one signal in a blend, so a smarter scorer can drop in
// without changing callers.

function scoreAction(action, signal) {
  if (!signal) return 0;
  const raw = (signal.raw || '').toLowerCase();
  let score = 0;

  if (Array.isArray(action.triggers)) {
    for (const t of action.triggers) {
      if (t && raw.includes(String(t).toLowerCase())) {
        score += 0.5;
        break;
      }
    }
  }

  if (Array.isArray(action.docTypes) && signal.docType && action.docTypes.includes(signal.docType)) {
    score += 0.3;
  }

  if (Array.isArray(action.intents) && Array.isArray(signal.intents)) {
    const overlap = signal.intents.some((i) => action.intents.includes(i));
    if (overlap) score += 0.2;
  }

  return Math.min(1, score);
}

module.exports = { scoreAction };
