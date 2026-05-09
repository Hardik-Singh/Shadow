import { useMemo, useState } from 'react';
import {
  initialMemory,
  model,
  summarySegments,
  type MemoryEntry,
  type SummarySegment,
} from '../mock/data';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Pencil, Sparkles, Mic, Monitor, FileText } from 'lucide-react';

type Piece = { kind: 'text'; text: string } | { kind: 'segment'; segment: SummarySegment };

/** Split paragraph into highlightable pieces by matching each segment's quote once. */
function splitParagraph(paragraph: string, segments: SummarySegment[]): Piece[] {
  type Hit = { start: number; end: number; segment: SummarySegment };
  const hits: Hit[] = [];
  for (const seg of segments) {
    const idx = paragraph.indexOf(seg.quote);
    if (idx === -1) continue;
    hits.push({ start: idx, end: idx + seg.quote.length, segment: seg });
  }
  hits.sort((a, b) => a.start - b.start);
  const pieces: Piece[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.start < cursor) continue; // drop overlaps
    if (h.start > cursor) pieces.push({ kind: 'text', text: paragraph.slice(cursor, h.start) });
    pieces.push({ kind: 'segment', segment: h.segment });
    cursor = h.end;
  }
  if (cursor < paragraph.length) pieces.push({ kind: 'text', text: paragraph.slice(cursor) });
  return pieces;
}

const SOURCE_ICON: Record<MemoryEntry['source'], typeof Mic> = {
  voice: Mic,
  screen: Monitor,
  file: FileText,
};

const SOURCE_LABEL: Record<MemoryEntry['source'], string> = {
  voice: 'Voice',
  screen: 'Screen',
  file: 'File',
};

function MemoryRow({ memory }: { memory: MemoryEntry }) {
  const Icon = SOURCE_ICON[memory.source];
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background/60 p-3">
      <div className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <span>{SOURCE_LABEL[memory.source]}</span>
          <span className="text-border">•</span>
          <span className="font-normal normal-case tracking-normal">{memory.time}</span>
        </div>
        <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/90">{memory.text}</p>
      </div>
    </div>
  );
}

export default function MemorySummary() {
  const [paragraph, setParagraph] = useState(model.summaryParagraph);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(paragraph);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(summarySegments[0]?.id ?? null);
  const [tab, setTab] = useState<'highlights' | 'full' | 'edit'>('highlights');

  const memoryById = useMemo(() => {
    const map = new Map<string, MemoryEntry>();
    for (const m of initialMemory) map.set(m.id, m);
    return map;
  }, []);

  const pieces = useMemo(() => splitParagraph(paragraph, summarySegments), [paragraph]);
  const activeSegment = summarySegments.find((s) => s.id === activeSegmentId) ?? null;
  const activeMemories = activeSegment
    ? activeSegment.memoryIds.map((id) => memoryById.get(id)).filter((m): m is MemoryEntry => !!m)
    : [];

  const openEdit = () => {
    setDraft(paragraph);
    setActiveSegmentId(summarySegments[0]?.id ?? null);
    setTab('highlights');
    setEditOpen(true);
  };

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Your Shadow
          </div>
          <h2 className="mt-1 font-serif text-[22px] leading-tight tracking-tight text-foreground">
            How Shadow sees you
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={openEdit}>
          <Pencil className="h-3.5 w-3.5" /> Refine
        </Button>
      </div>

      <article className="rounded-2xl border border-border bg-card p-7 shadow-soft">
        <p className="font-serif text-[17.5px] leading-[1.7] tracking-[-0.005em] text-foreground/90">
          {paragraph}
        </p>
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Shadow reads your screen, voice, and files and rewrites this paragraph as it learns.
          <button
            onClick={openEdit}
            className="ml-auto text-xs font-medium text-foreground underline-offset-2 hover:underline"
          >
            See what's behind it →
          </button>
        </div>
      </article>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-[920px]">
          <SheetHeader>
            <SheetTitle>How Shadow sees you</SheetTitle>
            <SheetDescription>
              Each highlighted phrase is backed by signals Shadow has captured. Click one to see the
              memories that justify it.
            </SheetDescription>
          </SheetHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="self-start">
              <TabsTrigger value="highlights">Highlights</TabsTrigger>
              <TabsTrigger value="full">Full view</TabsTrigger>
              <TabsTrigger value="edit">Edit text</TabsTrigger>
            </TabsList>

            {/* HIGHLIGHTS — paragraph w/ clickable segments + side panel of memories */}
            <TabsContent value="highlights" className="mt-4 min-h-0 flex-1">
              <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <article className="min-h-0 overflow-y-auto rounded-xl border border-border bg-background/40 p-5">
                  <p className="font-serif text-[16px] leading-[1.75] tracking-[-0.005em] text-foreground/90">
                    {pieces.map((p, i) =>
                      p.kind === 'text' ? (
                        <span key={i}>{p.text}</span>
                      ) : (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveSegmentId(p.segment.id)}
                          className={cn(
                            'rounded-[4px] px-1 py-0.5 text-left transition-colors',
                            'underline decoration-dotted decoration-accent/50 underline-offset-4',
                            'hover:bg-accent/15',
                            activeSegmentId === p.segment.id
                              ? 'bg-accent/25 text-foreground decoration-transparent'
                              : 'text-foreground/85',
                          )}
                        >
                          {p.segment.quote}
                        </button>
                      ),
                    )}
                  </p>
                </article>

                <aside className="flex min-h-0 flex-col rounded-xl border border-border bg-card p-4">
                  {activeSegment ? (
                    <>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Why Shadow says this
                      </div>
                      <p className="mt-1.5 text-[14px] leading-snug text-foreground">
                        {activeSegment.claim}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Confidence</span>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-accent"
                            style={{ width: `${activeSegment.confidence}%` }}
                          />
                        </div>
                        <span className="tabular-nums">{activeSegment.confidence}</span>
                      </div>
                      <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Memories ({activeMemories.length})
                      </div>
                      <div className="mt-2 flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
                        {activeMemories.map((m) => (
                          <MemoryRow key={m.id} memory={m} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="m-auto text-sm text-muted-foreground">
                      Click a highlighted phrase to inspect it.
                    </div>
                  )}
                </aside>
              </div>
            </TabsContent>

            {/* FULL VIEW — every segment + its memories laid out */}
            <TabsContent value="full" className="mt-4 min-h-0 flex-1">
              <div className="h-full min-h-0 overflow-y-auto pr-1">
                <ul className="flex flex-col gap-4">
                  {summarySegments.map((seg) => {
                    const mems = seg.memoryIds
                      .map((id) => memoryById.get(id))
                      .filter((m): m is MemoryEntry => !!m);
                    return (
                      <li
                        key={seg.id}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-serif text-[15.5px] leading-snug text-foreground">
                            “{seg.quote}”
                          </p>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            {seg.confidence}% confidence
                          </span>
                        </div>
                        <p className="mt-1.5 text-[13px] text-muted-foreground">{seg.claim}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {mems.map((m) => (
                            <MemoryRow key={m.id} memory={m} />
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </TabsContent>

            {/* EDIT TEXT — freeform anchor edit, unchanged behavior */}
            <TabsContent value="edit" className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[280px] flex-1 font-serif text-[15px] leading-relaxed"
              />
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button
                  onClick={() => {
                    setParagraph(draft.trim() || paragraph);
                    setEditOpen(false);
                  }}
                >
                  Save changes
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </section>
  );
}
