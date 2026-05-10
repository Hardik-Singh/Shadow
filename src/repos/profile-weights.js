// Computes behavioral weight bars from the local memory store. Cheap,
// deterministic — counts memory entries by topic/source over different
// windows and emits a bar set the dashboard renders directly.
//
// In a real backend this would also blend signals from Hyperspell vault
// ranks; here the local store is sufficient because every signal lands in
// it first (Hyperspell is a silent mirror).

const Memory = require('./memory');

const WEEK_MS = 7 * 24 * 3600 * 1000;

const TOPICS = [
  { id: 'technical_founders', label: 'Technical founders', match: /(technical|engineer|cto|github|shipping|infrastructure|infra|backend|systems)/i },
  { id: 'enterprise_gtm', label: 'Enterprise GTM', match: /(enterprise|gtm|sales|distribution|design partner|paying customer|arr|pilot)/i },
  { id: 'consumer', label: 'Consumer', match: /(consumer|growth|retention|virality|prosumer)/i },
  { id: 'b2b_infra', label: 'B2B infra', match: /(b2b|infra|developer|api|sdk|tooling|observ)/i },
  { id: 'red_flags', label: 'Red flags caught', match: /(flag|skeptic|tam|red|concern|burn|made up|inflated)/i },
  { id: 'dev_tools', label: 'Dev tools', match: /(dev tool|developer experience|dx|nia|hyperspell|cobra|context layer)/i },
];

function weights() {
  let entries = [];
  try { entries = Memory.list({ limit: 500 }) || []; }
  catch { entries = []; }

  const now = Date.now();
  const total = entries.length;
  const week = entries.filter((e) => now - new Date(e.created_at).getTime() < WEEK_MS);
  const lastWeek = entries.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return now - t >= WEEK_MS && now - t < 2 * WEEK_MS;
  });

  const bars = TOPICS.map((t) => {
    const hits = entries.filter((e) => t.match.test(e.text || '')).length;
    const score = total ? Math.min(100, Math.round((hits / Math.max(1, total / 5)) * 100)) : 0;
    return { id: t.id, label: t.label, score, count: hits };
  });

  const confidence = Math.min(100, Math.round((total / 50) * 100));
  const weeklyDelta = week.length - lastWeek.length;

  return {
    bars,
    confidence,
    signalsThisWeek: week.length,
    signalsLastWeek: lastWeek.length,
    weeklyDelta,
    totalSignals: total,
  };
}

module.exports = { weights };
