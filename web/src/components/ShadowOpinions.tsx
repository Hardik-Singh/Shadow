import { opinions, teammateById } from '../mock/data';
import { useArtifacts } from '../lib/use-artifacts';
import { slugForArtifact } from '../lib/artifacts-api';
import { Card } from '@/components/ui/card';
import VerdictPill from './VerdictPill';

type Props = { artifactId: string };

function navigateToSlug(slug: string) {
  window.history.pushState({}, '', `/artifact/${slug}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function highlightVerdict(text: string, evidence: { label: string; artifactId?: string }[], all: { id: string; type?: string; company?: string }[]): React.ReactNode[] {
  if (!text) return [text];
  const ranges: { start: number; end: number; ev: { label: string; artifactId?: string } }[] = [];
  for (const ev of evidence) {
    if (!ev.label) continue;
    const lower = text.toLowerCase();
    const lbl = ev.label.toLowerCase();
    let from = 0;
    while (true) {
      const idx = lower.indexOf(lbl, from);
      if (idx === -1) break;
      ranges.push({ start: idx, end: idx + lbl.length, ev });
      from = idx + lbl.length;
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  // remove overlaps
  const merged: typeof ranges = [];
  for (const r of ranges) {
    if (merged.length === 0 || r.start >= merged[merged.length - 1].end) merged.push(r);
  }
  if (merged.length === 0) return [text];
  const out: React.ReactNode[] = [];
  let i = 0;
  for (const r of merged) {
    if (r.start > i) out.push(text.slice(i, r.start));
    const piece = text.slice(r.start, r.end);
    const target = r.ev.artifactId ? all.find((a) => a.id === r.ev.artifactId) : null;
    if (target) {
      const slug = slugForArtifact(target);
      out.push(
        <mark key={`${r.start}-mk`} className="rounded bg-accent/10 px-0.5 py-0 text-foreground">
          <a
            href={`/artifact/${slug}`}
            onClick={(e) => { e.preventDefault(); navigateToSlug(slug); }}
            className="text-accent underline-offset-2 hover:underline"
          >
            {piece}
          </a>
        </mark>,
      );
    } else {
      out.push(<mark key={`${r.start}-mk`} className="rounded bg-accent/10 px-0.5 py-0 text-foreground">{piece}</mark>);
    }
    i = r.end;
  }
  if (i < text.length) out.push(text.slice(i));
  return out;
}

export default function ShadowOpinions({ artifactId }: Props) {
  const all = useArtifacts();
  const entry = (opinions as Record<string, Record<string, {
    verdict: 'invest' | 'investigate' | 'pass';
    verdictText: string;
    evidence: { kind: string; label: string; artifactId?: string }[];
    priors: { kind: 'similar' | 'different'; label: string; artifactId?: string; outcome: string }[];
  }>>)[artifactId];
  if (!entry) return null;

  const partnerEntries = Object.entries(entry);
  if (partnerEntries.length === 0) return null;

  return (
    <aside className="flex flex-col gap-4">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          shadow opinions
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          what each partner's shadow thinks about this one.
        </p>
      </div>
      {partnerEntries.map(([partnerId, op]) => {
        const t = teammateById(partnerId);
        const initials = t?.initials ?? partnerId.slice(0, 2).toUpperCase();
        const hue = t?.hue ?? 220;
        const name = t?.name ?? partnerId;
        return (
          <Card key={partnerId} className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2.5">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[11px] font-semibold text-white/95"
                style={{ background: `linear-gradient(135deg, hsl(${hue} 55% 52%), hsl(${(hue + 40) % 360} 50% 38%))` }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold leading-tight">{name}</div>
                <div className="text-[11px] text-muted-foreground">{t?.role}</div>
              </div>
              <VerdictPill verdict={op.verdict} />
            </div>

            <div className="text-[13px] leading-relaxed text-foreground/90">
              {highlightVerdict(op.verdictText, op.evidence, all)}
            </div>

            {op.evidence.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {op.evidence.slice(0, 3).map((ev, i) => {
                  const target = ev.artifactId ? all.find((a) => a.id === ev.artifactId) : null;
                  const slug = target ? slugForArtifact(target) : null;
                  const cls = 'rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-secondary';
                  if (slug) {
                    return (
                      <a key={i} href={`/artifact/${slug}`} onClick={(e) => { e.preventDefault(); navigateToSlug(slug); }} className={cls}>
                        {ev.kind} · {ev.label}
                      </a>
                    );
                  }
                  return <span key={i} className={cls}>{ev.kind} · {ev.label}</span>;
                })}
              </div>
            )}

            {op.priors.length > 0 && (
              <div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  old deals
                </div>
                <div className="flex flex-col gap-1.5">
                  {op.priors.map((p, i) => {
                    const target = p.artifactId ? all.find((a) => a.id === p.artifactId) : null;
                    const slug = target ? slugForArtifact(target) : null;
                    const inner = (
                      <>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className={p.kind === 'similar' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                            {p.kind}
                          </span>
                          <span className="ml-auto text-muted-foreground">{p.outcome}</span>
                        </div>
                        <div className="mt-0.5 text-[12.5px] leading-snug text-foreground/85">{p.label}</div>
                      </>
                    );
                    const cls = 'rounded-md border border-border bg-card p-2 text-left transition-colors hover:border-foreground/20 hover:bg-secondary/40';
                    if (slug) {
                      return (
                        <a key={i} href={`/artifact/${slug}`} onClick={(e) => { e.preventDefault(); navigateToSlug(slug); }} className={cls}>
                          {inner}
                        </a>
                      );
                    }
                    return <div key={i} className={cls}>{inner}</div>;
                  })}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </aside>
  );
}
