import { useState } from 'react';
import { Deal } from '../../mock/data';
import VerdictPill from '../VerdictPill';

export default function FirmVerdict({ deal }: { deal: Deal }) {
  const [generated, setGenerated] = useState(false);

  if (!deal.firmVerdict) {
    return (
      <div className="firm-verdict-empty">
        Firm verdict not yet synthesized for this deal.
      </div>
    );
  }

  const v = deal.firmVerdict;

  if (!generated) {
    return (
      <div className="firm-verdict-cta">
        <div>
          <div className="section-title">Firm verdict</div>
          <div className="section-sub">synthesize across {deal.verdicts.length} shadows + firm memory</div>
        </div>
        <button className="btn-primary big" onClick={() => setGenerated(true)}>
          Generate firm verdict →
        </button>
      </div>
    );
  }

  return (
    <div className="firm-verdict">
      <div className="firm-verdict-head">
        <div>
          <div className="section-title">Firm verdict</div>
          <div className="section-sub">synthesized · {deal.consensus}% consensus</div>
        </div>
        <VerdictPill verdict={v.call} />
      </div>

      <div className="firm-verdict-line">{v.consensus}</div>

      <div className="firm-verdict-grid">
        <div>
          <div className="firm-verdict-label">Strongest for</div>
          <ul className="signal-list signal-good">
            {v.forSignals.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
        <div>
          <div className="firm-verdict-label">Strongest against</div>
          <ul className="signal-list signal-bad">
            {v.againstSignals.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </div>
      </div>

      {v.historicalMatch && (
        <div className="firm-historical">
          <div className="firm-verdict-label">Historical match in firm memory</div>
          <div>
            <strong>{v.historicalMatch.company}</strong> ({v.historicalMatch.year}) — {v.historicalMatch.outcome}
          </div>
        </div>
      )}

      <div className="firm-recommendation">
        <div className="firm-verdict-label">Recommended next action</div>
        <div>{v.recommendation}</div>
      </div>
    </div>
  );
}
