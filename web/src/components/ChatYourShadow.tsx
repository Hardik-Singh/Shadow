import { useEffect, useRef, useState } from 'react';
import { conversation, Exchange } from '../mock/data';
import { useArtifacts } from '../lib/use-artifacts';
import { slugForArtifact } from '../lib/artifacts-api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2, FileText } from 'lucide-react';
import { askShadow, type ShadowCitation } from '../lib/chat-api';

const FALLBACK_ANSWER =
  "Based on your model: you'd weight technical-founder strength + post-revenue + B2B distribution heavily. Without those three, you typically pass within the first 10 minutes. Top question to ask first: who is the CTO and how long have they known each other?";

const DECK_REASONS = [
  'technical founder · cobra paper · prior infra startup',
  'dev-tools infra fits your typical pattern (pinecone, modal)',
  'post-revenue · short cycle to first design partner',
  'two people in your network already know arlan',
];

const DECK_DOC_CARDS = [
  { artifactId: 'n7',  label: 'ic memo' },
  { artifactId: 'n10', label: 'meeting prep doc' },
  { artifactId: 'n8',  label: 'pass / follow-up email' },
  { artifactId: 'n6',  label: 'source sheet refresh' },
];

type DocCard = { artifactId: string; label: string };

type LiveExchange = Exchange & {
  confidence?: 'low' | 'medium' | 'high';
  citations?: ShadowCitation[];
  docs?: DocCard[];
  isShadowOnly?: boolean;
};

type Mode = 'default' | 'deck' | 'linkedin';

type Props = {
  mode?: Mode;
  companyId?: string;
  seedArtifactIds?: string[];
};

function navigateToSlug(slug: string) {
  window.history.pushState({}, '', `/artifact/${slug}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function ChatYourShadow({ mode = 'default' }: Props) {
  const [value, setValue] = useState('');
  const [thread, setThread] = useState<LiveExchange[]>(mode === 'default' ? conversation : []);
  const [pending, setPending] = useState(false);
  const seededRef = useRef(false);
  const linkedinPrependedRef = useRef(false);
  const all = useArtifacts();

  // deck mode: seed initial shadow-only message on mount.
  useEffect(() => {
    if (mode !== 'deck' || seededRef.current) return;
    seededRef.current = true;
    const reasonsList = DECK_REASONS.map((r) => `• ${r}`).join('\n');
    setThread([
      {
        id: `deck-seed-${Date.now()}`,
        question: '',
        answer: `this seems like something you'd like.\n\n${reasonsList}\n\nwhat do you think?`,
        time: 'just now',
        isShadowOnly: true,
      },
    ]);
  }, [mode]);

  // linkedin mode: surface ONE message about related artifacts on mount.
  useEffect(() => {
    if (mode !== 'linkedin' || linkedinPrependedRef.current) return;
    linkedinPrependedRef.current = true;
    setThread([
      {
        id: `lkdn-seed-${Date.now()}`,
        question: '',
        answer: 'i found related artifacts on arlan — a slack thread and an email. added them to your artifacts list.',
        time: 'just now',
        isShadowOnly: true,
      },
    ]);
  }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q || pending) return;
    setValue('');

    if (mode === 'deck') {
      const positive = /agree|yeah|like|love|good|yes|bullish/i.test(q);
      setThread((t) => [
        {
          id: `q-${Date.now()}`,
          question: q,
          answer: positive
            ? "great. here are the four docs i'd want for this one — open any to edit."
            : "noted. tell me what's off and i'll re-frame.",
          time: 'just now',
          docs: positive ? DECK_DOC_CARDS : undefined,
        },
        ...t,
      ]);
      return;
    }

    if (mode === 'linkedin') {
      setThread((t) => [
        { id: `q-${Date.now()}`, question: q, answer: '', time: 'just now' },
        ...t,
      ]);
      return;
    }

    // default mode → real api
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

      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-soft focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1"
      >
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
            {x.question && !x.isShadowOnly && (
              <div className="flex items-start gap-3 text-[14px] text-foreground">
                <span className="mt-0.5 w-4 shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Q</span>
                <span>{x.question}</span>
              </div>
            )}
            {x.answer && (
              <div className={`flex items-start gap-3 text-[13.5px] leading-relaxed text-muted-foreground ${x.question && !x.isShadowOnly ? 'mt-2' : ''}`}>
                <span className="mt-0.5 w-4 shrink-0 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent">S</span>
                <span className="whitespace-pre-wrap">{x.answer}</span>
              </div>
            )}
            {x.docs && x.docs.length > 0 && (
              <div className="ml-7 mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {x.docs.map((d, i) => {
                  const target = all.find((a) => a.id === d.artifactId);
                  const slug = target ? slugForArtifact(target) : null;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 text-left text-[12.5px] hover:border-foreground/20 hover:bg-secondary/40"
                      onClick={() => slug && navigateToSlug(slug)}
                      disabled={!slug}
                    >
                      <FileText className="h-3.5 w-3.5 text-accent" />
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
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
