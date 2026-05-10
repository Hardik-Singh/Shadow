import { firmInboundActions } from '../mock/data';
import { useArtifacts } from '../lib/use-artifacts';
import { slugForArtifact } from '../lib/artifacts-api';
import { Card } from '@/components/ui/card';
import { Activity, ArrowUpRight, Briefcase, Mail, Sparkles } from 'lucide-react';

type ActionItem = {
  id: string;
  kind: 'inbound-pitch' | 'founder-raised' | 'portfolio-signal';
  title: string;
  subtitle: string;
  artifactId?: string;
  reason: string;
};

function navigateToSlug(slug: string) {
  window.history.pushState({}, '', `/artifact/${slug}`);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

const GROUPS: { kind: ActionItem['kind']; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: 'inbound-pitch',     label: "inbound pitches you'd want first call",     icon: Mail },
  { kind: 'founder-raised',    label: "founders you've previously met just raised", icon: Sparkles },
  { kind: 'portfolio-signal',  label: 'portfolio company signal',                   icon: Briefcase },
];

export default function Actions() {
  const all = useArtifacts();
  const items = (firmInboundActions as ActionItem[]) ?? [];

  return (
    <aside className="flex flex-col gap-5">
      <header>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-accent" />
          actions
        </div>
        <p className="mt-1.5 text-[13px] text-muted-foreground">
          things shadow thinks deserve a first look.
        </p>
      </header>

      {GROUPS.map(({ kind, label, icon: Icon }) => {
        const group = items.filter((i) => i.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind}>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground/70">
              <Icon className="h-3.5 w-3.5 text-accent" />
              {label}
            </div>
            <div className="flex flex-col gap-2">
              {group.map((it) => {
                const target = it.artifactId ? all.find((a) => a.id === it.artifactId) : null;
                const slug = target ? slugForArtifact(target) : null;
                const inner = (
                  <>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium leading-snug text-foreground">{it.title}</div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground">{it.subtitle}</div>
                      </div>
                      {slug && <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    </div>
                    <div className="mt-1.5 text-[11.5px] leading-snug text-muted-foreground/80">{it.reason}</div>
                  </>
                );
                const cls = 'block p-3.5 text-left transition-colors hover:border-foreground/20 hover:bg-secondary/40';
                if (slug) {
                  return (
                    <Card key={it.id} className="overflow-hidden">
                      <a href={`/artifact/${slug}`} onClick={(e) => { e.preventDefault(); navigateToSlug(slug); }} className={cls}>
                        {inner}
                      </a>
                    </Card>
                  );
                }
                return <Card key={it.id} className={cls}>{inner}</Card>;
              })}
            </div>
          </section>
        );
      })}
    </aside>
  );
}
