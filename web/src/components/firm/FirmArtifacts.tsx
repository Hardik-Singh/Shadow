import { useMemo, useState } from 'react';
import { Artifact, artifacts as ALL } from '../../mock/data';
import ArtifactCard from '../ArtifactCard';
import { cn } from '@/lib/utils';

const TYPE_ORDER = [
  'IC Memo',
  'Sourcing Sheet',
  'Founder Background',
  'Comp Table',
  'Deal Card',
  'Email Thread',
  'Slack Thread',
];

type Props = { onOpen: (a: Artifact) => void };

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

  const [active, setActive] = useState<string>('all');
  const types = ['all', ...grouped.map(([t]) => t)];
  const visible = active === 'all' ? ALL : ALL.filter((a) => a.type === active);

  return (
    <section>
      <header className="mb-5">
        <h1 className="font-serif text-[26px] tracking-tight">Artifacts</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {ALL.length} artifacts across the firm — every shadow's output
        </p>
      </header>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={cn(
              'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors',
              active === t
                ? 'border-foreground bg-foreground text-background'
                : 'border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground',
            )}
          >
            {t === 'all' ? 'All' : t}
            <span className="ml-1.5 text-[10.5px] text-muted-foreground/80">
              {t === 'all' ? ALL.length : grouped.find(([gt]) => gt === t)?.[1].length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <ArtifactCard key={a.id} artifact={a} showAuthor onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
