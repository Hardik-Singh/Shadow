import { Deal, deals, teammateById } from '../../mock/data';
import { Avatar, AvatarStack } from '../Avatars';
import VerdictPill from '../VerdictPill';
import { cn } from '@/lib/utils';

const yourVerdict = (d: Deal) => d.verdicts.find((v) => v.teammateId === 'me');

export default function Pipeline({ onOpenDeal }: { onOpenDeal: (id: string) => void }) {
  return (
    <section>
      <header className="mb-5">
        <h1 className="font-serif text-[26px] tracking-tight">Pipeline</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {deals.length} active deals across the firm
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="grid grid-cols-[minmax(0,2fr)_120px_minmax(0,1fr)_160px_120px_28px] items-center gap-4 border-b border-border bg-secondary/40 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <div>Company</div>
          <div>Your read</div>
          <div>Team</div>
          <div>Consensus</div>
          <div>Last activity</div>
          <div />
        </div>
        {deals.map((d, i) => {
          const yours = yourVerdict(d);
          const team = d.verdicts.filter((v) => v.teammateId !== 'me').map((v) => v.teammateId);
          const originator = teammateById(d.originatorId);
          return (
            <button
              key={d.id}
              onClick={() => onOpenDeal(d.id)}
              className={cn(
                'grid w-full grid-cols-[minmax(0,2fr)_120px_minmax(0,1fr)_160px_120px_28px] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-secondary/30',
                i !== deals.length - 1 && 'border-b border-border',
              )}
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold tracking-tight">{d.company}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                  <span className="truncate">{d.thesis}</span>
                  {originator && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70">
                      <Avatar teammate={originator} size="xs" interactive={false} /> by {originator.name}
                    </span>
                  )}
                </div>
              </div>
              <div>{yours && <VerdictPill verdict={yours.verdict} />}</div>
              <div><AvatarStack ids={team} size="sm" max={4} /></div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent/80" style={{ width: `${d.consensus}%` }} />
                </div>
                <span className="font-mono tabular-nums">{d.consensus}%</span>
              </div>
              <div className="text-[12px] text-muted-foreground">{d.lastActivity}</div>
              <div className="text-muted-foreground">›</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
