import { Verdict } from '../mock/data';

const label: Record<Verdict, string> = {
  invest: 'invest',
  investigate: 'investigate',
  pass: 'pass',
};

export default function VerdictPill({ verdict, conviction }: { verdict: Verdict; conviction?: 'low' | 'medium' | 'high' }) {
  return (
    <span className={`verdict verdict-${verdict}`}>
      <span className="verdict-dot" />
      {label[verdict]}
      {conviction && <span className="verdict-conviction"> · {conviction}</span>}
    </span>
  );
}
