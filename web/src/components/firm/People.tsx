import { useState } from 'react';
import { people, Person, companyById } from '../../mock/data';
import { cn } from '@/lib/utils';
import { useArtifacts } from '@/lib/use-artifacts';
import { relationCountsForPerson } from '@/lib/relations';

const ROLE_TABS: { id: Person['role'] | 'all'; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'founder',  label: 'Founders' },
  { id: 'partner',  label: 'Partners' },
  { id: 'analyst',  label: 'Analysts' },
];

export default function People({ onOpenDeal }: { onOpenDeal: (id: string) => void }) {
  const [tab, setTab] = useState<Person['role'] | 'all'>('all');
  const artifacts = useArtifacts();
  const list = tab === 'all' ? people : people.filter((p) => p.role === tab);

  return (
    <section>
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[26px] tracking-tight">People</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {people.length} people across founders and the firm
          </p>
        </div>
        <div className="inline-flex h-8 items-center gap-0.5 rounded-md bg-secondary p-0.5">
          {ROLE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-sm px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground',
                tab === t.id && 'bg-card text-foreground shadow-soft',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p) => {
          const co = p.companyId ? companyById(p.companyId) : null;
          const relations = relationCountsForPerson(p, artifacts);
          return (
            <button
              key={p.id}
              onClick={() => co?.dealId && onOpenDeal(co.dealId)}
              className={cn(
                'group flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-colors',
                co?.dealId ? 'hover:border-foreground/20 hover:bg-secondary/40' : 'cursor-default',
              )}
            >
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white/95 ring-2 ring-background"
                style={{ background: `linear-gradient(135deg, hsl(${p.hue} 55% 52%), hsl(${(p.hue + 40) % 360} 50% 38%))` }}
              >
                {p.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="truncate text-[14px] font-semibold tracking-tight">{p.name}</div>
                  <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
                    {p.role}
                  </span>
                </div>
                <div className="mt-0.5 text-[12.5px] text-muted-foreground">{p.title}</div>
                <div className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-foreground/75">{p.blurb}</div>
                <div className="mt-2.5 text-[11px] text-muted-foreground/70">
                  Last interaction · {p.lastInteraction}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[10.5px] text-muted-foreground">
                  <span className="rounded-md bg-secondary px-1.5 py-0.5">
                    {relations.artifacts} artifacts
                  </span>
                  <span className="rounded-md bg-secondary px-1.5 py-0.5">
                    {relations.meetings} meetings
                  </span>
                  {relations.teammates > 0 && (
                    <span className="rounded-md bg-secondary px-1.5 py-0.5">
                      {relations.teammates} shadows
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
