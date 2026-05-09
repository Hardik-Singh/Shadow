import { Teammate, teammateById } from '../mock/data';

type Size = 'sm' | 'md';

export function Avatar({ teammate, size = 'sm', title }: { teammate: Teammate; size?: Size; title?: string }) {
  const dim = size === 'md' ? 30 : 24;
  return (
    <div
      className={`avatar avatar-${size}`}
      title={title ?? `${teammate.name} · ${teammate.role}`}
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
