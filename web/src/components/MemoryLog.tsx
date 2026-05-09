import { useState } from 'react';
import { initialMemory, MemoryEntry } from '../mock/data';

const ICON: Record<MemoryEntry['source'], string> = {
  screen: '👁',
  voice:  '🎙',
  file:   '📄',
};

export default function MemoryLog() {
  const [entries, setEntries] = useState<MemoryEntry[]>(initialMemory);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startEdit = (e: MemoryEntry) => {
    setEditingId(e.id);
    setDraft(e.text);
  };
  const saveEdit = () => {
    if (!editingId) return;
    setEntries((es) => es.map((e) => (e.id === editingId ? { ...e, text: draft } : e)));
    setEditingId(null);
  };
  const remove = (id: string) => setEntries((es) => es.filter((e) => e.id !== id));

  return (
    <section className="memory">
      <div className="memory-head">
        <div>
          <div className="section-title">Memory Log</div>
          <div className="section-sub">{entries.length} signals captured · edit if Shadow got it wrong</div>
        </div>
      </div>

      <div className="memory-list">
        {entries.map((e) => (
          <div className={`memory-row memory-${e.source}`} key={e.id}>
            <div className="memory-icon" aria-hidden>{ICON[e.source]}</div>
            <div className="memory-body">
              <div className="memory-source-time">
                <span className="memory-source">{e.source}</span>
                <span className="memory-time">· {e.time}</span>
              </div>
              {editingId === e.id ? (
                <div className="memory-edit">
                  <input
                    className="memory-input"
                    value={draft}
                    onChange={(ev) => setDraft(ev.target.value)}
                    autoFocus
                    onKeyDown={(ev) => {
                      if (ev.key === 'Enter') saveEdit();
                      if (ev.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button className="btn-ghost" onClick={saveEdit}>Save</button>
                  <button className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="memory-text">{e.text}</div>
              )}
            </div>
            {editingId !== e.id && (
              <div className="memory-actions">
                <button className="icon-btn" onClick={() => startEdit(e)}>Edit</button>
                <button className="icon-btn" onClick={() => remove(e.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
