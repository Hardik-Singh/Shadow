import { useEffect, useRef, useState } from 'react';
import { Loader2, Check, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from '../Logo';
import { AUTONOMOUS_TASKS } from '@/mock/autonomous';
import MorningBriefCard from './MorningBriefCard';

type Props = {
  // session-scoped key — when this changes, chat resets and replays for the new session
  sessionId: string;
  // if true, this is a freshly triggered session and should animate from the start
  live: boolean;
  startedAtLabel: string;
  userContext: string | null;
};

type ChatPhase =
  | { kind: 'starting' }
  | { kind: 'task'; idx: number; lineIdx: number }
  | { kind: 'wrapping' }
  | { kind: 'done' };

const TASK_GAP_MS = 800;
const STARTING_MS = 2400;

export default function SessionChat({ sessionId, live, startedAtLabel, userContext }: Props) {
  const [phase, setPhase] = useState<ChatPhase>(live ? { kind: 'starting' } : { kind: 'done' });
  const timers = useRef<number[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];

    if (!live) {
      setPhase({ kind: 'done' });
      return;
    }

    setPhase({ kind: 'starting' });

    let elapsed = STARTING_MS;
    timers.current.push(
      window.setTimeout(() => setPhase({ kind: 'task', idx: 0, lineIdx: 0 }), elapsed),
    );

    AUTONOMOUS_TASKS.forEach((task, taskIdx) => {
      const lineMs = task.durationMs / task.detailLines.length;
      task.detailLines.forEach((_, lineIdx) => {
        elapsed += lineMs;
        const ti = taskIdx;
        const li = lineIdx;
        timers.current.push(
          window.setTimeout(() => {
            setPhase({ kind: 'task', idx: ti, lineIdx: li });
          }, elapsed),
        );
      });
      // gap between tasks
      elapsed += TASK_GAP_MS;
    });

    timers.current.push(window.setTimeout(() => setPhase({ kind: 'wrapping' }), elapsed));
    timers.current.push(window.setTimeout(() => setPhase({ kind: 'done' }), elapsed + 900));

    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, [sessionId, live]);

  // auto-scroll to bottom on phase change
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [phase]);

  // visibility helpers
  const phaseKind = phase.kind;
  const activeTaskIdx = phase.kind === 'task' ? phase.idx : phase.kind === 'wrapping' || phase.kind === 'done' ? AUTONOMOUS_TASKS.length : -1;
  const activeLineIdx = phase.kind === 'task' ? phase.lineIdx : -1;

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <div className="text-[13px] font-semibold tracking-tight text-foreground">
            handoff session
          </div>
          <div className="text-[11.5px] text-muted-foreground">started {startedAtLabel}</div>
        </div>
        <SessionStatusBadge phaseKind={phaseKind} />
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <UserMsg>
            {userContext ? userContext : 'go ahead and work.'}
          </UserMsg>

          {phaseKind === 'starting' && <ShadowTyping />}

          {(phaseKind === 'task' || phaseKind === 'wrapping' || phaseKind === 'done') && (
            <ShadowMsg>
              <p className="text-foreground">
                spinning up sandbox on daytona.io · loading partner:hardik vault from hyperspell.
              </p>
              <p className="mt-1 text-muted-foreground">
                connectors live: gmail · calendar · slack · notion · crunchbase · twitter · github · linkedin.
                approval required on every output — nothing gets sent.
              </p>
            </ShadowMsg>
          )}

          {AUTONOMOUS_TASKS.map((task, i) => {
            if (activeTaskIdx < i) return null;
            const isActive = phaseKind === 'task' && phase.kind === 'task' && phase.idx === i;
            const isComplete = activeTaskIdx > i;
            const visibleLines = isActive ? activeLineIdx + 1 : task.detailLines.length;

            return (
              <ShadowMsg key={task.key}>
                <div className="flex items-start gap-2">
                  <TaskCheck active={isActive} done={isComplete} />
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[13.5px] font-semibold text-foreground')}>
                      {task.title}
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {task.detailLines.slice(0, visibleLines).map((line, j) => {
                        const isLastVisible = j === visibleLines - 1 && isActive;
                        return (
                          <li
                            key={j}
                            className="animate-fade-in text-[12.5px] leading-relaxed text-muted-foreground"
                          >
                            <span className="mr-1.5 text-muted-foreground/60">›</span>
                            {line}
                            {isLastVisible && <BlinkingCursor />}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </ShadowMsg>
            );
          })}

          {phaseKind === 'wrapping' && <ShadowTyping label="compiling brief" />}

          {phaseKind === 'done' && (
            <>
              <ShadowMsg>
                <p className="text-foreground">all 3 tasks done. nothing has been sent — everything is queued for your review.</p>
              </ShadowMsg>
              <div className="pt-2">
                <MorningBriefCard />
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="border-t border-border px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between text-[11.5px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Power className="h-3 w-3" />
            sandbox: daytona · partner_id: hardik · approvals required
          </div>
          <div>{phaseKind === 'done' ? 'idle · awaiting your review' : 'live'}</div>
        </div>
      </footer>
    </div>
  );
}

function UserMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-[13.5px] leading-relaxed text-primary-foreground shadow-soft">
        {children}
      </div>
    </div>
  );
}

function ShadowMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex animate-fade-in items-start gap-2.5">
      <div className="mt-0.5 shrink-0">
        <Logo className="h-7 w-7" />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 text-[13.5px] leading-relaxed shadow-soft">
        {children}
      </div>
    </div>
  );
}

function ShadowTyping({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="mt-0.5 shrink-0">
        <Logo className="h-7 w-7" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-soft">
        <div className="flex items-center gap-1.5">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
          {label && <span className="ml-2 text-[12px] text-muted-foreground">{label}…</span>}
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60"
      style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
    />
  );
}

function BlinkingCursor() {
  return <span className="ml-1 inline-block h-3 w-1.5 animate-pulse bg-foreground/60 align-middle" />;
}

function TaskCheck({ active, done }: { active: boolean; done: boolean }) {
  if (active) return <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-accent" />;
  if (done) {
    return (
      <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Check className="h-2.5 w-2.5" />
      </span>
    );
  }
  return <span className="mt-0.5 h-4 w-4 rounded-full border border-border" />;
}

function SessionStatusBadge({ phaseKind }: { phaseKind: ChatPhase['kind'] }) {
  if (phaseKind === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Check className="h-3 w-3" />
        complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-foreground">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      live
    </span>
  );
}
