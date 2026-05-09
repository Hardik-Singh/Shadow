import type { Artifact } from '../mock/data';

const BASE =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SHADOW_API) ||
  'http://127.0.0.1:4310';

export async function fetchArtifacts(): Promise<Artifact[]> {
  try {
    const res = await fetch(`${BASE}/artifacts`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as Artifact[];
  } catch {
    return [];
  }
}

export type Unsub = () => void;

export function subscribeArtifacts(onNew: (a: Artifact) => void): Unsub {
  let es: EventSource | null = null;
  try {
    es = new EventSource(`${BASE}/events`);
    es.addEventListener('artifact', (ev: MessageEvent) => {
      try { onNew(JSON.parse(ev.data) as Artifact); } catch { /* drop malformed */ }
    });
    es.onerror = () => { /* swallow; auto-reconnects */ };
  } catch {
    es = null;
  }
  return () => { if (es) es.close(); };
}
