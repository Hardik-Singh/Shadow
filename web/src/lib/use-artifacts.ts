import { useEffect, useState } from 'react';
import { artifacts as mockArtifacts, type Artifact } from '../mock/data';
import { fetchArtifacts, subscribeArtifacts } from './artifacts-api';

// Returns real artifacts from the Electron HTTP/SSE bridge merged on top of
// the mock seed data. The mock rows stay first-class so the dashboard still
// has something to show when the desktop app isn't running.
export function useArtifacts(): Artifact[] {
  const [live, setLive] = useState<Artifact[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchArtifacts().then((rows) => { if (mounted) setLive(rows); });
    const unsub = subscribeArtifacts((a) => {
      setLive((prev) => {
        if (prev.find((x) => x.id === a.id)) return prev;
        return [a, ...prev];
      });
    });
    return () => { mounted = false; unsub(); };
  }, []);

  return [...live, ...mockArtifacts];
}
