import { Teammate, teammateById } from '../mock/data';
import { usePartnerChat } from './PartnerChat';

type Size = 'sm' | 'md';

export function Avatar({
  teammate, size = 'sm', title, interactive = true,
}: { teammate: Teammate; size?: Size; title?: string; interactive?: boolean }) {
  const dim = size === 'md' ? 30 : 24;
  const chat = usePartnerChat();
  const clickable = interactive && teammate.id !== 'me';

  const onClick = (e: React.MouseEvent) => {
    if (!clickable) return;
    e.stopPropagation();
    chat.open(teammate.id);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (!clickable) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      chat.open(teammate.id);
    }
  };

  return (
    <div
      className={`avatar avatar-${size} ${clickable ? 'avatar-clickable' : ''}`}
      title={
        title ??
        (clickable
          ? `${teammate.name} · ${teammate.role} — chat with their shadow`
          : `${teammate.name} · ${teammate.role}`)
      }
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onKey}
      style={{
        width: dim, height: dim,
        background: `linear-gradient(135deg, hsl(${teammate.hue} 70% 60%), hsl(${(teammate.hue + 40) % 360} 60% 40%))`,
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
}: { ids: string[]; size?: Size; max?: number }) {
  const visible = ids.slice(0, max);
  const overflow = ids.length - visible.length;
  return (
    <div className="avatar-stack">
      {visible.map((id) => {
        const t = teammateById(id);
        if (!t) return null;
        return <Avatar key={id} teammate={t} size={size} />;
      })}
      {overflow > 0 && <div className={`avatar avatar-${size} avatar-more`}>+{overflow}</div>}
    </div>
  );
}
