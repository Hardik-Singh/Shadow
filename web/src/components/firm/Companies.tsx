import { companies, Company, deals, personById } from '../../mock/data';
import VerdictPill from '../VerdictPill';
import { cn } from '@/lib/utils';

const STAGE_LABEL: Record<Company['stage'], string> = {
  sourcing: 'Sourcing',
  'first-meeting': 'First meeting',
  diligence: 'Diligence',
  'term-sheet': 'Term sheet',
  invested: 'Invested',
  passed: 'Passed',
};

const STAGE_TONE: Record<Company['stage'], string> = {
  sourcing: 'bg-secondary text-secondary-foreground',
  'first-meeting': 'bg-secondary text-secondary-foreground',
  diligence: 'bg-amber-50 text-amber-800',
  'term-sheet': 'bg-emerald-50 text-emerald-700',
  invested: 'bg-emerald-100 text-emerald-800',
  passed: 'bg-rose-50 text-rose-700',
};

export default function Companies({ onOpenDeal }: { onOpenDeal: (id: string) => void }) {
  return (
    <section>
      <header className="mb-5">
        <h1 className="font-serif text-[26px] tracking-tight">Companies</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {companies.length} companies in the firm's universe
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="grid grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1fr)_140px_120px] gap-4 border-b border-border bg-secondary/40 px-5 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <div>Company</div>
          <div>Stage</div>
          <div>Founders</div>
          <div>HQ · headcount</div>
          <div>Last touch</div>
        </div>
        {companies.map((c, i) => {
          const deal = deals.find((d) => d.id === c.dealId);
          const yourVerdict = deal?.verdicts.find((v) => v.teammateId === 'me');
          return (
            <button
              key={c.id}
              onClick={() => c.dealId && onOpenDeal(c.dealId)}
              className={cn(
                'grid w-full grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1fr)_140px_120px] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-secondary/30',
                i !== companies.length - 1 && 'border-b border-border',
                !c.dealId && 'cursor-default',
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                  {c.name}
                  {yourVerdict && <VerdictPill verdict={yourVerdict.verdict} />}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-muted-foreground">{c.sector}</div>
              </div>
              <div>
                <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-medium', STAGE_TONE[c.stage])}>
                  {STAGE_LABEL[c.stage]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FounderAvatars founderIds={c.founderIds} />
                <span className="truncate text-[12.5px] text-muted-foreground">
                  {c.founderIds.map((id) => personById(id)?.name.split(' ')[0]).filter(Boolean).join(' · ')}
                </span>
              </div>
              <div className="text-[12.5px] text-muted-foreground">
                {c.hq ?? '—'} {typeof c.headcount === 'number' && <span className="text-muted-foreground/70">· {c.headcount}</span>}
              </div>
              <div className="text-[12px] text-muted-foreground">{c.lastTouch}</div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FounderAvatars({ founderIds }: { founderIds: string[] }) {
  return (
    <div className="flex items-center -space-x-1.5">
      {founderIds.slice(0, 3).map((id) => {
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
    </div>
  );
}
