import { useState, useEffect } from 'react';
import { Artifact, artifacts } from '../mock/data';
import Profile from './Profile';
import MyArtifacts from './MyArtifacts';
import ChatYourShadow from './ChatYourShadow';
import ArtifactDetail from './ArtifactDetail';

type Props = {
  onOpenInFirm?: (a: Artifact) => void;
  initialArtifactId?: string | null;
  pending?: Artifact[];
};

export default function MyShadowTab({ onOpenInFirm, initialArtifactId, pending }: Props) {
  const [open, setOpen] = useState<Artifact | null>(null);

  useEffect(() => {
    if (!initialArtifactId) return;
    const a = artifacts.find((x) => x.id === initialArtifactId);
    if (a) setOpen(a);
  }, [initialArtifactId]);

  return (
    <>
      <div className="mine-grid">
        <div className="mine-left">
          <Profile />
          <ChatYourShadow />
        </div>
        <div className="mine-right">
          <MyArtifacts onOpen={setOpen} pending={pending} />
        </div>
      </div>

      <ArtifactDetail
        artifact={open}
        onClose={() => setOpen(null)}
        onOpenInFirm={onOpenInFirm ? (a) => { onOpenInFirm(a); setOpen(null); } : undefined}
      />
    </>
  );
}
