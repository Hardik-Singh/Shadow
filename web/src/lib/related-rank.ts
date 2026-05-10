import type { Artifact } from '../mock/data';

const SHEET_TYPES = new Set(['Sourcing Sheet', 'Source Sheet', 'Founder Background']);

const BASE_ORDER: Record<string, number> = {
  n8: 0, n7: 1, n10: 2, n6: 3, n11: 4, n12: 5, n9: 6, n4: 7,
};

function baseRank(a: Artifact): number {
  return BASE_ORDER[a.id] ?? 10;
}

// Re-weighted rank. When the open artifact's type is in SHEET_TYPES,
// promote Slack/Email kinds toward the top.
export function relatedRank(a: Artifact, openType?: string): number {
  const r = baseRank(a);
  if (openType && SHEET_TYPES.has(openType)) {
    if (a.bodyKind === 'slack' || /Slack/i.test(a.type)) return r - 6;
    if (a.bodyKind === 'email' || /Email|Pass Email/i.test(a.type)) return r - 5;
  }
  return r;
}
