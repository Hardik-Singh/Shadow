import { useState } from 'react';
import { firmQueryAnswer } from '../../mock/data';

export default function FirmQuery() {
  const [value, setValue] = useState('');
  const [submittedQ, setSubmittedQ] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setSubmittedQ(q);
    setValue('');
  };

  return (
    <section className="firm-query">
      <div className="section-head">
        <div>
          <div className="section-title">Firm Query</div>
          <div className="section-sub">
            query the firm's collective memory — every shadow, every deal, every year
          </div>
        </div>
      </div>

      <form className="ask-prompt firm-prompt" onSubmit={submit}>
        <input
          className="ask-input"
          placeholder="Has this firm seen a deal like this before?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="ask-submit" type="submit">Ask Firm</button>
      </form>

      {submittedQ && (
        <div className="firm-answer">
          <div className="q">
            <span className="q-label">Q</span>
            <span>{submittedQ}</span>
          </div>
          <div className="a">
            <span className="a-label">◈</span>
            <span>{firmQueryAnswer.body}</span>
          </div>
          <div className="firm-cited">
            <div className="firm-cited-label">drawn from</div>
            <ul>
              {firmQueryAnswer.cited.map((c) => (
                <li key={c.who}>
                  <span className="firm-cited-who">{c.who}</span>
                  <span className="firm-cited-detail">{c.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
