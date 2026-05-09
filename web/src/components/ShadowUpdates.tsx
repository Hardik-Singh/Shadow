import { useState } from 'react';
import { shadowUpdates as INITIAL, ShadowUpdate } from '../mock/data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, ChevronRight, Wand2, Activity, Target, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export default function ShadowUpdates() {
  const [updates, setUpdates] = useState<ShadowUpdate[]>(INITIAL);
  const [expanded, setExpanded] = useState<string | null>(null);

  const applied = updates.filter((u) => u.kind === 'applied');
  const suggestions = updates
    .filter((u) => u.kind === 'suggestion')
    .sort((a, b) => (PRIORITY_RANK[a.priority ?? 'low'] - PRIORITY_RANK[b.priority ?? 'low']) || ((b.confidence ?? 0) - (a.confidence ?? 0)));

  const accept = (id: string) =>
    setUpdates((all) =>
      all.map((u) =>
        u.id === id
          ? { ...u, kind: 'applied', summary: u.summary.replace(/\?$/, ''), createdAt: 'just now' }
          : u,
      ),
    );

  const dismiss = (id: string) => setUpdates((all) => all.filter((u) => u.id !== id));

  return (
    <aside className="flex flex-col gap-5">
      <header>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-accent" />
          Shadow is updating
        </div>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          What Shadow has changed about its read of you, and what it wants to change next.
        </p>
      </header>

      {/* Suggestions */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/70">
            Suggestions
          </div>
          <span className="rounded-full bg-accent/[0.08] px-2 py-0.5 text-[10.5px] font-medium text-accent">
            {suggestions.length} ranked
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {suggestions.length === 0 && (
            <Card className="p-4 text-[13px] text-muted-foreground">
              No new suggestions. Shadow is watching.
            </Card>
          )}
          {suggestions.map((u) => (
            <SuggestionCard
              key={u.id}
              update={u}
              expanded={expanded === u.id}
              onToggle={() => setExpanded((x) => (x === u.id ? null : u.id))}
              onAccept={() => accept(u.id)}
              onDismiss={() => dismiss(u.id)}
            />
          ))}
        </div>
      </section>

      {/* Applied */}
      <section>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/70">
          Recent updates
        </div>
        <div className="flex flex-col gap-2">
          {applied.map((u) => (
            <AppliedRow
              key={u.id}
              update={u}
              expanded={expanded === u.id}
              onToggle={() => setExpanded((x) => (x === u.id ? null : u.id))}
            />
          ))}
        </div>
      </section>
    </aside>
  );
}

function SuggestionCard({
  update,
  expanded,
  onToggle,
  onAccept,
  onDismiss,
}: {
  update: ShadowUpdate;
  expanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const priority = update.priority ?? 'low';
  return (
    <Card className="overflow-hidden border-accent/30 bg-accent/[0.04]">
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-3.5 text-left">
        <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className={cn(
              'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
              priority === 'high' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
              priority === 'medium' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
              priority === 'low' && 'bg-secondary text-muted-foreground',
            )}>
              {priority}
            </span>
            {typeof update.confidence === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                <Gauge className="h-3 w-3" /> {update.confidence}%
              </span>
            )}
            {update.dealId && (
              <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                {update.dealId}
              </span>
            )}
          </div>
          <div className="text-[13.5px] font-medium leading-snug text-foreground">
            {update.summary}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
            <span>{update.createdAt}</span>
            {update.actionLabel && (
              <span className="inline-flex items-center gap-1 text-accent">
                <Target className="h-3 w-3" /> {update.actionLabel}
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          className={cn(
            'mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>
      {expanded && (
        <div className="border-t border-accent/20 bg-card/60 px-4 py-3">
          <p className="text-[13px] leading-relaxed text-foreground/80">{update.rationale}</p>
          {update.impact && (
            <div className="mt-2.5 rounded-md border border-border bg-background/70 px-2.5 py-2 text-[12.5px] leading-snug text-muted-foreground">
              <span className="font-medium text-foreground">Impact: </span>{update.impact}
            </div>
          )}
          {update.evidence && update.evidence.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {update.evidence.map((e) => (
                <span key={e} className="rounded-md bg-secondary px-2 py-1 text-[11.5px] leading-none text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
          )}
          {update.diff && (
            <div className="mt-2.5 inline-flex items-center gap-2 rounded-md bg-secondary px-2 py-1 font-mono text-[11.5px]">
              <span className="text-muted-foreground line-through">{update.diff.before}</span>
              <span>-&gt;</span>
              <span className="text-accent">{update.diff.after}</span>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 border-t border-accent/20 bg-card/60 px-3.5 py-2.5">
        <Button size="xs" variant="default" onClick={onAccept}>
          <Check className="h-3 w-3" /> Apply
        </Button>
        <Button size="xs" variant="outline" onClick={onToggle}>
          {expanded ? 'Hide' : 'Why?'}
        </Button>
        <Button size="xs" variant="ghost" onClick={onDismiss} className="ml-auto text-muted-foreground">
          <X className="h-3 w-3" /> Dismiss
        </Button>
      </div>
    </Card>
  );
}

function AppliedRow({
  update,
  expanded,
  onToggle,
}: {
  update: ShadowUpdate;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-3 text-left">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] leading-snug text-foreground">{update.summary}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{update.createdAt}</div>
        </div>
        <ChevronRight
          className={cn(
            'mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>
      {expanded && (
        <div className="border-t border-border px-3.5 py-2.5">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">{update.rationale}</p>
          {update.diff && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px]">
              <span className="text-muted-foreground line-through">{update.diff.before}</span>
              <span>-&gt;</span>
              <span className="text-foreground">{update.diff.after}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
