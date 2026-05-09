import { Teammate, teammateById } from '../mock/data';
import { usePartnerChat } from './PartnerChat';
import { cn } from '@/lib/utils';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZE: Record<Size, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-[11px]',
  lg: 'h-10 w-10 text-xs',
};

export function Avatar({
  teammate,
  size = 'sm',
  title,
  interactive = true,
  className,
}: {
  teammate: Teammate;
  size?: Size;
  title?: string;
  interactive?: boolean;
  className?: string;
}) {
  const chat = usePartnerChat();
  const clickable = interactive && teammate.id !== 'me';

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold tracking-tight text-white/95 ring-2 ring-background',
        SIZE[size],
        clickable && 'cursor-pointer transition-transform hover:-translate-y-0.5 hover:ring-accent/40',
        className,
      )}
      title={
        title ??
        (clickable
          ? `${teammate.name} · ${teammate.role} — chat with their shadow`
          : `${teammate.name} · ${teammate.role}`)
      }
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={(e) => {
        if (!clickable) return;
        e.stopPropagation();
        chat.open(teammate.id);
      }}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          chat.open(teammate.id);
        }
      }}
      style={{
        background: `linear-gradient(135deg, hsl(${teammate.hue} 55% 52%), hsl(${(teammate.hue + 40) % 360} 50% 38%))`,
      }}
    >
      {teammate.initials}
    </div>
  );
}

export function AvatarStack({
  ids,
  size = 'sm',
  max = 4,
}: {
  ids: string[];
  size?: Size;
  max?: number;
}) {
  const visible = ids.slice(0, max);
  const overflow = ids.length - visible.length;
  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((id) => {
        const t = teammateById(id);
        if (!t) return null;
        return <Avatar key={id} teammate={t} size={size} />;
      })}
      {overflow > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-muted-foreground ring-2 ring-background',
            SIZE[size],
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
