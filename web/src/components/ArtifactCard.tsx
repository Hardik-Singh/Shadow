import { Artifact, teammateById } from '../mock/data';
import VerdictPill from './VerdictPill';
import { cn } from '@/lib/utils';
import { FileText, BarChart3, UserSearch, Table, Layers, Mail, Hash } from 'lucide-react';

type Props = {
  artifact: Artifact;
  showAuthor?: boolean;
  onOpen?: (a: Artifact) => void;
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  'IC Memo': <FileText className="h-3.5 w-3.5" />,
  'Sourcing Sheet': <BarChart3 className="h-3.5 w-3.5" />,
  'Founder Background': <UserSearch className="h-3.5 w-3.5" />,
  'Comp Table': <Table className="h-3.5 w-3.5" />,
  'Deal Card': <Layers className="h-3.5 w-3.5" />,
  'Email Thread': <Mail className="h-3.5 w-3.5" />,
  'Slack Thread': <Hash className="h-3.5 w-3.5" />,
};

export default function ArtifactCard({ artifact, showAuthor, onOpen }: Props) {
  const author = teammateById(artifact.authorId);
  const status = artifact.status ?? 'final';
  const generating = status === 'generating';

  return (
    <div
      className={cn(
        'group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:border-foreground/20 hover:bg-secondary/40',
        generating && 'pointer-events-none border-dashed',
      )}
      onClick={() => !generating && onOpen?.(artifact)}
      role="button"
      tabIndex={generating ? -1 : 0}
      aria-busy={generating}
    >
      <div className="flex flex-wrap items-center gap-2">
        {!generating && <VerdictPill verdict={artifact.verdict} />}
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
          {TYPE_ICON[artifact.type] ?? <FileText className="h-3.5 w-3.5" />}
          {artifact.type}
        </span>
        {generating && (
          <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
            generating
          </span>
        )}
      </div>

      <div className={cn('text-[15px] font-semibold tracking-tight text-foreground', generating && 'text-muted-foreground')}>
        {artifact.company || 'Working…'}
      </div>
      <div className="text-[13px] leading-snug text-muted-foreground">
        {generating ? <span className="inline-block h-3 w-2/3 animate-shimmer rounded bg-gradient-to-r from-secondary via-muted to-secondary bg-[length:200%_100%]" /> : artifact.read}
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-border pt-2.5 text-[11.5px] text-muted-foreground">
        <span>{artifact.time}</span>
        {showAuthor && author && <span>{author.name}</span>}
      </div>
    </div>
  );
}
