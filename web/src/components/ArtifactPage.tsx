import { useMemo } from 'react';
import { Artifact, teammateById } from '../mock/data';
import { useArtifacts } from '../lib/use-artifacts';
import { idFromSlug, slugForArtifact } from '../lib/artifacts-api';
import { relatedRank } from '../lib/related-rank';
import VerdictPill from './VerdictPill';
import SourceChips from './SourceChips';
import { ArtifactBody, FlagsBlock, CitationsList } from './ArtifactBody';
import ShadowOpinions from './ShadowOpinions';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

type Props = {
  artifactSlugOrId: string;
  onBack?: () => void;
  onOpenInFirm?: (a: Artifact) => void;
};

function navigateToSlug(slug: string) {
  window.history.pushState({}, '', `/artifact/${slug}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function ArtifactPage({ artifactSlugOrId, onBack, onOpenInFirm }: Props) {
  const all = useArtifacts();
  const current: Artifact | null = useMemo(() => {
    if (!artifactSlugOrId) return null;
    const direct = all.find((a) => a.id === artifactSlugOrId);
    if (direct) return direct;
    const id = idFromSlug(artifactSlugOrId, all);
    if (id) return all.find((a) => a.id === id) ?? null;
    return null;
  }, [artifactSlugOrId, all]);

  const author = current ? teammateById(current.authorId) : null;
  const related = current
    ? all
        .filter((a) => a.id !== current.id && a.company === current.company)
        .sort((a, b) => relatedRank(a, current.type) - relatedRank(b, current.type))
        .slice(0, 6)
    : [];

  if (!current) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back
        </button>
        <div className="rounded-xl border border-border bg-card p-6 text-[13.5px] text-muted-foreground">
          can't find that artifact. it may not have loaded yet.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1280px] gap-x-10 gap-y-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> back
          </button>
          {onOpenInFirm && (
            <button
              onClick={() => onOpenInFirm(current)}
              className="inline-flex items-center gap-1 text-[12.5px] text-accent hover:underline"
            >
              view in firm context <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <header>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <VerdictPill verdict={current.verdict} />
            <span className="font-medium text-accent">{current.type}</span>
          </div>
          <h1 className="mt-3 font-serif text-[32px] leading-tight tracking-tight">
            {current.company}
          </h1>
          <div className="mt-1.5 text-[12.5px] text-muted-foreground">
            {author?.name} · {current.time}
          </div>
        </header>

        {current.read && (
          <p className="text-[14.5px] leading-relaxed text-foreground/90">{current.read}</p>
        )}

        <ArtifactBody current={current} />

        <FlagsBlock flags={current.flags} />

        <SourceChips sources={current.sources} />

        <CitationsList citations={current.citations} />

        {related.length > 0 && (
          <>
            <Separator />
            <section>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                related artifacts
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {related.map((a) => {
                  const slug = slugForArtifact(a);
                  return (
                    <a
                      key={a.id}
                      href={`/artifact/${slug}`}
                      onClick={(e) => { e.preventDefault(); navigateToSlug(slug); }}
                      className="rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-foreground/20 hover:bg-secondary/40"
                    >
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="font-medium text-accent">{a.type}</span>
                        <span className="ml-auto text-[11px] text-muted-foreground">{a.time}</span>
                      </div>
                      <div className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground">{a.read}</div>
                    </a>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      <div className="min-w-0">
        <ShadowOpinions artifactId={current.id} />
      </div>
    </div>
  );
}
