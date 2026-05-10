import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SourceTag } from './BriefSection';
import type { BriefItem } from '@/mock/autonomous';

type Props = {
  item: BriefItem | null;
  onClose: () => void;
};

export default function BriefDetailSheet({ item, onClose }: Props) {
  return (
    <Sheet open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent>
        {item && (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg">{item.title}</SheetTitle>
              <SheetDescription>{item.meta}</SheetDescription>
            </SheetHeader>
            <div className="mt-5 space-y-4">
              <p className="text-[14px] leading-relaxed text-foreground">{item.body}</p>
              {item.sources && item.sources.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    sources
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.sources.map((s) => (
                      <SourceTag key={s} name={s} />
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-md border border-dashed border-border bg-secondary/40 p-3 text-[12px] text-muted-foreground">
                queued for your 9am review · nothing has been sent
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
