import { model } from '../mock/data';
import { cn } from '@/lib/utils';

export default function SignalChips() {
  const chips = model.preferences;

  return (
    <section>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Strongest signals
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const strong = c.value >= 60;
          return (
            <span
              key={c.label}
              className={cn(
                'group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                strong
                  ? 'border-accent/30 bg-accent/[0.08] text-foreground'
                  : 'border-border bg-card text-muted-foreground',
              )}
              title={`${c.label} — ${c.value}% weight in your decisions`}
            >
              <span className="font-medium">{c.label}</span>
              <span
                className={cn(
                  'font-mono text-[11px] tabular-nums',
                  strong ? 'text-accent' : 'text-muted-foreground/70',
                )}
              >
                {c.value}
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
