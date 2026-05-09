import { model } from '../mock/data';

export default function Profile() {
  const top = model.preferences.slice(0, 4);

  return (
    <section className="profile">
      <div className="section-head">
        <div>
          <div className="section-title">Your Model</div>
          <div className="section-sub">{model.confidence}% confidence · {model.signalsThisWeek.toLocaleString()} signals this week</div>
        </div>
      </div>

      <div className="profile-card">
        {top.map((p) => (
          <div className="pref-row" key={p.label}>
            <div className="pref-label">{p.label}</div>
            <div className="pref-track"><div className="pref-fill" style={{ width: `${p.value}%` }} /></div>
            <div className="pref-pct">{p.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
