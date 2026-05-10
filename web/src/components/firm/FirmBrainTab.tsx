import { useEffect, useMemo, useState } from 'react';
import { Artifact, deals } from '../../mock/data';
import FirmSidebar, { FirmSection } from './FirmSidebar';
import Pipeline from './Pipeline';
import DealDetail from './DealDetail';
import Companies from './Companies';
import People from './People';
import Meetings from './Meetings';
import Notes from './Notes';
import FirmArtifacts from './FirmArtifacts';
import FirmQuery from './FirmQuery';
import ArtifactDetail from '../ArtifactDetail';
import { Sheet, SheetContent } from '@/components/ui/sheet';

type Props = { focusedDealId?: string | null };

function readSection(): FirmSection {
  const p = new URLSearchParams(window.location.search).get('section');
  if (p && ['pipeline', 'companies', 'people', 'meetings', 'notes', 'artifacts'].includes(p)) {
    return p as FirmSection;
  }
  return 'pipeline';
}

export default function FirmBrainTab({ focusedDealId }: Props) {
  const [section, setSection] = useState<FirmSection>(readSection());
  const [openDealId, setOpenDealId] = useState<string | null>(focusedDealId ?? null);
  const [openArtifact, setOpenArtifact] = useState<Artifact | null>(null);

  useEffect(() => {
    if (focusedDealId) setOpenDealId(focusedDealId);
  }, [focusedDealId]);

  const changeSection = (s: FirmSection) => {
    setSection(s);
    const params = new URLSearchParams(window.location.search);
    params.set('view', 'firm');
    params.set('section', s);
    params.delete('deal');
    window.history.replaceState({}, '', `?${params.toString()}`);
  };

  const openDeal = (id: string) => setOpenDealId(id);
  const closeDeal = () => setOpenDealId(null);

  const deal = useMemo(() => deals.find((d) => d.id === openDealId) ?? null, [openDealId]);

  return (
    <div className="mx-auto flex max-w-[1440px]">
      <FirmSidebar section={section} onChange={changeSection} onOpenDeal={openDeal} />

      <main className="flex-1 px-8 py-10">
        <FirmQuery />
        {section === 'pipeline'  && <Pipeline onOpenDeal={openDeal} />}
        {section === 'companies' && <Companies onOpenDeal={openDeal} />}
        {section === 'people'    && <People onOpenDeal={openDeal} />}
        {section === 'meetings'  && <Meetings onOpenDeal={openDeal} />}
        {section === 'notes'     && <Notes />}
        {section === 'artifacts' && <FirmArtifacts onOpen={setOpenArtifact} />}
      </main>

      <Sheet open={!!deal} onOpenChange={(o) => !o && closeDeal()}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          {deal && <DealDetail deal={deal} />}
        </SheetContent>
      </Sheet>

      <ArtifactDetail artifact={openArtifact} onClose={() => setOpenArtifact(null)} />
    </div>
  );
}
