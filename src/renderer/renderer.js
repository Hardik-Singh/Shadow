// ===== ELEMENTS =====
const hudEl = document.querySelector('.hud');
const muteBtn = document.getElementById('mute');
const pauseBtn = document.getElementById('pause');
const dotEl = document.getElementById('dot');
const bars = Array.from(document.querySelectorAll('#meter span'));
const sessionEl = document.getElementById('session');
const seeingEl = document.getElementById('seeing');
const seeingRow = document.getElementById('seeing-row');
const hearingEl = document.getElementById('hearing');
const hearingRow = document.getElementById('hearing-row');
const signalEl = document.getElementById('signal');
const writesEl = document.getElementById('writes');
const thoughtsEl = document.getElementById('thoughts');
const pillsEl = document.getElementById('pills');
const artifactsEl = document.getElementById('artifacts');
const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt');

// ===== MIC =====
// Default to muted so other audio tools (Wispr Flow, etc.) keep working.
// We don't even open the mic stream until the user unmutes, so we don't hold a lock.
let muted = true;
let stream = null;
let micStarted = false;
const SPEAKING_THRESHOLD = 0.04;
const SILENCE_HOLD_MS = 500;
let speakingNow = false;

async function startMic() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (err) {
    console.error('mic error', err);
    return;
  }
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.6;
  source.connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let lastSpokeAt = 0;

  // ---- PCM 16kHz mono pump to Gemini Live ----
  // ScriptProcessor is deprecated but still works in Electron and avoids the
  // worklet-module-loading dance. Buffer size 4096 ≈ 85ms at native SR.
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const inSR = ctx.sampleRate;
  const outSR = 16000;
  const ratio = inSR / outSR;
  source.connect(proc);
  // Must connect to destination (silently) for ScriptProcessor to fire.
  const sink = ctx.createGain();
  sink.gain.value = 0;
  proc.connect(sink);
  sink.connect(ctx.destination);

  proc.onaudioprocess = (e) => {
    if (paused || muted || !window.shadow || !window.shadow.sendAudio) return;
    const input = e.inputBuffer.getChannelData(0);
    const outLen = Math.floor(input.length / ratio);
    const out = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const s = input[Math.floor(i * ratio)];
      const c = Math.max(-1, Math.min(1, s));
      out[i] = c < 0 ? c * 0x8000 : c * 0x7fff;
    }
    // base64 the Int16Array bytes
    const bytes = new Uint8Array(out.buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    window.shadow.sendAudio(btoa(bin));
  };

  function tick() {
    if (!muted) {
      analyser.getFloatTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
      const rms = Math.sqrt(sumSq / buf.length);
      const level = Math.min(1, rms * 6);
      const now = performance.now();
      if (rms > SPEAKING_THRESHOLD) lastSpokeAt = now;
      speakingNow = now - lastSpokeAt < SILENCE_HOLD_MS;

      const n = bars.length;
      const center = (n - 1) / 2;
      for (let i = 0; i < n; i++) {
        const distFromCenter = Math.abs(i - center) / center;
        const shape = 1 - distFromCenter * 0.6;
        const h = Math.max(3, level * shape * 14);
        bars[i].style.height = h + 'px';
        bars[i].style.opacity = 0.35 + level * 0.65;
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
}

muteBtn.addEventListener('click', () => {
  muted = !muted;
  hudEl.classList.toggle('muted', muted);
  dotEl.classList.toggle('muted', muted);
  muteBtn.title = muted ? 'Unmute mic' : 'Mute mic';
  if (!muted && !micStarted) {
    micStarted = true;
    startMic();
    startSpeechRecognition();
    return;
  }
  if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !muted));
});

