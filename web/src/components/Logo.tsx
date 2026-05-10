import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex h-7 w-7 items-center justify-center', className)}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="22" height="22">
        <g fill="#6b7280" transform="translate(-4,-2)">
          <rect x="9" y="5" width="6" height="6" />
          <rect x="6" y="12" width="12" height="10" rx="2" />
        </g>
        <g fill="#d1d5db">
          <rect x="9" y="5" width="6" height="6" />
          <rect x="6" y="12" width="12" height="10" rx="2" />
        </g>
      </svg>
    </span>
  );
}
