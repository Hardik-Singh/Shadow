import { Artifact, teammateById } from '../mock/data';
import VerdictPill from './VerdictPill';
import SourceChips from './SourceChips';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  artifact: Artifact | null;
  onClose: () => void;
  onOpenInFirm?: (a: Artifact) => void;
};

export default function ArtifactDetail({ artifact, onClose, onOpenInFirm }: Props) {
  const author = artifact ? teammateById(artifact.authorId) : null;

  return (
    <Sheet open={!!artifact} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex flex-col gap-5 overflow-y-auto">
        {artifact && (
          <>
            <header>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <VerdictPill verdict={artifact.verdict} />
                <span className="font-medium text-accent">{artifact.type}</span>
              </div>
              <h2 className="mt-3 font-serif text-[26px] leading-tight tracking-tight">
                {artifact.company}
              </h2>
              <div className="mt-1.5 text-[12.5px] text-muted-foreground">
                {author?.name} · {artifact.time}
              </div>
            </header>

            {artifact.read && (
              <p className="text-[14.5px] leading-relaxed text-foreground/90">{artifact.read}</p>
            )}

            {artifact.bodyKind === 'email' && artifact.email ? (
              <EmailThread email={artifact.email} />
            ) : artifact.bodyKind === 'slack' && artifact.slack ? (
              <SlackThread slack={artifact.slack} />
            ) : (
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                {artifact.body}
              </p>
            )}

            <SourceChips sources={artifact.sources} />

            <Separator />

            <div className="mt-auto flex items-center gap-2">
              <Button variant="outline" size="sm">Edit</Button>
              <Button variant="outline" size="sm">Regenerate</Button>
              {onOpenInFirm && (
                <Button size="sm" className="ml-auto" onClick={() => onOpenInFirm(artifact)}>
                  Open in Firm Brain <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function EmailThread({ email }: { email: NonNullable<Artifact['email']> }) {
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

function SlackThread({ slack }: { slack: NonNullable<Artifact['slack']> }) {
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
