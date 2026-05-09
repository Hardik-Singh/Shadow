import { useEffect, useState } from 'react';
import { Artifact } from '../../mock/data';
import FirmQuery from './FirmQuery';
import Pipeline from './Pipeline';
import FirmArtifacts from './FirmArtifacts';
import ArtifactDetail from '../ArtifactDetail';

type Props = { focusedDealId?: string | null };

export default function FirmBrainTab({ focusedDealId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(focusedDealId ?? null);
  const [open, setOpen] = useState<Artifact | null>(null);

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
      <FirmArtifacts onOpen={setOpen} />
      <ArtifactDetail artifact={open} onClose={() => setOpen(null)} />
    </div>
  );
}
