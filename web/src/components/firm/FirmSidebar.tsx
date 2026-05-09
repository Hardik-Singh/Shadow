import { Briefcase, Building2, Users, Calendar, StickyNote, FileStack, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { firmQueryAnswer } from '../../mock/data';

export type FirmSection = 'pipeline' | 'companies' | 'people' | 'meetings' | 'notes' | 'artifacts';

const ITEMS: { id: FirmSection; label: string; icon: React.ReactNode; sub?: string }[] = [
  { id: 'pipeline',  label: 'Pipeline',  icon: <Briefcase className="h-4 w-4" />, sub: '5 active' },
  { id: 'companies', label: 'Companies', icon: <Building2 className="h-4 w-4" />, sub: '6' },
  { id: 'people',    label: 'People',    icon: <Users     className="h-4 w-4" />, sub: '17' },
  { id: 'meetings',  label: 'Meetings',  icon: <Calendar  className="h-4 w-4" />, sub: '4 upcoming' },
  { id: 'notes',     label: 'Notes',     icon: <StickyNote className="h-4 w-4" /> },
  { id: 'artifacts', label: 'Artifacts', icon: <FileStack className="h-4 w-4" />, sub: '20' },
];

export default function FirmSidebar({
  section,
  onChange,
}: {
  section: FirmSection;
  onChange: (s: FirmSection) => void;
}) {
  const [q, setQ] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSubmitted(q.trim());
  };

  return (
    <aside className="sticky top-14 flex h-[calc(100vh-3.5rem)] w-[260px] shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Firm Brain
        </div>
        <form onSubmit={submit} className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-ring">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask the firm…"
            className="flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground"
          />
        </form>
        {submitted && (
          <div className="mt-3 rounded-md border border-border bg-secondary/50 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-accent">
              <Sparkles className="h-3 w-3" /> Firm answer
            </div>
            <div className="line-clamp-6 text-foreground/85">{firmQueryAnswer.body}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2.5">
        {ITEMS.map((it) => {
          const active = section === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onChange(it.id)}
              className={cn(
                'group mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
                active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <span className={cn('text-muted-foreground', active && 'text-accent')}>{it.icon}</span>
              <span className="flex-1 text-left font-medium">{it.label}</span>
              {it.sub && <span className="text-[11px] text-muted-foreground/70">{it.sub}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 text-[11px] text-muted-foreground">
        <div className="font-semibold text-foreground">12 yrs</div>
        of firm memory · 47 contributors
      </div>
    </aside>
  );
}
