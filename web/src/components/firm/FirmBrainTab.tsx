import { useState, useEffect } from 'react';
import FirmQuery from './FirmQuery';
import Pipeline from './Pipeline';

type Props = { focusedDealId?: string | null };

export default function FirmBrainTab({ focusedDealId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(focusedDealId ?? null);

  useEffect(() => {
    if (focusedDealId) setExpandedId(focusedDealId);
  }, [focusedDealId]);

  return (
    <div className="firm-tab">
      <FirmQuery />
      <Pipeline
        expandedId={expandedId}
        onToggle={(id) => setExpandedId((curr) => (curr === id ? null : id))}
      />
    </div>
  );
}
