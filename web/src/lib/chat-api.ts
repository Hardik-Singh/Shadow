// Real shadow chat — talks to /chat on the dashboard API. The API resolves
// the partner, queries that partner's Hyperspell vault, and synthesizes an
// answer in their voice with citations.

const BASE =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SHADOW_API) ||
  'http://127.0.0.1:4310';

export type ShadowCitation = {
  id: string | null;
  snippet: string;
  score: number | null;
};

export type ShadowChatReply = {
  partnerId: string;
  partnerName: string;
  answer: string;
  confidence: 'low' | 'medium' | 'high';
  citations: ShadowCitation[];
};

export type AskShadowArgs = {
  partnerId: string;
  question: string;
  dealHint?: string;
};

export async function askShadow(args: AskShadowArgs): Promise<ShadowChatReply | null> {
  try {
    const res = await fetch(`${BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) return null;
    return (await res.json()) as ShadowChatReply;
  } catch {
    return null;
  }
}
