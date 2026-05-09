import { useState } from 'react';
import { Artifact, artifacts, Deal, teammateById } from '../../mock/data';
import { Avatar } from '../Avatars';
import VerdictPill from '../VerdictPill';
import SourceChips from '../SourceChips';
import TeammateShadow from './TeammateShadow';
import FirmVerdict from './FirmVerdict';
import ArtifactDetail from '../ArtifactDetail';

export default function DealDetail({ deal }: { deal: Deal }) {
  const [open, setOpen] = useState<Artifact | null>(null);

  const artifact = deal.yourArtifactId
    ? artifacts.find((a) => a.id === deal.yourArtifactId)
    : undefined;

  // surface every artifact about this company that isn't your primary one,
  // plus any explicitly-tagged related ids (de-duplicated)
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
    <div className="deal-detail">
      <div className="deal-detail-grid">
        <div className="deal-artifact">
          {artifact ? (
            <>
              <div className="deal-artifact-head">
                <VerdictPill verdict={artifact.verdict} />
                <span className="card-type">{artifact.type}</span>
              </div>
              <h3 className="deal-artifact-company">{artifact.company}</h3>
              <div className="deal-artifact-read">{artifact.read}</div>
              <div className="deal-artifact-body">{artifact.body}</div>
              <SourceChips sources={artifact.sources} />
            </>
          ) : (
            <div className="empty">No artifact yet for this deal.</div>
          )}
        </div>

        <div className="deal-teammates">
          <div className="section-title">Shadow verdicts across the team</div>
          <div className="teammate-list">
            {deal.verdicts.map((v) => (
              <TeammateShadow key={v.teammateId} dealId={deal.id} v={v} />
            ))}
          </div>
        </div>
      </div>

      <div className="deal-divider" aria-hidden />

      <div className="deal-related">
        <div className="section-title">Related findings from other shadows</div>
        {related.length === 0 ? (
          <div className="empty">No related findings yet from other shadows.</div>
        ) : (
          <div className="related-list">
            {related.map((a) => {
              const author = teammateById(a.authorId);
              return (
                <button
                  key={a.id}
                  className="related-card"
                  onClick={() => setOpen(a)}
                >
                  <div className="related-head">
                    {author && <Avatar teammate={author} size="sm" />}
                    <span className="related-author">{author?.name ?? 'Unknown'}</span>
                    <span className="related-type">· {a.type}</span>
                    <VerdictPill verdict={a.verdict} />
                    <span className="related-time">{a.time}</span>
                  </div>
                  <div className="related-read">{a.read}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="deal-divider" aria-hidden />

      <FirmVerdict deal={deal} />

      <ArtifactDetail artifact={open} onClose={() => setOpen(null)} />
    </div>
  );
}
