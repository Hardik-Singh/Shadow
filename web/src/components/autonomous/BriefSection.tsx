import { ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import type { BriefItem } from '@/mock/autonomous';

type Props = {
  label: string;
  summary: string;
  items: BriefItem[];
  onSelect: (item: BriefItem) => void;
};

export default function BriefSection({ label, summary, items, onSelect }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-baseline justify-between gap-4 space-y-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="text-[12.5px] text-foreground/80">{summary}</div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id}>
              <button
                onClick={() => onSelect(it)}
                className="group flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-secondary/60"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium leading-snug text-foreground">
                    {it.title}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">{it.meta}</div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function SourceTag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
      {name}
    </span>
  );
}
