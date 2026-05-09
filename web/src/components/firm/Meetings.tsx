import { meetings, personById, Meeting } from '../../mock/data';
import { cn } from '@/lib/utils';

const TYPE_TONE: Record<Meeting['type'], string> = {
  'first call': 'bg-secondary text-secondary-foreground',
  'follow-up': 'bg-amber-50 text-amber-800',
  'partner meeting': 'bg-accent/10 text-accent',
  IC: 'bg-emerald-50 text-emerald-700',
  social: 'bg-rose-50 text-rose-700',
};

export default function Meetings({ onOpenDeal }: { onOpenDeal: (id: string) => void }) {
  const upcoming = meetings.filter((m) => m.upcoming);
  const past = meetings.filter((m) => !m.upcoming);

  return (
    <section>
      <header className="mb-5">
        <h1 className="font-serif text-[26px] tracking-tight">Meetings</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {upcoming.length} upcoming · {past.length} recent
        </p>
      </header>

      <Group title="Upcoming" items={upcoming} onOpenDeal={onOpenDeal} />
      <div className="mt-8" />
      <Group title="Recent" items={past} onOpenDeal={onOpenDeal} />
    </section>
  );
}

function Group({
  title,
  items,
  onOpenDeal,
}: {
  title: string;
  items: Meeting[];
  onOpenDeal: (id: string) => void;
}) {
  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {items.map((m, i) => (
          <button
            key={m.id}
            onClick={() => m.dealId && onOpenDeal(m.dealId)}
            className={cn(
              'grid w-full grid-cols-[140px_minmax(0,1.6fr)_minmax(0,1fr)_120px] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-secondary/30',
              i !== items.length - 1 && 'border-b border-border',
              !m.dealId && 'cursor-default',
            )}
          >
            <div className="text-[12.5px] font-medium text-foreground">{m.when}</div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium tracking-tight">{m.title}</div>
              <div className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">{m.notes}</div>
            </div>
            <div className="flex items-center -space-x-1.5">
              {m.attendeeIds.slice(0, 4).map((id) => {
                const p = personById(id);
                if (!p) return null;
                return (
                  <div
                    key={id}
                    className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold text-white/95 ring-2 ring-background"
                    style={{ background: `linear-gradient(135deg, hsl(${p.hue} 55% 52%), hsl(${(p.hue + 40) % 360} 50% 38%))` }}
                    title={p.name}
                  >
                    {p.initials}
                  </div>
                );
              })}
              {m.attendeeIds.length > 4 && (
                <div className="grid h-6 w-6 place-items-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
                  +{m.attendeeIds.length - 4}
                </div>
              )}
            </div>
            <div>
              <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', TYPE_TONE[m.type])}>
                {m.type}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
