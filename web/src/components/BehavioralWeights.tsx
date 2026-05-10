import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const API_BASE =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SHADOW_API) ||
  'http://127.0.0.1:4310';

type Bar = { id: string; label: string; score: number; count: number };
type Weights = {
  bars: Bar[];
  confidence: number;
  signalsThisWeek: number;
  signalsLastWeek: number;
  weeklyDelta: number;
  totalSignals: number;
};

async function fetchWeights(): Promise<Weights | null> {
  try {
    const res = await fetch(`${API_BASE}/profile/weights`);
    if (!res.ok) return null;
    return (await res.json()) as Weights;
  } catch {
    return null;
  }
}

export default function BehavioralWeights() {
  const [w, setW] = useState<Weights | null>(null);

  useEffect(() => {
    fetchWeights().then(setW);
    const t = setInterval(() => fetchWeights().then(setW), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!w) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-[13px] text-muted-foreground">
        weights computing… (run the HUD to populate memory)
      </section>
    );
  }

  const Trend = w.weeklyDelta > 0 ? TrendingUp : w.weeklyDelta < 0 ? TrendingDown : Minus;
  const trendColor =
    w.weeklyDelta > 0 ? 'text-emerald-600' : w.weeklyDelta < 0 ? 'text-rose-600' : 'text-muted-foreground';

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            behavioral weights
          </div>
          <div className="mt-0.5 text-[13px] text-foreground/85">
            what your shadow has learned to value
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>
            confidence <span className="text-foreground tabular-nums">{w.confidence}</span>
          </span>
          <span className={`flex items-center gap-1 ${trendColor}`}>
            <Trend className="h-3 w-3" />
            <span className="tabular-nums">
              {w.weeklyDelta > 0 ? '+' : ''}
              {w.weeklyDelta}
            </span>
            <span className="text-muted-foreground">this wk</span>
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {w.bars.map((b) => (
          <li key={b.id} className="grid grid-cols-[140px_1fr_30px] items-center gap-3 text-[12.5px]">
            <span className="text-foreground/80">{b.label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full bg-accent transition-[width]"
                style={{ width: `${b.score}%` }}
              />
            </span>
            <span className="text-right tabular-nums text-muted-foreground">{b.count}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        {w.totalSignals} signals captured · {w.signalsThisWeek} this week vs {w.signalsLastWeek} last
      </div>
    </section>
  );
}
