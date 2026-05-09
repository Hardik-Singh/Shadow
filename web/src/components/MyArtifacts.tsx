import { Artifact } from '../mock/data';
import ArtifactCard from './ArtifactCard';
import { useArtifacts } from '../lib/use-artifacts';

type Props = {
  onOpen: (a: Artifact) => void;
  pending?: Artifact[];
};

export default function MyArtifacts({ onOpen, pending = [] }: Props) {
  const ALL = useArtifacts();
  const list = ALL.filter((a) => a.authorId === 'me');
  const total = list.length + pending.length;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Your artifacts
          </div>
          <h3 className="mt-1 text-[15px] font-semibold tracking-tight">Recent · {total}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
