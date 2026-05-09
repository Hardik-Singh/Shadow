import { useEffect, useState } from 'react';
import Header from './components/Header';
import MyShadowTab from './components/MyShadowTab';
import FirmBrainTab from './components/firm/FirmBrainTab';
import { Artifact, View, deals, artifacts } from './mock/data';

function readDeepLink(): { view: View; artifactId: string | null; dealId: string | null } {
  const p = new URLSearchParams(window.location.search);
  const dealId = p.get('deal');
  const artifactId = p.get('artifact');
  if (dealId && deals.find((d) => d.id === dealId)) {
    return { view: 'firm', artifactId: null, dealId };
  }
  if (artifactId && artifacts.find((a) => a.id === artifactId)) {
    return { view: 'mine', artifactId, dealId: null };
  }
  if (p.get('view') === 'firm') {
    return { view: 'firm', artifactId: null, dealId: null };
  }
  return { view: 'mine', artifactId: null, dealId: null };
}

export default function App() {
  const initial = readDeepLink();
  const [view, setView] = useState<View>(initial.view);
  const [focusedDealId, setFocusedDealId] = useState<string | null>(initial.dealId);
  const [openArtifactId, setOpenArtifactId] = useState<string | null>(initial.artifactId);

  useEffect(() => {
    const onPop = () => {
      const next = readDeepLink();
      setView(next.view);
      setFocusedDealId(next.dealId);
      setOpenArtifactId(next.artifactId);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleNew = (kind: string) => {
    console.log(`[shadow] new artifact requested: ${kind}`);
  };

  const onOpenInFirm = (a: Artifact) => {
    const deal = deals.find((d) => d.yourArtifactId === a.id);
    setFocusedDealId(deal?.id ?? null);
    setView('firm');
    setOpenArtifactId(null);
  };

  const onChangeView = (v: View) => {
    setView(v);
    if (v === 'mine') setFocusedDealId(null);
    setOpenArtifactId(null);
  };

  return (
    <>
      <Header view={view} onViewChange={onChangeView} onNew={handleNew} />
      <main className={`page page-${view}`}>
        {view === 'mine' ? (
          <MyShadowTab onOpenInFirm={onOpenInFirm} initialArtifactId={openArtifactId} />
        ) : (
          <FirmBrainTab focusedDealId={focusedDealId} />
        )}
      </main>
    </>
  );
}
