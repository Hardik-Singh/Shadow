import { useEffect, useRef, useState } from 'react';
import { newOptionsByMode, View } from '../mock/data';

type Props = {
  view: View;
  onViewChange: (v: View) => void;
  onNew: (kind: string) => void;
};

const NEW_OPTIONS = newOptionsByMode.VC;

export default function Header({ view, onViewChange, onNew }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark">◈</div>
          Shadow
        </div>

        <div className="view-switcher" role="tablist" aria-label="view">
          <button
            role="tab"
            aria-selected={view === 'mine'}
            className={`view-btn ${view === 'mine' ? 'active' : ''}`}
            onClick={() => onViewChange('mine')}
          >
            My Shadow
          </button>
          <button
            role="tab"
            aria-selected={view === 'firm'}
            className={`view-btn ${view === 'firm' ? 'active' : ''}`}
            onClick={() => onViewChange('firm')}
          >
            Firm Brain
          </button>
        </div>

        <div className="header-spacer" />

        <div ref={ref} style={{ position: 'relative' }}>
          <button className="new-btn" onClick={() => setOpen((o) => !o)}>
            <span className="plus">+</span> New
          </button>
          {open && (
            <div className="new-menu" role="menu">
              {NEW_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className="new-menu-item"
                  onClick={() => { onNew(opt); setOpen(false); }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