// ===== SPEECH RECOGNITION → memory voice writes =====
// Chromium's webkitSpeechRecognition is free and good enough for the demo.
// Final transcripts go to main via window.shadow.voiceUtterance(), which the
// memory layer turns into a `voice` Memory in Hyperspell (partner + firm vault).
function startSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    console.warn('SpeechRecognition unavailable — voice memories disabled');
    return;
  }
  const recog = new SR();
  recog.continuous = true;
  recog.interimResults = false;
  recog.lang = 'en-US';
  recog.onresult = (e) => {
    if (paused) return;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (!r.isFinal) continue;
      const text = (r[0].transcript || '').trim();
      const confidence = r[0].confidence || 0;
      if (text && window.shadow && window.shadow.voiceUtterance) {
        window.shadow.voiceUtterance(text, confidence);
      }
    }
  };
  recog.onerror = (e) => console.warn('SR error', e.error);
  recog.onend = () => { if (!muted) try { recog.start(); } catch {} };
  try { recog.start(); } catch (err) { console.warn('SR start failed', err); }
}

// Reflect muted-by-default visual state on launch.
hudEl.classList.add('muted');
dotEl.classList.add('muted');
muteBtn.title = 'Unmute mic';

// ===== PAUSE (kills LLM calls everywhere — vision, live, suggest, profile) =====
let paused = false;
function applyPaused(next) {
  paused = !!next;
  hudEl.classList.toggle('paused', paused);
  pauseBtn.title = paused ? 'Resume LLM processing' : 'Pause LLM processing';
  if (paused) {
    signalEl.textContent = 'paused — no LLM calls';
  } else if (signalEl.textContent === 'paused — no LLM calls') {
    signalEl.textContent = 'resuming…';
  }
  if (window.shadow && window.shadow.setPaused) window.shadow.setPaused(paused);
}
pauseBtn.addEventListener('click', () => applyPaused(!paused));

// ===== COLLAPSE / EXPAND CARDS =====
const COLLAPSE_KEY = 'shadow.collapsed.';
document.querySelectorAll('.card-head[data-toggle]').forEach((head) => {
  const id = head.dataset.toggle;
  const card = document.getElementById(id);
  if (!card) return;
  // Restore persisted state.
  if (localStorage.getItem(COLLAPSE_KEY + id) === '1') card.classList.add('collapsed');
  head.addEventListener('click', (e) => {
    // Don't toggle when interacting with the inline mic meter inside the head.
    if (e.target.closest('#meter')) return;
    const next = !card.classList.contains('collapsed');
    card.classList.toggle('collapsed', next);
    localStorage.setItem(COLLAPSE_KEY + id, next ? '1' : '0');
  });
});

// ===== SESSION TIMER =====
const sessionStart = Date.now();
function fmtSession(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return `${m}:${String(ss).padStart(2, '0')}`;
}
setInterval(() => { sessionEl.textContent = fmtSession(Date.now() - sessionStart); }, 1000);

function renderEmptySuggestions() {
  pillsEl.innerHTML = '<div class="pills-empty">listening for context…</div>';
}
renderEmptySuggestions();

// ===== MEMORY WRITES (driven by main process: distilled signals from SQLite +
// silent Hyperspell mirror for cross-session firm brain) =====
function pushWrite(verb, text, opts) {
  if (!writesEl) return;
  const empty = writesEl.querySelector('.empty');
  if (empty) empty.remove();
  const li = document.createElement('li');
  if (opts && opts.historical) li.classList.add('historical');
  li.innerHTML = `<span class="verb">${verb}:</span>${text}`;
  writesEl.prepend(li);
  while (writesEl.children.length > 12) writesEl.lastChild.remove();
}

if (window.shadow && window.shadow.onWrite) {
  window.shadow.onWrite((row) => {
    if (!row || !row.text) return;
    pushWrite(row.verb || 'saving', row.text, { historical: !!row.historical });
  });
}

// ===== LIVE THOUGHTS (driven by Gemini Live model responses) =====
function pushThought(text, sources) {
  const li = document.createElement('li');
  const textEl = document.createElement('span');
  textEl.textContent = text;
  li.appendChild(textEl);
  if (sources && (sources.label || (Array.isArray(sources.tags) && sources.tags.length))) {
    const tag = document.createElement('span');
    tag.className = 'context-tag';
    tag.textContent = sources.label || sources.tags.join(' · ');
    li.appendChild(document.createElement('br'));
    li.appendChild(tag);
  }
  thoughtsEl.prepend(li);
  while (thoughtsEl.children.length > 5) thoughtsEl.lastChild.remove();
}
if (window.shadow && window.shadow.onThought) {
  window.shadow.onThought((t) => {
    if (!t) return;
    if (typeof t === 'string') return;
    if (t.text && t.source === 'vision') {
      pushThought(t.text, t.sources);
      if (t.proactive && thoughtsEl.firstChild) thoughtsEl.firstChild.classList.add('proactive');
    }
  });
}

