import { useState } from 'react';
import { Artifact, Deal, teammateById } from '../../mock/data';
import { useArtifacts } from '../../lib/use-artifacts';
import { Avatar } from '../Avatars';
import VerdictPill from '../VerdictPill';
import SourceChips from '../SourceChips';
import TeammateShadow from './TeammateShadow';
import FirmVerdict from './FirmVerdict';
import ArtifactDetail from '../ArtifactDetail';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { relationsForDeal } from '@/lib/relations';

export default function DealDetail({ deal }: { deal: Deal }) {
  const [open, setOpen] = useState<Artifact | null>(null);
  const artifacts = useArtifacts();

  const artifact = deal.yourArtifactId
    ? artifacts.find((a) => a.id === deal.yourArtifactId)
    : undefined;
  const relations = relationsForDeal(deal, artifacts);
  const related = relations.artifacts.filter((a) => a.id !== deal.yourArtifactId);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="font-serif text-[26px] tracking-tight">{deal.company}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {deal.thesis} · {deal.ask}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <RelationStat label="artifacts" value={relations.counts.artifacts} />
          <RelationStat label="founders" value={relations.counts.founders} />
          <RelationStat label="meetings" value={relations.counts.meetings} />
          <RelationStat label="shadows" value={relations.counts.teammates} />
        </div>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team verdicts</TabsTrigger>
          <TabsTrigger value="related">Related findings</TabsTrigger>
          <TabsTrigger value="firm">Firm verdict</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {artifact ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <VerdictPill verdict={artifact.verdict} />
                <span className="font-medium text-accent">{artifact.type}</span>
              </div>
              <div className="mt-3 text-[14.5px] leading-relaxed text-foreground/90">{artifact.read}</div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{artifact.body}</p>
              <div className="mt-4">
                <SourceChips sources={artifact.sources} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center text-[13px] text-muted-foreground">
              No artifact yet for this deal.
            </div>
          )}
        </TabsContent>

        <TabsContent value="team">
          <div className="grid grid-cols-1 gap-3">
            {deal.verdicts.map((v) => (
              <TeammateShadow key={v.teammateId} dealId={deal.id} v={v} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="related">
          {related.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-6 text-center text-[13px] text-muted-foreground">
              No related findings yet from other shadows.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {related.map((a) => {
                const author = teammateById(a.authorId);
                return (
                  <button
                    key={a.id}
                    className="rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:border-foreground/20 hover:bg-secondary/40"
                    onClick={() => setOpen(a)}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[12px]">
                      {author && <Avatar teammate={author} size="xs" interactive={false} />}
                      <span className="font-semibold">{author?.name ?? 'Unknown'}</span>
                      <span className="text-muted-foreground">· {a.type}</span>
                      <VerdictPill verdict={a.verdict} />
                      <span className="ml-auto text-[11px] text-muted-foreground/70">{a.time}</span>
                    </div>
                    <div className="mt-2 text-[13px] leading-snug text-muted-foreground">{a.read}</div>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="firm">
          <FirmVerdict deal={deal} />
        </TabsContent>
      </Tabs>

      <ArtifactDetail artifact={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function RelationStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
      <div className="font-mono text-[15px] leading-none tabular-nums">{value}</div>
      <div className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
