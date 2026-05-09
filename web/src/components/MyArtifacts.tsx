import { Artifact, artifacts as ALL } from '../mock/data';
import ArtifactCard from './ArtifactCard';

type Props = { onOpen: (a: Artifact) => void };

export default function MyArtifacts({ onOpen }: Props) {
  const list = ALL.filter((a) => a.authorId === 'me');

  return (
    <section>
      <div className="section-head">
        <div>
          <div className="section-title">Recent Artifacts</div>
          <div className="section-sub">{list.length} generated today</div>
        </div>
      </div>

      <div className="artifacts">
        {list.map((a) => (
          <ArtifactCard key={a.id} artifact={a} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