// ===== WATCHING (real signals only — rows hidden until first real text) =====
let seeingBucket = '';

function classifySeeing(text) {
  const s = String(text || '').toLowerCase();
  if (/(how shadow sees you|shadow partner profile)/.test(s)) return 'profile';
  if (/(linkedin|arlan|rakhmetzhanov)/.test(s) && !/(deck|\.pdf|slide)/.test(s)) return 'linkedin-arlan';
  if (/(nozomio|arlan|rakhmetzhanov)/.test(s) && /(deck|\.pdf|slide)/.test(s)) return 'deck-nozomio';
  if (/(nozomio|team verdicts|partner verdicts|firm verdict|against|for)/.test(s)) return 'firm-nozomio';
  return '';
}

function setSeeing(text, opts = {}) {
  const bucket = classifySeeing(text);
  if (!opts.force) {
    if (!bucket) return;
    if (bucket === seeingBucket) return;
  }
  seeingBucket = bucket || seeingBucket;
  seeingEl.textContent = text;
  seeingRow.classList.remove('hidden');
  seeingEl.classList.add('flash');
  setTimeout(() => seeingEl.classList.remove('flash'), 600);
}

if (window.shadow) {
  window.shadow.onSeeing((t) => {
    if (!t) return;
    setSeeing(t);
  });
  window.shadow.onHearing((t) => {
    if (!t) return;
    hearingEl.textContent = `"${t}"`;
    hearingRow.classList.remove('hidden');
  });
  window.shadow.onStatus((t) => { signalEl.textContent = t; });
}

// ===== SCREEN CAPTURE → Gemini Live =====
async function startScreenCapture() {
  if (!window.shadow) return;
  try {
    const sources = await window.shadow.getSources();
    if (!sources || !sources.length) { console.warn('no screen sources'); return; }
    const sourceId = sources[0].id;
    const dispStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          maxWidth: 1920,
          maxHeight: 1080,
        },
      },
    });
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = dispStream;
    await video.play();

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const MAX_EDGE = 1024;

    setInterval(() => {
      if (paused) return;
      const vw = video.videoWidth, vh = video.videoHeight;
      if (!vw || !vh) return;
      const scale = Math.min(1, MAX_EDGE / Math.max(vw, vh));
      const w = Math.round(vw * scale);
      const h = Math.round(vh * scale);
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      const comma = dataUrl.indexOf(',');
      if (comma < 0) return;
      window.shadow.sendFrame(dataUrl.slice(comma + 1));
    }, 1000);
  } catch (err) {
    console.error('screen capture error', err);
    signalEl.textContent = 'screen capture denied — grant permission';
  }
}
startScreenCapture();

// ===== DASHBOARD BRIDGE =====
function openDashboard(qs) {
  if (window.shadow && window.shadow.openInDashboard) {
    window.shadow.openInDashboard(qs || '');
  }
}

// ===== ARTIFACTS (driven entirely by main's `signal:artifact` events) =====
function addArtifact(a) {
  const li = document.createElement('li');
  li.className = 'new clickable';
  li.title = 'open in firm brain';
  const [primary, secondary] = String(a.name || 'artifact').split(' · ');
  li.innerHTML = `
    <div class="artifact-main">
      <span class="artifact-dot"></span>
      <span class="artifact-copy">
        <span class="artifact-title">${escapeHtml(primary || 'artifact')}</span>
        <span class="artifact-subtitle">${escapeHtml(secondary || 'firm brain')}</span>
      </span>
    </div>
    <span class="tag">${escapeHtml(a.tag || 'new')}</span>
  `;
  li.addEventListener('click', () => openDashboard(a.route || ''));
  const empty = artifactsEl.querySelector('.empty');
  if (empty) empty.remove();
  artifactsEl.prepend(li);
  while (artifactsEl.children.length > 12) artifactsEl.lastChild.remove();
}

