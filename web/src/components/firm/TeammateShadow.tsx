import { useState } from 'react';
import {
  DealVerdict,
  teammateById,
  teammateChats,
  TeammateExchange,
} from '../../mock/data';
import { Avatar } from '../Avatars';
import VerdictPill from '../VerdictPill';

type Props = { dealId: string; v: DealVerdict };

export default function TeammateShadow({ dealId, v }: Props) {
  const t = teammateById(v.teammateId);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [thread, setThread] = useState<TeammateExchange[]>(
    teammateChats[dealId]?.[v.teammateId] ?? [],
  );
  if (!t) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    const baseline =
      teammateChats[dealId]?.[v.teammateId]?.[0]?.a ??
      `Based on ${t.name}'s judgment model — same conviction as before. ${v.signals.slice(0, 2).join(', ')} drive this read.`;
    setThread((th) => [...th, { q, a: baseline }]);
    setValue('');
  };

  const isMe = v.teammateId === 'me';

  return (
    <div className={`teammate ${isMe ? 'teammate-me' : ''}`}>
      <div className="teammate-head">
        <Avatar teammate={t} size="md" />
        <div className="teammate-meta">
          <div className="teammate-name">{isMe ? 'Your read' : t.name}</div>
          <div className="teammate-role">{t.role}</div>
        </div>
        <VerdictPill verdict={v.verdict} conviction={v.conviction} />
      </div>

      <ul className="teammate-signals">
        {v.signals.map((s) => <li key={s}>{s}</li>)}
      </ul>

      {!isMe && (
        <button className="teammate-chat-btn" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide chat' : `Chat with ${t.name.split(' ')[0]}'s shadow →`}
        </button>
      )}

      {open && (
        <div className="teammate-chat">
          <div className="teammate-thread">
            {thread.length === 0 && (
              <div className="teammate-empty">
                Ask {t.name.split(' ')[0]}'s shadow a question — it answers as they would.
              </div>
            )}
            {thread.map((x, i) => (
              <div className="exchange" key={i}>
                <div className="q"><span className="q-label">Q</span><span>{x.q}</span></div>
                <div className="a"><span className="a-label">{t.initials}</span><span>{x.a}</span></div>
              </div>
            ))}
          </div>
          <form className="ask-prompt teammate-prompt" onSubmit={submit}>
            <input
              className="ask-input"
              placeholder={`Ask ${t.name.split(' ')[0]}'s shadow…`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button className="ask-submit" type="submit">Ask</button>
          </form>
        </div>
      )}
    </div>
  );
}
