import { useState } from 'react';
import { Mail, Sparkles, AlertTriangle, Activity } from 'lucide-react';
import BriefSection from './BriefSection';
import BriefDetailSheet from './BriefDetailSheet';
import { morningBrief, type BriefItem } from '@/mock/autonomous';

export default function MorningBriefCard() {
  const [open, setOpen] = useState<BriefItem | null>(null);
  const b = morningBrief;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <div>
          <div className="font-serif text-2xl tracking-tight">good morning</div>
          <div className="text-[13px] text-muted-foreground">
            shadow worked while you slept · {b.ranAt}
          </div>
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-accent">
          all queued for review
        </div>
      </div>

      <Section
        icon={<Mail className="h-3.5 w-3.5" />}
        label="inbound processed"
        summary={`${b.inbound.total} total · ${b.inbound.flagged.length} flagged · ${b.inbound.passDrafts} pass drafts · ${b.inbound.snoozed} snoozed`}
        items={b.inbound.flagged}
        onSelect={setOpen}
      />

      <Section
        icon={<Sparkles className="h-3.5 w-3.5" />}
        label="found for you"
        summary={`${b.found.length} new companies · matches your B2B infra thesis`}
        items={b.found}
        onSelect={setOpen}
      />

      <Section
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        label="portfolio alerts"
        summary={`${b.portfolio.length} signals worth your eyes`}
        items={b.portfolio}
        onSelect={setOpen}
      />

      <Section
        icon={<Activity className="h-3.5 w-3.5" />}
        label="market signals"
        summary={`${b.market.length} new developments in spaces you're watching`}
        items={b.market}
        onSelect={setOpen}
      />

      <BriefDetailSheet item={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Section({
  icon,
  label,
  summary,
  items,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  summary: string;
  items: BriefItem[];
  onSelect: (i: BriefItem) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <span>{icon}</span>
      </div>
      <BriefSection label={label} summary={summary} items={items} onSelect={onSelect} />
    </div>
  );
}