// ===== PROMPT — one input, two effects:
//   1. setFocus: reweights the per-frame screen captioner toward this topic
//   2. ask: injects a one-shot user turn into the live Gemini session for an answer
promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = promptInput.value.trim();
  if (!v) return;
  pushThought(`you: ${v}`);
  if (demoNozomioState.awaitingDeckReaction && /\b(like|liked|love|interesting|good|yes|bullish)\b/i.test(v)) {
    demoNozomioState.awaitingDeckReaction = false;
    pushThought('got it. i can turn that read into the three useful artifacts.');
    renderDemoPills(NOZOMIO_DECK_SUGGESTIONS);
    pushWrite('ready', 'ic memo + meeting prep + pass email queued from deck reaction');
    promptInput.value = '';
    promptInput.placeholder = 'ask shadow...';
    return;
  }
  pushWrite('focus', v);
  if (window.shadow && window.shadow.setFocus) window.shadow.setFocus(v);
  if (window.shadow && window.shadow.ask) window.shadow.ask(v);
  promptInput.value = '';
  promptInput.placeholder = `watching for: ${v}`;
});

// ===== REAL SUGGESTIONS + ARTIFACTS (memory layer → HUD) =====
// When the suggest engine emits real suggestions, override the static pills.
// Clicks invoke the action handler, which reads from Hyperspell, calls the LLM,
// and emits an `artifact` event that we render as a card.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===== NOZOMIO STAGE DEMO =====
const demoNozomioState = {
  timers: [],
  firedStages: new Set(),
  artifacts: new Set(),
  awaitingDeckReaction: false,
};

const _slugFor = (id, type) => (window.nozomioArtifactSlug ? window.nozomioArtifactSlug(id, type) : `${id}-${type}`);
const NOZOMIO_DECK_SUGGESTIONS = [
  { id: 'nozomio-memo', label: 'ic memo', artifactId: 'n7', name: 'Nozomio · ic memo', route: '/artifact/' + _slugFor('n7', 'Investment Memo'), delayMs: 2200 },
  { id: 'nozomio-meeting-prep', label: 'meeting prep doc', artifactId: 'n10', name: 'Nozomio · meeting prep doc', route: '/artifact/' + _slugFor('n10', 'Meeting Prep'), delayMs: 1800 },
  { id: 'nozomio-email', label: 'pass / follow-up email', artifactId: 'n8', name: 'Nozomio · pass email', route: '/artifact/' + _slugFor('n8', 'Pass Email'), delayMs: 120 },
];

function clearDemoTimers() {
  for (const t of demoNozomioState.timers) clearTimeout(t);
  demoNozomioState.timers = [];
}

function addDemoArtifact({ artifactId, name, tag, route }) {
  if (!artifactId || demoNozomioState.artifacts.has(artifactId)) return;
  demoNozomioState.artifacts.add(artifactId);
  addArtifact({ name, tag: tag || 'NEW', route: route || `?artifact=${encodeURIComponent(artifactId)}` });
}

function renderDemoPills(suggestions) {
  pillsEl.innerHTML = suggestions
    .map((s) => `<button data-demo-id="${escapeHtml(s.id)}"><span class="pill-text"><span class="pill-label">${escapeHtml(s.label)}</span></span><span class="arrow">→</span></button>`)
    .join('');

  pillsEl.querySelectorAll('button[data-demo-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = suggestions.find((s) => s.id === btn.dataset.demoId);
      if (!item) return;
      btn.disabled = true;
      btn.classList.add('loading');
      const labelEl = btn.querySelector('.pill-label');
      if (labelEl) labelEl.textContent = 'generating...';
      pushWrite('action', `clicked "${item.label}"`);
      setTimeout(() => {
        btn.classList.remove('loading');
        if (labelEl) labelEl.textContent = 'created';
        addDemoArtifact({
          artifactId: item.artifactId,
          name: item.name,
          route: item.route,
        });
        pushWrite('artifact', `${item.name.replace('Nozomio · ', '')} · saved`);
        if (item.artifactId === 'n7') renderNozomioFirmPill();
      }, item.delayMs == null ? 1800 : item.delayMs);
    });
  });
}

