import { useEffect, useRef, useState } from 'react';
import { Artifact } from '../mock/data';
import { useArtifacts } from '../lib/use-artifacts';
import MemorySummary from './MemorySummary';
import SignalChips from './SignalChips';
import ShadowUpdates from './ShadowUpdates';
import ChatYourShadow from './ChatYourShadow';
import MyArtifacts from './MyArtifacts';
import ArtifactDetail from './ArtifactDetail';
import { Separator } from '@/components/ui/separator';

type Props = {
  onOpenInFirm?: (a: Artifact) => void;
  initialArtifactId?: string | null;
  pending?: Artifact[];
};

export default function MyShadowTab({ onOpenInFirm, initialArtifactId, pending }: Props) {
  const [open, setOpen] = useState<Artifact | null>(null);
  const all = useArtifacts();
  const openedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialArtifactId) return;
    if (openedIdRef.current === initialArtifactId) return;
    const a = all.find((x) => x.id === initialArtifactId);
    if (a) {
      openedIdRef.current = initialArtifactId;
      setOpen(a);
    }
  }, [initialArtifactId, all]);

  return (
    <div className="mx-auto grid max-w-[1280px] gap-x-12 gap-y-12 px-6 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-10">
        <MemorySummary />
        <SignalChips />
        <Separator />
        <ChatYourShadow />
        <Separator />
        <MyArtifacts onOpen={setOpen} pending={pending} />
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <ShadowUpdates />
      </div>

      <ArtifactDetail
        artifact={open}
        onClose={() => setOpen(null)}
        onOpenInFirm={onOpenInFirm ? (a) => { onOpenInFirm(a); setOpen(null); } : undefined}
      />
    </div>
  );
}
