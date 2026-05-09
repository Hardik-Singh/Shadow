import { firmNotes, teammateById } from '../../mock/data';
import { Avatar } from '../Avatars';
import { Badge } from '@/components/ui/badge';

export default function Notes() {
  return (
    <section>
      <header className="mb-5">
        <h1 className="font-serif text-[26px] tracking-tight">Notes</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Free-form firm notes · theses, post-mortems, playbooks
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {firmNotes.map((n) => {
          const author = teammateById(n.authorId);
          return (
            <article key={n.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft">
              <header className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15.5px] font-semibold tracking-tight">{n.title}</h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    {author && <Avatar teammate={author} size="xs" interactive={false} />}
                    {author?.name} · updated {n.updated}
                  </div>
                </div>
              </header>
              <p className="text-[13.5px] leading-relaxed text-foreground/85">{n.body}</p>
              <div className="flex flex-wrap gap-1.5">
                {n.tags.map((t) => <Badge key={t} variant="muted">#{t}</Badge>)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
