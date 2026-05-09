import { useEffect } from 'react';
import { Artifact, teammateById } from '../mock/data';
import VerdictPill from './VerdictPill';

type Props = {
  artifact: Artifact | null;
  onClose: () => void;
  onOpenInFirm?: (a: Artifact) => void;
};

export default function ArtifactDetail({ artifact, onClose, onOpenInFirm }: Props) {
  useEffect(() => {
    if (!artifact) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [artifact, onClose]);

  if (!artifact) return null;
  const author = teammateById(artifact.authorId);

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`${artifact.company} ${artifact.type}`}>
        <div className="drawer-head">
          <div>
            <div className="drawer-eyebrow">
              <VerdictPill verdict={artifact.verdict} />
              <span className="drawer-type">{artifact.type}</span>
            </div>
            <h2 className="drawer-company">{artifact.company}</h2>
            <div className="drawer-byline">
              {author?.name} · {artifact.time}
            </div>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="close">×</button>
        </div>

        <div className="drawer-body">{artifact.body}</div>

        <div className="drawer-actions">
          <button className="btn-ghost">Edit</button>
          <button className="btn-ghost">Regenerate</button>
          {onOpenInFirm && (
            <button className="btn-primary" onClick={() => onOpenInFirm(artifact)}>
              Open in Firm Brain →
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
