import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { askShadow, type ShadowChatReply } from '../../lib/chat-api';
import { Button } from '@/components/ui/button';

const SUGGESTIONS = [
  'has anyone at this firm seen a deal like this before',
  'what does our firm think about B2B infra right now',
  'who has the best track record on enterprise SaaS deals',
  'what did we miss the last time we passed on something like this',
];

export default function FirmQuery() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<ShadowChatReply | null>(null);

  async function ask(question: string) {
    if (!question.trim()) return;
    setLoading(true);
    setReply(null);
    const out = await askShadow({ partnerId: 'firm', question, scope: 'firm' });
    setReply(out);
    setLoading(false);
  }

  return (
    <section className="mb-8 rounded-xl border border-border bg-card/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        firm brain · ask anything
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="flex items-center gap-2"
      >
        <div className="flex-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ask the firm's collective memory…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <Button type="submit" disabled={loading || !q.trim()}>
          {loading ? 'thinking…' : 'ask'}
        </Button>
      </form>

      {!reply && !loading && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQ(s);
                ask(s);
              }}
              className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground hover:border-accent/50 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {reply && (
        <div className="mt-4 rounded-lg border border-border bg-background p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
            {reply.partnerName} · confidence: {reply.confidence}
          </div>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {reply.answer}
          </p>
          {reply.citations.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                pulled from
              </div>
              {reply.citations.map((c, i) => (
                <div
                  key={i}
                  className="rounded border border-border/60 bg-card/40 px-2 py-1 text-[11px] text-muted-foreground"
                >
                  {c.snippet}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
