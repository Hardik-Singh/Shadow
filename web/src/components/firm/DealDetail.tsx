import { useState } from 'react';
import { Artifact, artifacts, Deal, teammateById } from '../../mock/data';
import { Avatar } from '../Avatars';
import VerdictPill from '../VerdictPill';
import SourceChips from '../SourceChips';
import TeammateShadow from './TeammateShadow';
import FirmVerdict from './FirmVerdict';
import ArtifactDetail from '../ArtifactDetail';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function DealDetail({ deal }: { deal: Deal }) {
  const [open, setOpen] = useState<Artifact | null>(null);

  const artifact = deal.yourArtifactId
    ? artifacts.find((a) => a.id === deal.yourArtifactId)
    : undefined;

  const seen = new Set<string>();
  const related: Artifact[] = [];
  for (const a of artifacts) {
    if (a.id === deal.yourArtifactId) continue;
    if (a.company !== deal.company && !deal.relatedArtifactIds.includes(a.id)) continue;
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    related.push(a);
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h2 className="font-serif text-[26px] tracking-tight">{deal.company}</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {deal.thesis} · {deal.ask}
        </p>
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
