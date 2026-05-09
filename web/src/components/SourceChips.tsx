import { SourceKind, sourceLabel } from '../mock/data';

const ICON: Record<SourceKind, string> = {
  slack: '#', email: '@', notion: '◧', calendar: '◴', prior: '↺',
};

export default function SourceChips({ sources }: { sources: SourceKind[] }) {
  if (!sources.length) return null;
  return (
    <div className="sources">
      {sources.map((s) => (
        <span key={s} className={`source source-${s}`} title={sourceLabel[s]}>
          <span className="source-icon">{ICON[s]}</span>
          {sourceLabel[s]}
        </span>
      ))}
    </div>
  );
}
