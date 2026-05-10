import { Artifact } from '../mock/data';
import { slugForArtifact } from '../lib/artifacts-api';
import MemorySummary from './MemorySummary';
import BehavioralWeights from './BehavioralWeights';
import SignalChips from './SignalChips';
import Actions from './Actions';
import Integrations from './Integrations';
import ChatYourShadow from './ChatYourShadow';
import MyArtifacts from './MyArtifacts';
import { Separator } from '@/components/ui/separator';

type Props = {
  onOpenInFirm?: (a: Artifact) => void;
  initialArtifactId?: string | null;
  pending?: Artifact[];
};

export default function MyShadowTab({ pending }: Props) {
  const navigate = (a: Artifact) => {
    const slug = slugForArtifact(a);
    window.history.pushState({}, '', `/artifact/${slug}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="mx-auto grid max-w-[1280px] gap-x-12 gap-y-12 px-6 py-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-10">
        <MemorySummary />
        <BehavioralWeights />
        <SignalChips />
        <Separator />
        <ChatYourShadow />
        <Separator />
        <MyArtifacts onOpen={navigate} pending={pending} />
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <Actions />
        <Integrations />
      </div>
    </div>
  );
}
