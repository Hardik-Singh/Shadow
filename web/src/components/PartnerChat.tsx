import { createContext, useContext, useState, ReactNode } from 'react';
import { Teammate, teammateById } from '../mock/data';
import { Avatar } from './Avatars';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';
import { askShadow, ShadowCitation } from '@/lib/chat-api';

type Ctx = {
  open: (teammateId: string) => void;
  close: () => void;
};

const PartnerChatCtx = createContext<Ctx>({ open: () => {}, close: () => {} });
export const usePartnerChat = () => useContext(PartnerChatCtx);

type Exchange = {
  q: string;
  a: string;
  confidence?: 'low' | 'medium' | 'high';
  citations?: ShadowCitation[];
};

const FALLBACK = (t: Teammate, q: string): string => {
  const lower = q.toLowerCase();
  if (lower.includes('thesis') || lower.includes('like'))
    return `${t.name.split(' ')[0]}'s shadow leans toward what they've historically backed — ${t.role.toLowerCase()} pattern. Without a deal in context, the strongest pull is technical-founder + paying customers.`;
  if (lower.includes('pass') || lower.includes('skip'))
    return `Yes, ${t.name.split(' ')[0]} would probably pass — last 4 calls of this shape went the same way. They flag distribution risk first, not product.`;
  if (lower.includes('feedback') || lower.includes('think'))
    return `Honest read in ${t.name.split(' ')[0]}'s voice: "interesting but I'd want to see the design partner pipeline tightened before I lean in. Talk to them again in 6 weeks."`;
  return `Based on ${t.name}'s judgment model: this matches their pattern about 60% of the time. They'd ask "who is the customer and what are they actually paying for" before anything else.`;
};

export function PartnerChatProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<Exchange[]>([]);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);

  const teammate = activeId ? teammateById(activeId) : null;

  const open = (id: string) => {
    if (id === 'me') return;
    setActiveId(id);
    setThread([]);
    setValue('');
    setPending(false);
  };
  const close = () => setActiveId(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teammate) return;
    const q = value.trim();
    if (!q || pending) return;
    setValue('');
    setPending(true);
    const reply = await askShadow({ partnerId: teammate.id, question: q });
    setPending(false);
    setThread((t) => [
      ...t,
      {
        q,
        a: reply?.answer ?? FALLBACK(teammate, q),
        confidence: reply?.confidence,
        citations: reply?.citations,
      },
    ]);
  };

  return (
    <PartnerChatCtx.Provider value={{ open, close }}>
      {children}
      <Sheet open={!!teammate && teammate.id !== 'me'} onOpenChange={(o) => !o && close()}>
        <SheetContent className="flex flex-col gap-4">
          {teammate && (
            <>
              <div className="flex items-center gap-3">
                <Avatar teammate={teammate} size="lg" interactive={false} />
                <div>
                  <div className="font-serif text-[20px] font-semibold tracking-tight">
                    {teammate.name}'s shadow
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    {teammate.role} · ask anything in their voice
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
                {thread.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-3 text-[12.5px] italic text-muted-foreground">
                    Try: "what would you push back on here?" · "would you take this meeting?" · "honest feedback?"
                  </div>
                ) : (
                  thread.map((x, i) => (
                    <div key={i} className="border-b border-border pb-3 last:border-b-0">
                      <div className="flex items-start gap-2 text-[13.5px]">
                        <span className="mt-0.5 w-4 shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Q</span>
                        <span>{x.q}</span>
                      </div>
                      <div className="mt-1.5 flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
                        <span className="mt-0.5 w-4 shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent">{teammate.initials}</span>
                        <span>{x.a}</span>
                      </div>
                      {x.citations && x.citations.length > 0 && (
                        <ul className="ml-6 mt-2 space-y-1">
                          {x.citations.map((c, j) => (
                            <li key={j} className="text-[11.5px] leading-snug text-muted-foreground/85">
                              <span className="mr-1 font-mono text-[10px] text-muted-foreground/60">[{j + 1}]</span>
                              <span>{c.snippet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {x.confidence && (
                        <div className="ml-6 mt-1.5 text-[11px] text-muted-foreground/70">
                          confidence: {x.confidence}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 focus-within:ring-2 focus-within:ring-ring">
                <Input
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={`Ask ${teammate.name.split(' ')[0]}'s shadow…`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={pending}
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Ask <ArrowUp className="h-3.5 w-3.5" /></>}
                </Button>
              </form>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PartnerChatCtx.Provider>
  );
}
