import { useState } from 'react';
import { conversation, Exchange } from '../mock/data';

const NEW_ANSWER =
  'Based on your model: you\'d weight technical-founder strength + post-revenue + B2B distribution heavily. Without those three, you typically pass within the first 10 minutes. Top question to ask first: who is the CTO and how long have they known each other?';

export default function ChatYourShadow() {
  const [value, setValue] = useState('');
  const [thread, setThread] = useState<Exchange[]>(conversation);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setThread((t) => [
      { id: `q-${Date.now()}`, question: q, answer: NEW_ANSWER, time: 'just now' },
      ...t,
    ]);
    setValue('');
  };

  return (
    <section className="chat">
      <div className="section-head">
        <div>
          <div className="section-title">Chat with your Shadow</div>
          <div className="section-sub">your judgment, on demand</div>
        </div>
      </div>

      <form className="ask-prompt" onSubmit={submit}>
        <input
          className="ask-input"
          placeholder="What do I actually think about consumer deals?"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="ask-submit" type="submit">Ask</button>
      </form>

      <div className="thread">
        {thread.map((x) => (
          <div className="exchange" key={x.id}>
            <div className="q">
              <span className="q-label">Q</span>
              <span>{x.question}</span>
            </div>
            <div className="a">
              <span className="a-label">S</span>
              <span>{x.answer}</span>
            </div>
            <div className="exchange-time">{x.time}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
