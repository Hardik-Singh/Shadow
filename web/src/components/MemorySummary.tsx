import { useState } from 'react';
import { model } from '../mock/data';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Sparkles } from 'lucide-react';

export default function MemorySummary() {
  const [paragraph, setParagraph] = useState(model.summaryParagraph);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(paragraph);

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
        <Button variant="outline" size="sm" onClick={() => { setDraft(paragraph); setEditOpen(true); }}>
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
        </div>
      </article>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="flex flex-col gap-5">
          <SheetHeader>
            <SheetTitle>Refine your summary</SheetTitle>
            <SheetDescription>
              Shadow will keep updating this paragraph from new signals. Edit it directly to anchor the parts that matter to you.
            </SheetDescription>
          </SheetHeader>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="min-h-[280px] font-serif text-[15px] leading-relaxed"
          />
          <div className="mt-auto flex items-center justify-end gap-2">
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
        </SheetContent>
      </Sheet>
    </section>
  );
}
