import { useEffect, useState } from 'react';
import Header from './components/Header';
import MyShadowTab from './components/MyShadowTab';
import FirmBrainTab from './components/firm/FirmBrainTab';
import { PartnerChatProvider } from './components/PartnerChat';
import { Artifact, View, deals } from './mock/data';
import { TooltipProvider } from '@/components/ui/tooltip';

function readDeepLink(): { view: View; artifactId: string | null; dealId: string | null } {
  const p = new URLSearchParams(window.location.search);
  const dealId = p.get('deal');
  const artifactId = p.get('artifact');
  if (dealId && deals.find((d) => d.id === dealId)) {
    return { view: 'firm', artifactId: null, dealId };
  }
  if (artifactId) {
    // Accept any artifact id — real artifacts (art_…) resolve from the
    // useArtifacts() stream once they arrive over SSE; mock ids match the
    // seed data on first render.
    return { view: 'mine', artifactId, dealId: null };
  }
  if (p.get('view') === 'firm') {
    return { view: 'firm', artifactId: null, dealId: null };
  }
  return { view: 'mine', artifactId: null, dealId: null };
}

const RESOLVED_BY_KIND: Record<string, Partial<Artifact>> = {
  'IC memo': {
    type: 'IC Memo', company: 'New IC Memo · draft',
    verdict: 'investigate',
    read: 'Draft generated. Open to review and edit before saving.',
    body: 'Recommendation: investigate. Conviction: medium. Top question: who is the customer and what are they actually paying for?',
    sources: ['notion'],
  },
  'Sourcing sheet': {
    type: 'Sourcing Sheet', company: 'New sourcing sheet · draft',
    verdict: 'investigate',
    read: 'Sheet built from connected sources. Comps and team pulled.',
    body: 'Team · market · comps · recent news — all auto-populated. Edit anything before saving.',
    sources: ['notion', 'prior'],
  },
  'Founder background': {
    type: 'Founder Background', company: 'New founder card · draft',
    verdict: 'investigate',
    read: 'Background pulled from public sources.',
    body: 'GitHub · LinkedIn · prior companies · referenced exits.',
    sources: ['prior'],
  },
  'Comp table': {
    type: 'Comp Table', company: 'New comp table · draft',
    verdict: 'investigate',
    read: 'Public comps + firm prior deals.',
    body: 'Datadog / Honeycomb / NewRelic at relevant stages, plus firm-internal comps.',
    sources: ['prior'],
  },
  'Deal card': {
    type: 'Deal Card', company: 'New deal card · draft',
    verdict: 'investigate',
    read: 'Watchlist entry created.',
    body: 'Snapshot for the watchlist. You can promote to a sourcing sheet later.',
    sources: [],
  },
};

export default function App() {
  const initial = readDeepLink();
  const [view, setView] = useState<View>(initial.view);
  const [focusedDealId, setFocusedDealId] = useState<string | null>(initial.dealId);
  const [openArtifactId, setOpenArtifactId] = useState<string | null>(initial.artifactId);
  const [pending, setPending] = useState<Artifact[]>([]);

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
    const id = `gen-${Date.now()}`;
    const stub: Artifact = {
      id,
      company: `Generating ${kind}…`,
      type: kind,
      mode: 'VC',
      time: 'just now',
      authorId: 'me',
      reviewerIds: [],
      verdict: 'investigate',
      read: '',
      body: '',
      sources: [],
      status: 'generating',
    };
    setPending((p) => [stub, ...p]);
    setView('mine');

    setTimeout(() => {
      const resolved = RESOLVED_BY_KIND[kind] ?? RESOLVED_BY_KIND['IC memo'];
      setPending((p) =>
        p.map((a) =>
          a.id === id
            ? { ...a, ...resolved, status: 'final', time: 'just now' } as Artifact
            : a,
        ),
      );
    }, 1800);
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
    const params = new URLSearchParams(window.location.search);
    params.set('view', v);
    if (v === 'mine') { params.delete('section'); params.delete('deal'); }
    window.history.replaceState({}, '', `?${params.toString()}`);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <PartnerChatProvider>
        <div className="min-h-screen bg-background">
          <Header view={view} onViewChange={onChangeView} onNew={handleNew} />
          {view === 'mine' ? (
            <MyShadowTab
              onOpenInFirm={onOpenInFirm}
              initialArtifactId={openArtifactId}
              pending={pending}
            />
          ) : (
            <FirmBrainTab focusedDealId={focusedDealId} />
          )}
        </div>
      </PartnerChatProvider>
    </TooltipProvider>
  );
}
