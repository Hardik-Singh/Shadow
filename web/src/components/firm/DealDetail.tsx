import { artifacts, Deal } from '../../mock/data';
import VerdictPill from '../VerdictPill';
import SourceChips from '../SourceChips';
import TeammateShadow from './TeammateShadow';
import FirmVerdict from './FirmVerdict';

export default function DealDetail({ deal }: { deal: Deal }) {
  const artifact = deal.yourArtifactId
    ? artifacts.find((a) => a.id === deal.yourArtifactId)
    : undefined;

  return (
    <div className="deal-detail">
      <div className="deal-detail-grid">
        <div className="deal-artifact">
          {artifact ? (
            <>
              <div className="deal-artifact-head">
                <VerdictPill verdict={artifact.verdict} />
                <span className="card-type">{artifact.type}</span>
                <span className="card-mode">{artifact.mode}</span>
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

      <FirmVerdict deal={deal} />
    </div>
  );
}
