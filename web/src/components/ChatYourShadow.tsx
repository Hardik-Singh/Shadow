import { useState } from 'react';
import { conversation, Exchange } from '../mock/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';
import { askShadow, type ShadowCitation } from '../lib/chat-api';

const FALLBACK_ANSWER =
  "Based on your model: you'd weight technical-founder strength + post-revenue + B2B distribution heavily. Without those three, you typically pass within the first 10 minutes. Top question to ask first: who is the CTO and how long have they known each other?";

type LiveExchange = Exchange & {
  confidence?: 'low' | 'medium' | 'high';
  citations?: ShadowCitation[];
};

export default function ChatYourShadow() {
  const [value, setValue] = useState('');
  const [thread, setThread] = useState<LiveExchange[]>(conversation);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || pending) return;
    setValue('');
    setPending(true);
    const reply = await askShadow({ partnerId: 'me', question: q });
    setPending(false);
    setThread((t) => [
      {
        id: `q-${Date.now()}`,
        question: q,
        answer: reply?.answer ?? FALLBACK_ANSWER,
        time: 'just now',
        confidence: reply?.confidence,
        citations: reply?.citations,
      },
      ...t,
    ]);
  };

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Ask your Shadow
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your judgment, on demand — every answer is grounded in your memory.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-soft focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
        <Input
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          placeholder="What do I actually think about consumer deals?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
        />
        <Button type="submit" size="sm" variant="default" disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <>Ask <ArrowUp className="h-3.5 w-3.5" /></>}
        </Button>
      </form>

      <div className="mt-5 divide-y divide-border">
        {thread.map((x) => (
          <div key={x.id} className="py-4 first:pt-2">
            <div className="flex items-start gap-3 text-[14px] text-foreground">
              <span className="mt-0.5 w-4 shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Q</span>
              <span>{x.question}</span>
            </div>
            <div className="mt-2 flex items-start gap-3 text-[13.5px] leading-relaxed text-muted-foreground">
              <span className="mt-0.5 w-4 shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent">S</span>
              <span>{x.answer}</span>
            </div>
            {x.citations && x.citations.length > 0 && (
              <ul className="ml-7 mt-2 space-y-1">
                {x.citations.map((c, i) => (
                  <li key={i} className="text-[11.5px] leading-snug text-muted-foreground/85">
                    <span className="mr-1 font-mono text-[10px] text-muted-foreground/60">[{i + 1}]</span>
                    <span>{c.snippet}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="ml-7 mt-1.5 text-[11px] text-muted-foreground/70">
              {x.time}
              {x.confidence ? <> · confidence: {x.confidence}</> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
