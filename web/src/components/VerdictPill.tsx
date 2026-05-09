import { Verdict } from '../mock/data';
import { cn } from '@/lib/utils';

const STYLES: Record<Verdict, string> = {
  invest:      'border-emerald-200 bg-emerald-50 text-emerald-700',
  investigate: 'border-amber-200 bg-amber-50 text-amber-800',
  pass:        'border-rose-200 bg-rose-50 text-rose-700',
};

const DOT: Record<Verdict, string> = {
  invest: 'bg-emerald-500',
  investigate: 'bg-amber-500',
  pass: 'bg-rose-500',
};

export default function VerdictPill({
  verdict,
  conviction,
  className,
}: {
  verdict: Verdict;
  conviction?: 'low' | 'medium' | 'high';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider',
        STYLES[verdict],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT[verdict])} />
      {verdict}
      {conviction && (
        <span className="font-normal normal-case tracking-normal opacity-70">· {conviction}</span>
      )}
    </span>
  );
}
