import { useEffect, useState } from 'react';
import Header from './components/Header';
import MyShadowTab from './components/MyShadowTab';
import FirmBrainTab from './components/firm/FirmBrainTab';
import ArtifactPage from './components/ArtifactPage';
import { PartnerChatProvider } from './components/PartnerChat';
import { Artifact, View, deals } from './mock/data';
import { TooltipProvider } from '@/components/ui/tooltip';
import { runDemoAction } from './lib/artifacts-api';

type AppView = View | 'artifact';

function readDeepLink(): { view: AppView; artifactSlug: string | null; artifactId: string | null; dealId: string | null } {
  const p = new URLSearchParams(window.location.search);
  const m = window.location.pathname.match(/^\/artifact\/([a-z0-9-]+)$/);
  if (m) {
    return { view: 'artifact', artifactSlug: m[1], artifactId: null, dealId: null };
  }
  if (window.location.pathname === '/firm/nozomio') {
    return { view: 'firm', artifactSlug: null, artifactId: null, dealId: 'd6' };
  }
  const dealId = p.get('deal');
  const artifactId = p.get('artifact');
  if (dealId && deals.find((d) => d.id === dealId)) {
    return { view: 'firm', artifactSlug: null, artifactId: null, dealId };
  }
  if (artifactId) {
    // Accept any artifact id — real artifacts (art_…) resolve from the
    // useArtifacts() stream once they arrive over SSE; mock ids match the
    // seed data on first render.
    return { view: 'mine', artifactSlug: null, artifactId, dealId: null };
  }
  if (p.get('view') === 'firm') {
    return { view: 'firm', artifactSlug: null, artifactId: null, dealId: null };
  }
  return { view: 'mine', artifactSlug: null, artifactId: null, dealId: null };
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
  const [view, setView] = useState<AppView>(initial.view);
  const [focusedDealId, setFocusedDealId] = useState<string | null>(initial.dealId);
  const [openArtifactId, setOpenArtifactId] = useState<string | null>(initial.artifactId);
  const [artifactSlug, setArtifactSlug] = useState<string | null>(initial.artifactSlug);
  const [pending, setPending] = useState<Artifact[]>([]);

  useEffect(() => {
    const onPop = () => {
      const next = readDeepLink();
      setView(next.view);
      setFocusedDealId(next.dealId);
      setOpenArtifactId(next.artifactId);
      setArtifactSlug(next.artifactSlug);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleNew = async (kind: string) => {
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

    const apiArtifact = await runDemoAction(kind);
    if (apiArtifact) {
      setPending((p) =>
        p.map((a) => (a.id === id ? apiArtifact : a)),
      );
      return;
    }

    setTimeout(() => {
      const resolved = RESOLVED_BY_KIND[kind] ?? RESOLVED_BY_KIND['IC memo'];
      setPending((p) =>
        p.map((a) =>
          a.id === id
            ? {
                ...a,
                ...resolved,
                bodyKind: 'html',
                body: `<p>${resolved.body ?? ''}</p>`,
                flags: ['local demo fallback: Electron API was not reachable'],
                status: 'final',
                time: 'just now',
              } as Artifact
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
    setArtifactSlug(null);
    const params = new URLSearchParams(window.location.search);
    params.set('view', v);
    if (v === 'mine') { params.delete('section'); params.delete('deal'); }
    window.history.replaceState({}, '', `/?${params.toString()}`);
  };

  const headerView: View = view === 'artifact' ? 'mine' : view;

  return (
    <TooltipProvider delayDuration={150}>
      <PartnerChatProvider>
        <div className="min-h-screen bg-background">
          <Header view={headerView} onViewChange={onChangeView} onNew={handleNew} />
          {view === 'artifact' ? (
            <ArtifactPage
              artifactSlugOrId={artifactSlug ?? ''}
              onBack={() => onChangeView('mine')}
              onOpenInFirm={onOpenInFirm}
            />
          ) : view === 'mine' ? (
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
