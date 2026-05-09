import type { Artifact, ArtifactRelation } from '../mock/data';

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

export async function runDemoAction(kind: string, company = 'Acme Inc'): Promise<Artifact | null> {
  try {
    const res = await fetch(`${BASE}/demo/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind, company }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as Artifact;
  } catch {
    return null;
  }
}

export async function fetchRelations(params: { company?: string; type?: string; artifact?: string } = {}): Promise<Array<ArtifactRelation & { artifactId: string }>> {
  const qs = new URLSearchParams();
  if (params.company) qs.set('company', params.company);
  if (params.type) qs.set('type', params.type);
  if (params.artifact) qs.set('artifact', params.artifact);
  try {
    const res = await fetch(`${BASE}/relations?${qs.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as Array<ArtifactRelation & { artifactId: string }>;
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
