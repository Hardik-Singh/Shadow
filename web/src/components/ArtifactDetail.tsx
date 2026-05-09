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

        {artifact.read && <div className="drawer-read">{artifact.read}</div>}

        {artifact.bodyKind === 'email' && artifact.email ? (
          <EmailThread email={artifact.email} />
        ) : artifact.bodyKind === 'slack' && artifact.slack ? (
          <SlackThread slack={artifact.slack} />
        ) : (
          <div className="drawer-body">{artifact.body}</div>
        )}

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

function EmailThread({ email }: { email: NonNullable<Artifact['email']> }) {
  return (
    <div className="email-thread">
      <div className="email-subject">{email.subject}</div>
      <div className="email-list">
        {email.messages.map((m, i) => (
          <div className="email-msg" key={i}>
            <div className="email-msg-head">
              <span className="email-from">{m.from}</span>
              <span className="email-time">{m.time}</span>
            </div>
            {m.to && <div className="email-to">to: {m.to}</div>}
            <div className="email-body">{m.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlackThread({ slack }: { slack: NonNullable<Artifact['slack']> }) {
  return (
    <div className="slack-thread">
      <div className="slack-channel">{slack.channel}</div>
      <div className="slack-list">
        {slack.messages.map((m, i) => (
          <div className="slack-msg" key={i}>
            <div
              className="slack-avatar"
              style={{
                background: `linear-gradient(135deg, hsl(${m.hue} 70% 60%), hsl(${(m.hue + 40) % 360} 60% 40%))`,
              }}
            >
              {m.initials}
            </div>
            <div className="slack-body">
              <div className="slack-head">
                <span className="slack-who">{m.who}</span>
                <span className="slack-time">{m.time}</span>
              </div>
              <div className="slack-text">{m.text}</div>
              {m.reactions && m.reactions.length > 0 && (
                <div className="slack-reactions">
                  {m.reactions.map((r, j) => <span className="slack-reaction" key={j}>{r}</span>)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
