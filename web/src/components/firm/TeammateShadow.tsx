import { useState } from 'react';
import {
  DealVerdict,
  teammateById,
  teammateChats,
  TeammateExchange,
  deals,
} from '../../mock/data';
import { Avatar } from '../Avatars';
import VerdictPill from '../VerdictPill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { askShadow, type ShadowCitation } from '../../lib/chat-api';

type Props = { dealId: string; v: DealVerdict };

type LiveExchange = TeammateExchange & {
  citations?: ShadowCitation[];
  confidence?: 'low' | 'medium' | 'high';
};

export default function TeammateShadow({ dealId, v }: Props) {
  const t = teammateById(v.teammateId);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [pending, setPending] = useState(false);
  const [thread, setThread] = useState<LiveExchange[]>(
    teammateChats[dealId]?.[v.teammateId] ?? [],
  );
  if (!t) return null;
  const isMe = v.teammateId === 'me';
  const deal = deals.find((d) => d.id === dealId);
  const dealHint = deal ? `${deal.company} — ${deal.thesis}` : undefined;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || pending) return;
    setValue('');
    setPending(true);
    const reply = await askShadow({ partnerId: v.teammateId, question: q, dealHint });
    setPending(false);
    const fallback =
      teammateChats[dealId]?.[v.teammateId]?.[0]?.a ??
      `Based on ${t.name}'s judgment model — same conviction as before. ${v.signals.slice(0, 2).join(', ')} drive this read.`;
    setThread((th) => [
      ...th,
      {
        q,
        a: reply?.answer ?? fallback,
        citations: reply?.citations,
        confidence: reply?.confidence,
      },
    ]);
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4',
        isMe ? 'border-accent/30 bg-accent/[0.04]' : 'border-border',
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar teammate={t} size="md" interactive={!isMe} />
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold">{isMe ? 'Your read' : t.name}</div>
          <div className="text-[11.5px] text-muted-foreground">{t.role}</div>
        </div>
        <VerdictPill verdict={v.verdict} conviction={v.conviction} />
      </div>

      <ul className="mt-3 space-y-1 pl-1 text-[12.5px] text-muted-foreground">
        {v.signals.map((s) => (
          <li key={s} className="relative pl-3 before:absolute before:left-0 before:text-muted-foreground/50 before:content-['·']">
            {s}
          </li>
        ))}
      </ul>

      {!isMe && (
        <Button
          variant="link"
          size="xs"
          onClick={() => setOpen((o) => !o)}
          className="mt-2 px-0"
        >
          {open ? 'Hide chat' : `Chat with ${t.name.split(' ')[0]}'s shadow →`}
        </Button>
      )}

      {open && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex flex-col gap-3">
            {thread.length === 0 && (
              <div className="text-[12.5px] italic text-muted-foreground">
                Ask {t.name.split(' ')[0]}'s shadow a question — it answers as they would.
              </div>
            )}
            {thread.map((x, i) => (
              <div key={i}>
                <div className="flex items-start gap-2 text-[13px]">
                  <span className="mt-0.5 w-4 shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Q</span>
                  <span>{x.q}</span>
                </div>
                <div className="mt-1 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 w-4 shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">{t.initials}</span>
                  <span>{x.a}</span>
                </div>
                {x.citations && x.citations.length > 0 && (
                  <ul className="ml-6 mt-1 space-y-0.5">
                    {x.citations.map((c, j) => (
                      <li key={j} className="text-[11px] leading-snug text-muted-foreground/80">
                        <span className="mr-1 font-mono text-[10px] text-muted-foreground/60">[{j + 1}]</span>
                        <span>{c.snippet}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {x.confidence && (
                  <div className="ml-6 mt-1 text-[10.5px] text-muted-foreground/70">confidence: {x.confidence}</div>
                )}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 text-[12.5px] italic text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> {t.name.split(' ')[0]}'s shadow is thinking…
              </div>
            )}
          </div>
          <form onSubmit={submit} className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-background p-1 focus-within:ring-2 focus-within:ring-ring">
            <Input
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder={`Ask ${t.name.split(' ')[0]}'s shadow…`}
              disabled={pending}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button type="submit" size="xs" disabled={pending}>{pending ? '…' : 'Ask'}</Button>
          </form>
        </div>
      )}
    </div>
  );
}
