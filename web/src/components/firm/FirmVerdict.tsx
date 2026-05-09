import { useState } from 'react';
import { Deal } from '../../mock/data';
import VerdictPill from '../VerdictPill';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus, Minus, Clock } from 'lucide-react';

export default function FirmVerdict({ deal }: { deal: Deal }) {
  const [generated, setGenerated] = useState(false);

  if (!deal.firmVerdict) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-5 text-[13px] text-muted-foreground">
        Firm verdict not yet synthesized for this deal.
      </div>
    );
  }

  const v = deal.firmVerdict;

  if (!generated) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-border bg-secondary/30 p-5">
        <div>
          <div className="text-[13px] font-semibold">Firm verdict</div>
          <div className="text-[12px] text-muted-foreground">
            synthesize across {deal.verdicts.length} shadows + firm memory
          </div>
        </div>
        <Button onClick={() => setGenerated(true)}>
          <Sparkles className="h-3.5 w-3.5" /> Generate firm verdict
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-semibold">Firm verdict</div>
          <div className="text-[12px] text-muted-foreground">synthesized · {deal.consensus}% consensus</div>
        </div>
        <VerdictPill verdict={v.call} />
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/90">{v.consensus}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SignalList label="Strongest for" items={v.forSignals} kind="for" />
        <SignalList label="Strongest against" items={v.againstSignals} kind="against" />
      </div>

      {v.historicalMatch && (
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-secondary/50 p-3.5 text-[13px]">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Historical match
            </div>
            <div className="mt-1 text-foreground/90">
              <strong className="font-semibold">{v.historicalMatch.company}</strong> ({v.historicalMatch.year}) — {v.historicalMatch.outcome}
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 rounded-lg border border-border bg-secondary/30 p-3.5 text-[13px] leading-relaxed text-foreground/90">
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Recommended next action
        </div>
        {v.recommendation}
      </div>
    </div>
  );
}

function SignalList({ label, items, kind }: { label: string; items: string[]; kind: 'for' | 'against' }) {
  const Icon = kind === 'for' ? Plus : Minus;
  const color = kind === 'for' ? 'text-emerald-600' : 'text-rose-600';
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <ul className="space-y-1.5 text-[13px] text-foreground/85">
        {items.map((s) => (
          <li key={s} className="flex items-start gap-1.5">
            <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${color}`} />
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
