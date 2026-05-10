import { Artifact, Citation } from '../mock/data';
import { AlertTriangle, Globe, Github, FileText } from 'lucide-react';

export function ArtifactBody({ current }: { current: Artifact }) {
  return (
    <>
      {current.bodyKind === 'email' && current.email ? (
        <EmailThread email={current.email} />
      ) : current.bodyKind === 'slack' && current.slack ? (
        <SlackThread slack={current.slack} />
      ) : current.bodyKind === 'html' ? (
        <div
          className="artifact-html text-[13.5px] leading-relaxed text-foreground/90 [&_h2]:mt-5 [&_h2]:mb-1.5 [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-[13px] [&_h3]:font-semibold [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_sup_a]:no-underline [&_sup]:text-[10px] [&_sup]:text-accent"
          dangerouslySetInnerHTML={{ __html: current.body }}
        />
      ) : (
        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
          {current.body}
        </p>
      )}
    </>
  );
}

export function FlagsBlock({ flags }: { flags?: string[] }) {
  if (!flags || flags.length === 0) return null;
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-[12px] text-amber-700 dark:text-amber-400">
      <div className="flex items-center gap-1.5 font-medium">
        <AlertTriangle className="h-3.5 w-3.5" />
        Caveats
      </div>
      <ul className="mt-1 list-disc pl-5">
        {flags.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    </div>
  );
}

export function CitationsList({ citations }: { citations?: Citation[] }) {
  if (!citations || citations.length === 0) return null;
  const ICON: Record<Citation['kind'], React.ReactNode> = {
    web:    <Globe className="h-3.5 w-3.5" />,
    github: <Github className="h-3.5 w-3.5" />,
    doc:    <FileText className="h-3.5 w-3.5" />,
  };
  return (
    <section>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Sources · Nia
      </div>
      <ol className="flex flex-col gap-1.5">
        {citations.map((c, i) => (
          <li key={c.id ?? c.url} className="flex items-start gap-2 rounded-md border border-border bg-card p-2 text-[12.5px]">
            <span className="mt-0.5 text-muted-foreground/70">{ICON[c.kind] ?? <Globe className="h-3.5 w-3.5" />}</span>
            <div className="min-w-0 flex-1">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-medium text-accent hover:underline"
                title={c.title}
              >
                <span className="mr-1.5 text-muted-foreground/70">[{i + 1}]</span>
                {c.title}
              </a>
              {c.summary && (
                <div className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{c.summary}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function EmailThread({ email }: { email: NonNullable<Artifact['email']> }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="text-[13.5px] font-semibold">{email.subject}</div>
      <div className="mt-3 flex flex-col gap-3">
        {email.messages.map((m, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold">{m.from}</span>
              <span className="text-muted-foreground/70">{m.time}</span>
            </div>
            {m.to && <div className="mt-0.5 text-[11.5px] text-muted-foreground">to: {m.to}</div>}
            <div className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
              {m.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SlackThread({ slack }: { slack: NonNullable<Artifact['slack']> }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <div className="font-mono text-[12px] text-accent">{slack.channel}</div>
      <div className="mt-3 flex flex-col gap-3">
        {slack.messages.map((m, i) => (
          <div key={i} className="flex gap-2.5">
            <div
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[10.5px] font-semibold text-white/95"
              style={{ background: `linear-gradient(135deg, hsl(${m.hue} 55% 52%), hsl(${(m.hue + 40) % 360} 50% 38%))` }}
            >
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[13px] font-semibold">{m.who}</span>
                <span className="text-[11px] text-muted-foreground/70">{m.time}</span>
              </div>
              <div className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{m.text}</div>
              {m.reactions && m.reactions.length > 0 && (
                <div className="mt-1.5 flex gap-1">
                  {m.reactions.map((r, j) => (
                    <span key={j} className="rounded-full border border-border bg-card px-2 py-0.5 text-[11px]">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
