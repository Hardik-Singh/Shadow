import { useEffect, useRef, useState } from 'react';
import { newOptionsByMode, View } from '../mock/data';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './Logo';

type Props = {
  view: View;
  onViewChange: (v: View) => void;
  onNew: (kind: string) => void;
};

const NEW_OPTIONS = newOptionsByMode.VC;

export default function Header({ view, onViewChange, onNew }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-4 px-6">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Shadow</span>
        </div>

        <nav className="ml-2 flex items-center gap-0.5 rounded-lg bg-secondary p-0.5" role="tablist" aria-label="view">
          {(['mine', 'firm'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              className={cn(
                'rounded-md px-3 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground',
                view === v && 'bg-card text-foreground shadow-soft',
              )}
              onClick={() => onViewChange(v)}
            >
              {v === 'mine' ? 'My Shadow' : 'Firm Brain'}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        <div ref={ref} className="relative">
          <Button variant="default" size="sm" onClick={() => setOpen((o) => !o)}>
            <Plus className="h-3.5 w-3.5" /> New
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
          {open && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-40 min-w-[200px] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-pop">
              {NEW_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onNew(opt); setOpen(false); }}
                  className="block w-full rounded-md px-3 py-1.5 text-left text-[13px] text-foreground hover:bg-secondary"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
