import { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, MessageSquarePlus } from 'lucide-react';
import SessionSidebar from './SessionSidebar';
import SessionChat from './SessionChat';
import { AUTONOMOUS_TASKS, priorSessions, type Session } from '@/mock/autonomous';
import { startSandbox, buildHandoffContext } from '@/lib/daytona';

type LiveSession = Session & {
  startedAt: number;
  liveMounted: boolean;
  userContext: string | null;
};

export default function AutonomousTab() {
  const [sessions, setSessions] = useState<LiveSession[]>(() =>
    priorSessions.map((s) => ({ ...s, startedAt: 0, liveMounted: false, userContext: null })),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const running = sessions.find((s) => s.status === 'running');
    if (!running) return;
    const t = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.status !== 'running') return s;
          const mins = Math.max(0, Math.round((Date.now() - s.startedAt) / 60000));
          return { ...s, startedAtLabel: mins === 0 ? 'just now' : `${mins}m ago` };
        }),
      );
    }, 30000);
    return () => clearInterval(t);
  }, [sessions]);

  const startHandoff = (userContext: string | null) => {
    const id = `s-${Date.now()}`;
    const newSession: LiveSession = {
      id,
      title: userContext ? 'handoff · with context' : 'handoff · auto-context',
      subtitle: 'finish nozomio · triage inbox · run DD on nozomio',
      startedAtLabel: 'just now',
      status: 'running',
      startedAt: Date.now(),
      liveMounted: true,
      userContext,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveId(id);

    // Build the full handoff context (hyperspell + nia + daytona + connectors).
    // Fire-and-forget; UI animation never waits on this.
    const ctx = buildHandoffContext({
      partnerId: 'hardik',
      userMessage: userContext,
      tasks: AUTONOMOUS_TASKS.map((t) => t.key),
    });
    startSandbox(ctx).catch(() => {});

    const STARTING_MS = 2400;
    const TASK_GAP_MS = 800;
    const WRAP_MS = 900;
    const totalMs =
      STARTING_MS +
      AUTONOMOUS_TASKS.reduce((acc, t) => acc + t.durationMs + TASK_GAP_MS, 0) +
      WRAP_MS;
    setTimeout(() => {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'complete' } : s)),
      );
    }, totalMs);
  };

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const hasRunning = sessions.some((s) => s.status === 'running');

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <SessionSidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={setActiveId}
        onNewHandoff={() => startHandoff(null)}
        newDisabled={hasRunning}
      />
      <div className="min-w-0 flex-1">
        {active ? (
          <SessionChat
            sessionId={active.id}
            live={active.liveMounted && active.status !== 'complete'}
            startedAtLabel={active.startedAtLabel}
            userContext={active.userContext}
          />
        ) : (
          <EmptyState onStart={startHandoff} disabled={hasRunning} />
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onStart,
  disabled,
}: {
  onStart: (userContext: string | null) => void;
  disabled: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <div className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          first handoff
        </div>
        <h1 className="font-serif text-[34px] leading-tight tracking-tight">
          hand off the desk.
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          shadow runs your queue while you're away. it reads your hyperspell vault to
          figure out what you were working on and picks up from there. nothing gets sent —
          everything is queued for your review.
        </p>

        {!adding ? (
          <div className="mt-7 flex flex-col gap-3">
            <button
              onClick={() => onStart(null)}
              disabled={disabled}
              className="group flex w-full items-start justify-between gap-4 rounded-lg bg-accent px-5 py-4 text-left text-accent-foreground shadow-pop transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
            >
              <div>
                <div className="text-[14px] font-semibold tracking-tight">
                  hand it off — go ahead and work
                </div>
                <div className="mt-0.5 text-[12px] text-accent-foreground/80">
                  shadow will read your hyperspell vault, figure out where you left off,
                  and start working
                </div>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => setAdding(true)}
              disabled={disabled}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-[13px] font-medium text-foreground shadow-soft transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              or add context first
            </button>
          </div>
        ) : (
          <div className="mt-7 rounded-lg border border-border bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-foreground">
              <MessageSquarePlus className="h-3.5 w-3.5 text-accent" />
              add context for shadow
            </div>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="anything shadow should know before starting? e.g. 'skip the comp table on nozomio' or 'don't draft pass emails to YC companies'…"
              rows={4}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                onClick={() => { setAdding(false); setText(''); }}
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                cancel
              </button>
              <button
                onClick={() => onStart(text.trim() || null)}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                hand it off
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-[11.5px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">runs on:</span>{' '}
          daytona sandbox · hyperspell behavioral model · nia live context · gmail · calendar ·
          slack · notion · crunchbase · twitter · github · linkedin
        </div>
      </div>
    </div>
  );
}
