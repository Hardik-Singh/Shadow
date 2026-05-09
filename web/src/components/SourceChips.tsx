import { SourceKind, sourceLabel } from '../mock/data';
import { Hash, AtSign, FileText, Calendar, History } from 'lucide-react';

const ICON: Record<SourceKind, React.ReactNode> = {
  slack: <Hash className="h-3 w-3" />,
  email: <AtSign className="h-3 w-3" />,
  notion: <FileText className="h-3 w-3" />,
  calendar: <Calendar className="h-3 w-3" />,
  prior: <History className="h-3 w-3" />,
};

export default function SourceChips({ sources }: { sources: SourceKind[] }) {
  if (!sources.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <span
          key={s}
          title={sourceLabel[s]}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground"
        >
          <span className="text-muted-foreground/70">{ICON[s]}</span>
          {sourceLabel[s]}
        </span>
      ))}
    </div>
  );
}
