import { useEffect, useState } from 'react';
import { Hash, AtSign, FileText, Calendar, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE =
  ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SHADOW_API) ||
  'http://127.0.0.1:4310';

type Provider = {
  id: string;
  label: string;
  Icon: typeof Hash;
  blurb: string;
};

const PROVIDERS: Provider[] = [
  { id: 'slack',    label: 'Slack',    Icon: Hash,     blurb: 'partner threads, channel mentions' },
  { id: 'gmail',    label: 'Gmail',    Icon: AtSign,   blurb: 'warm intro chains, founder outreach' },
  { id: 'docs',     label: 'Docs',     Icon: FileText, blurb: 'Notion + Google Docs · thesis memos' },
  { id: 'calendar', label: 'Calendar', Icon: Calendar, blurb: 'prior meetings, relationship history' },
];

async function getStatus(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/integrations/${id}/status`);
    if (!res.ok) return false;
    const j = (await res.json()) as { connected: boolean };
    return !!j.connected;
  } catch {
    return false;
  }
}

async function connect(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/integrations/${id}/connect`, { method: 'POST' });
    if (!res.ok) return false;
    const j = (await res.json()) as { connected: boolean };
    return !!j.connected;
  } catch {
    return false;
  }
}

async function disconnect(id: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/integrations/${id}/disconnect`, { method: 'POST' });
  } catch {}
}

function Card({ p }: { p: Provider }) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStatus(p.id).then(setConnected);
  }, [p.id]);

  async function toggle() {
    setBusy(true);
    if (connected) {
      await disconnect(p.id);
      setConnected(false);
    } else {
      const ok = await connect(p.id);
      setConnected(ok);
    }
    setBusy(false);
  }

  const Icon = p.Icon;
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold">{p.label}</div>
          <div className="text-[11px] text-muted-foreground truncate">{p.blurb}</div>
        </div>
      </div>
      {connected ? (
        <Button variant="outline" size="sm" onClick={toggle} disabled={busy}>
          <Check className="h-3 w-3 text-emerald-600" /> connected
        </Button>
      ) : (
        <Button size="sm" onClick={toggle} disabled={busy}>
          {busy ? '…' : 'connect'}
        </Button>
      )}
    </div>
  );
}

export default function Integrations() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          connections
        </div>
        <div className="text-[12px] text-muted-foreground">
          shadow pulls relevant context from each source automatically
        </div>
      </div>
      <ul className="flex flex-col gap-2">
        {PROVIDERS.map((p) => (
          <li key={p.id}>
            <Card p={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
