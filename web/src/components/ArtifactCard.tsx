import { Artifact, teammateById } from '../mock/data';
import VerdictPill from './VerdictPill';

type Props = {
  artifact: Artifact;
  showAuthor?: boolean;
  onOpen?: (a: Artifact) => void;
};

export default function ArtifactCard({ artifact, showAuthor, onOpen }: Props) {
  const author = teammateById(artifact.authorId);

  return (
    <div className="card" onClick={() => onOpen?.(artifact)} role="button" tabIndex={0}>
      <div className="card-head">
        <VerdictPill verdict={artifact.verdict} />
        <span className="card-type">{artifact.type}</span>
      </div>

      <div className="card-company">{artifact.company}</div>
      <div className="card-verdict">{artifact.read}</div>

      <div className="card-foot">
        <span className="card-time">{artifact.time}</span>
        {showAuthor && author && <span className="card-author-name">{author.name}</span>}
      </div>
    </div>
  );
}
