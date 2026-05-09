import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background',
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="15.5" cy="6" rx="2.4" ry="2.4" fill="currentColor" stroke="none" opacity="0.55" />
        <path d="M19.2 21c0-3.4-2-5.6-5.2-5.6S8.8 17.6 8.8 21" fill="currentColor" stroke="none" opacity="0.55" />
        <circle cx="10" cy="6" r="2.4" />
        <path d="M14 21c0-3.4-2-5.6-4.5-5.6S5 17.6 5 21" />
      </svg>
    </span>
  );
}