function renderNozomioFirmPill() {
  const btn = document.createElement('button');
  btn.dataset.demoId = 'nozomio-firm';
  btn.innerHTML = '<span class="pill-text"><span class="pill-label">get shadows opinions</span><span class="reason">open firm vote</span></span><span class="arrow">→</span>';
  btn.addEventListener('click', () => openDashboard('/firm/nozomio'));
  pillsEl.appendChild(btn);
}

function applyNozomioDemoEvent(ev) {
  if (!ev) return;
  if (ev.action === 'seeing') {
    setSeeing(ev.text, { force: true });
  }
  if (ev.action === 'chat' || ev.action === 'thought') pushThought(ev.text);
  if (ev.action === 'awaitDeckReaction') demoNozomioState.awaitingDeckReaction = true;
  if (ev.action === 'write') pushWrite(ev.verb || 'note', ev.text);
  if (ev.action === 'artifact') addDemoArtifact({
    artifactId: ev.id,
    name: ev.name,
    tag: ev.tag,
    route: ev.route,
  });
  if (ev.action === 'suggestions') renderDemoPills(ev.suggestions || []);
}

function startNozomioDemoStage(stage) {
  const timelines = window.NOZOMIO_DEMO_TIMELINES || {};
  const events = timelines[`stage${stage}`];
  if (!Array.isArray(events) || demoNozomioState.firedStages.has(stage)) return;
  demoNozomioState.firedStages.add(stage);
  clearDemoTimers();
  signalEl.textContent = `watching nozomio · ${stage === 1 ? 'linkedin' : 'deck'}`;
  events.forEach((ev) => {
    const t = setTimeout(() => applyNozomioDemoEvent(ev), ev.atMs || 0);
    demoNozomioState.timers.push(t);
  });
}

if (window.shadow && window.shadow.onNozomioDemo) {
  window.shadow.onNozomioDemo((payload) => startNozomioDemoStage(payload && payload.stage));
}

if (window.shadow && window.shadow.onSuggestions) {
  window.shadow.onSuggestions((list) => {
    if (!window.SHADOW_SHOW_REAL_SUGGESTIONS) return;
    if (!Array.isArray(list) || list.length === 0) {
      renderEmptySuggestions();
      return;
    }
    pillsEl.innerHTML = list
      .map((s) => {
        const reason = s.reason ? `<span class="reason">${escapeHtml(s.reason)}</span>` : '';
        const cls = s.proactive ? ' class="proactive" title="proactive nudge"' : '';
        return `<button data-id="${escapeHtml(s.id)}"${cls}><span class="pill-text"><span class="pill-label">${escapeHtml(s.label)}</span>${reason}</span><span class="arrow">→</span></button>`;
      })
      .join('');
    pillsEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const labelEl = btn.querySelector('.pill-label');
        const original = labelEl.textContent;
        btn.disabled = true;
        labelEl.textContent = 'working…';
        pushWrite('action', `clicked "${original}"`);
        try {
          const r = await window.shadow.clickSuggestion(id);
          if (r && r.error) labelEl.textContent = 'failed: ' + r.error;
        } catch (err) {
          labelEl.textContent = 'failed';
          console.error(err);
        } finally {
          setTimeout(() => { btn.disabled = false; labelEl.textContent = original; }, 1500);
        }
      });
    });
  });
}

if (window.shadow && window.shadow.onArtifact) {
  window.shadow.onArtifact((a) => {
    if (!a || !a.kind) return;
    const co = (a.data && a.data.company) || 'untitled';
    const labels = {
      ic_memo: 'IC memo',
      sourcing_sheet: 'Sourcing sheet',
      founder_profile: 'Founder profile',
      market_check: 'Market check',
      flag: 'Flagged',
    };
    const artifactId = a.data && a.data.artifactId;
    const route = artifactId ? `?artifact=${encodeURIComponent(artifactId)}` : '';
    addArtifact({ name: `${co} · ${labels[a.kind] || a.kind}`, tag: 'NEW', route });
    const stats = a.data && a.data.sources;
    if (stats && stats.hyperspell_total != null) {
      pushWrite('synth', `${labels[a.kind] || a.kind}: drew ${stats.hyperspell_total} memories from hyperspell` + (stats.nia_total ? ` + ${stats.nia_total} from nia` : ''));
    }
  });
}
