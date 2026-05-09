import { useMemo, useState } from 'react';
import { Artifact, artifacts as ALL, teammates, me } from '../../mock/data';
import ArtifactCard from '../ArtifactCard';

type Props = { onOpen: (a: Artifact) => void };

export default function FirmArtifacts({ onOpen }: Props) {
  const [author, setAuthor] = useState<string>('all');

  const list = useMemo(
    () => (author === 'all' ? ALL : ALL.filter((a) => a.authorId === author)),
    [author],
  );

  const authors = [me, ...teammates];

  return (
    <section>
      <div className="section-head">
        <div>
          <div className="section-title">Firm Artifacts</div>
          <div className="section-sub">{list.length} artifacts across the firm</div>
        </div>
      </div>

      <div className="filter-row">
        <button
          className={`chip ${author === 'all' ? 'active' : ''}`}
          onClick={() => setAuthor('all')}
        >
          All authors
        </button>
        {authors.map((t) => (
          <button
            key={t.id}
            className={`chip ${author === t.id ? 'active' : ''}`}
            onClick={() => setAuthor(t.id)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="artifacts">
        {list.map((a) => (
          <ArtifactCard key={a.id} artifact={a} showAuthor onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
