import { Deal, deals, teammateById } from '../../mock/data';
import { Avatar, AvatarStack } from '../Avatars';
import VerdictPill from '../VerdictPill';
import DealDetail from './DealDetail';

type Props = {
  expandedId: string | null;
  onToggle: (id: string) => void;
};

const yourVerdict = (d: Deal) => d.verdicts.find((v) => v.teammateId === 'me');

export default function Pipeline({ expandedId, onToggle }: Props) {
  return (
    <section>
      <div className="section-head">
        <div>
          <div className="section-title">Pipeline</div>
          <div className="section-sub">{deals.length} active deals across the firm</div>
        </div>
      </div>

      <div className="pipeline-table">
        {deals.map((d) => {
          const expanded = expandedId === d.id;
          const yours = yourVerdict(d);
          const team = d.verdicts.filter((v) => v.teammateId !== 'me').map((v) => v.teammateId);
          const originator = teammateById(d.originatorId);
          return (
            <div key={d.id} className={`pipeline-block ${expanded ? 'expanded' : ''}`}>
              <button
                className="pipeline-row pipeline-row-clickable"
                onClick={() => onToggle(d.id)}
                aria-expanded={expanded}
              >
                <div className="pipe-company">
                  <div className="pipe-company-top">
                    <span className="pipe-name">{d.company}</span>
                    <span className="pipe-thesis">{d.thesis}</span>
                  </div>
                  {originator && (
                    <span className="pipe-originator" title={`Originated by ${originator.name}`}>
                      <Avatar teammate={originator} size="sm" />
                      <span className="pipe-originator-text">by {originator.name}</span>
                    </span>
                  )}
                </div>
                <div className="pipe-yours">
                  {yours && <VerdictPill verdict={yours.verdict} />}
                </div>
                <div className="pipe-team">
                  <AvatarStack ids={team} size="sm" max={4} />
                </div>
                <div className="pipe-consensus">
                  <div className="pipe-consensus-track">
                    <div className="pipe-consensus-fill" style={{ width: `${d.consensus}%` }} />
                  </div>
                  <span>{d.consensus}%</span>
                </div>
                <div className="pipe-time">{d.lastActivity}</div>
                <div className="pipe-caret" aria-hidden>{expanded ? '▾' : '▸'}</div>
              </button>

              {expanded && <DealDetail deal={d} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
