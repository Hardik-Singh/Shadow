import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Teammate, teammateById } from '../mock/data';
import { Avatar } from './Avatars';

type Ctx = {
  open: (teammateId: string) => void;
  close: () => void;
};

const PartnerChatCtx = createContext<Ctx>({ open: () => {}, close: () => {} });

export const usePartnerChat = () => useContext(PartnerChatCtx);

type Exchange = { q: string; a: string };

const FALLBACK = (t: Teammate, q: string): string => {
  const lower = q.toLowerCase();
  if (lower.includes('thesis') || lower.includes('like'))
    return `${t.name.split(' ')[0]}'s shadow leans toward what they've historically backed — ${t.role.toLowerCase()} pattern. Without a deal in context, the strongest pull is technical-founder + paying customers.`;
  if (lower.includes('pass') || lower.includes('skip'))
    return `Yes, ${t.name.split(' ')[0]} would probably pass — last 4 calls of this shape went the same way. They flag distribution risk first, not product.`;
  if (lower.includes('feedback') || lower.includes('think'))
    return `Honest read in ${t.name.split(' ')[0]}'s voice: "interesting but I'd want to see the design partner pipeline tightened before I lean in. Talk to them again in 6 weeks."`;
  return `Based on ${t.name}'s judgment model: this matches their pattern about 60% of the time. They\'d ask "who is the customer and what are they actually paying for" before anything else.`;
};

export function PartnerChatProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Exchange[]>([]);
  const [value, setValue] = useState('');

  const teammate = activeId ? teammateById(activeId) : null;

  useEffect(() => {
    if (!teammate || teammate.id === 'me') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setActiveId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [teammate]);

  const open = (id: string) => {
    if (id === 'me') return;
    setActiveId(id);
    setThread([]);
    setValue('');
  };
  const close = () => setActiveId(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teammate) return;
    const q = value.trim();
    if (!q) return;
    setThread((t) => [...t, { q, a: FALLBACK(teammate, q) }]);
    setValue('');
  };

  return (
    <PartnerChatCtx.Provider value={{ open, close }}>
      {children}
      {teammate && teammate.id !== 'me' && (
        <>
          <div className="drawer-scrim" onClick={close} />
          <aside className="drawer drawer-chat" role="dialog" aria-label={`Chat with ${teammate.name}'s shadow`}>
            <div className="drawer-head">
              <div className="partner-chat-head">
                <Avatar teammate={teammate} size="md" />
                <div>
                  <h2 className="drawer-company">{teammate.name}'s shadow</h2>
                  <div className="drawer-byline">{teammate.role} · ask anything in their voice</div>
                </div>
              </div>
              <button className="drawer-close" onClick={close} aria-label="close">×</button>
            </div>

            <div className="partner-chat-thread">
              {thread.length === 0 ? (
                <div className="partner-chat-empty">
                  Try: "what would you push back on here?" · "would you take this meeting?" · "honest feedback?"
                </div>
              ) : (
                thread.map((x, i) => (
                  <div className="exchange" key={i}>
                    <div className="q"><span className="q-label">Q</span><span>{x.q}</span></div>
                    <div className="a"><span className="a-label">{teammate.initials}</span><span>{x.a}</span></div>
                  </div>
                ))
              )}
            </div>

            <form className="ask-prompt partner-chat-prompt" onSubmit={submit}>
              <input
                className="ask-input"
                placeholder={`Ask ${teammate.name.split(' ')[0]}'s shadow…`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
              <button className="ask-submit" type="submit">Ask</button>
            </form>
          </aside>
        </>
      )}
    </PartnerChatCtx.Provider>
  );
}
