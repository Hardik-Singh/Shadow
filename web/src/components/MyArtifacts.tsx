import { Artifact, artifacts as ALL } from '../mock/data';
import ArtifactCard from './ArtifactCard';

type Props = {
  onOpen: (a: Artifact) => void;
  pending?: Artifact[];
};

export default function MyArtifacts({ onOpen, pending = [] }: Props) {
  const list = ALL.filter((a) => a.authorId === 'me');
  const total = list.length + pending.length;

  return (
    <section>
      <div className="section-head">
        <div>
          <div className="section-title">Recent Artifacts</div>
          <div className="section-sub">{total} generated today</div>
        </div>
      </div>

      <div className="artifacts">
        {pending.map((a) => (
          <ArtifactCard key={a.id} artifact={a} onOpen={onOpen} />
        ))}
        {list.map((a) => (
          <ArtifactCard key={a.id} artifact={a} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
