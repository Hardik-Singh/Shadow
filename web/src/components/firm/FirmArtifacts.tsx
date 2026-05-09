import { useMemo } from 'react';
import { Artifact, artifacts as ALL } from '../../mock/data';
import ArtifactCard from '../ArtifactCard';

type Props = { onOpen: (a: Artifact) => void };

const TYPE_ORDER = [
  'IC Memo',
  'Sourcing Sheet',
  'Founder Background',
  'Comp Table',
  'Deal Card',
  'Email Thread',
  'Slack Thread',
];

export default function FirmArtifacts({ onOpen }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, Artifact[]>();
    for (const a of ALL) {
      const list = map.get(a.type) ?? [];
      list.push(a);
      map.set(a.type, list);
    }
    return Array.from(map.entries()).sort(
      ([a], [b]) => TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b),
    );
  }, []);

  return (
    <section>
      <div className="section-head">
        <div>
          <div className="section-title">Firm Artifacts</div>
          <div className="section-sub">{ALL.length} artifacts across the firm · grouped by type</div>
        </div>
      </div>

      <div className="artifact-groups">
        {grouped.map(([type, list]) => (
          <div key={type} className="artifact-group">
            <div className="artifact-group-head">
              <div className="artifact-group-title">{type}</div>
              <div className="artifact-group-count">{list.length}</div>
            </div>
            <div className="artifacts">
              {list.map((a) => (
                <ArtifactCard key={a.id} artifact={a} showAuthor onOpen={onOpen} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
