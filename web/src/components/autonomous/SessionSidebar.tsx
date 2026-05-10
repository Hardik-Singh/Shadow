import { Plus, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Session } from '@/mock/autonomous';

type Props = {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewHandoff: () => void;
  newDisabled?: boolean;
};

export default function SessionSidebar({ sessions, activeId, onSelect, onNewHandoff, newDisabled }: Props) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card/40">
      <div className="border-b border-border p-3">
        <button
          onClick={onNewHandoff}
          disabled={newDisabled}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-md',
            'bg-accent px-3 py-2 text-[13px] font-semibold text-accent-foreground shadow-soft',
            'transition-transform hover:scale-[1.01] active:scale-[0.99]',
            'disabled:opacity-60 disabled:hover:scale-100',
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          new handoff
        </button>
      </div>

      <div className="border-b border-border px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        sessions
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="px-3 py-6 text-[12.5px] text-muted-foreground">
            shadow hasn't run autonomously yet — hand off to start.
          </div>
        ) : (
          <ul className="p-1.5">
            {sessions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  className={cn(
                    'group flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left',
                    'transition-colors hover:bg-secondary',
                    activeId === s.id && 'bg-secondary shadow-soft',
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <StatusDot status={s.status} />
                    <div className="flex-1 truncate text-[13px] font-medium text-foreground">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">{s.startedAtLabel}</div>
                  </div>
                  <div className="pl-4 text-[11.5px] text-muted-foreground line-clamp-1">
                    {s.subtitle}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function StatusDot({ status }: { status: Session['status'] }) {
  if (status === 'running') {
    return <Loader2 className="h-3 w-3 shrink-0 animate-spin text-accent" />;
  }
  if (status === 'complete') {
    return (
      <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-foreground/15">
        <Check className="h-2 w-2 text-foreground/70" />
      </span>
    );
  }
  return <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />;
}
