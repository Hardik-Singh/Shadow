import { Artifact, teammateById } from '../mock/data';
import VerdictPill from './VerdictPill';

type Props = {
  artifact: Artifact;
  showAuthor?: boolean;
  onOpen?: (a: Artifact) => void;
};

const TYPE_ICON: Record<string, string> = {
  'IC Memo': '📝',
  'Sourcing Sheet': '📊',
  'Founder Background': '🔎',
  'Comp Table': '📐',
  'Deal Card': '🃏',
  'Email Thread': '✉',
  'Slack Thread': '#',
};

export default function ArtifactCard({ artifact, showAuthor, onOpen }: Props) {
  const author = teammateById(artifact.authorId);
  const status = artifact.status ?? 'final';
  const generating = status === 'generating';

  return (
    <div
      className={`card card-status-${status} ${generating ? 'card-generating' : ''}`}
      onClick={() => !generating && onOpen?.(artifact)}
      role="button"
      tabIndex={generating ? -1 : 0}
      aria-busy={generating}
    >
      <div className="card-head">
        {!generating && <VerdictPill verdict={artifact.verdict} />}
        <span className="card-type">
          <span className="card-type-icon">{TYPE_ICON[artifact.type] ?? '◇'}</span>
          {artifact.type}
        </span>
        {status === 'generating' && <span className="status-tag tag-generating">generating</span>}
        {status === 'related'    && <span className="status-tag tag-related">related</span>}
      </div>

      <div className="card-company">{artifact.company || (generating ? 'Working…' : '')}</div>
      <div className="card-verdict">
        {generating ? <span className="shimmer-line" aria-hidden /> : artifact.read}
      </div>

      <div className="card-foot">
        <span className="card-time">{artifact.time}</span>
        {showAuthor && author && <span className="card-author-name">{author.name}</span>}
      </div>
    </div>
  );
}
