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
const modeBtn = document.getElementById('mode');
const modeLabel = document.getElementById('mode-label');
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

// ===== MODES =====
// Mode is just a label/context hint forwarded to main. Suggestions and
// artifacts come from the backend (suggest engine + action handlers); no
// hardcoded per-mode defaults live in the renderer.
const MODES = ['VC', 'HF', 'PE', 'IB'];
let modeIdx = 0;

function renderModeLabel() {
  modeLabel.textContent = MODES[modeIdx];
}

function renderEmptySuggestions() {
  pillsEl.innerHTML = '<div class="pills-empty">listening for context…</div>';
}
renderEmptySuggestions();

modeBtn.addEventListener('click', () => {
  modeIdx = (modeIdx + 1) % MODES.length;
  renderModeLabel();
  if (window.shadow && window.shadow.setMode) window.shadow.setMode(MODES[modeIdx]);
});
renderModeLabel();

// ===== MEMORY WRITES (driven by main process: distilled signals from SQLite +
// silent Hyperspell mirror for cross-session firm brain) =====
function pushWrite(verb, text, opts) {
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
    if (typeof t === 'string') pushThought(t);
    else if (t.text) {
      pushThought((t.proactive ? '💭 ' : '') + t.text, t.sources);
      if (t.proactive && thoughtsEl.firstChild) thoughtsEl.firstChild.classList.add('proactive');
    }
  });
}

// ===== WATCHING (real signals only — rows hidden until first real text) =====
if (window.shadow) {
  window.shadow.onSeeing((t) => {
    if (!t) return;
    seeingEl.textContent = t;
    seeingRow.classList.remove('hidden');
    seeingEl.classList.add('flash');
    setTimeout(() => seeingEl.classList.remove('flash'), 600);
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
  li.title = 'open in dashboard';
  li.innerHTML = `<span>${a.name}</span><span class="tag">${a.tag || ''}</span>`;
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

if (window.shadow && window.shadow.onSuggestions) {
  window.shadow.onSuggestions((list) => {
    if (!Array.isArray(list) || list.length === 0) {
      renderEmptySuggestions();
      return;
    }
    pillsEl.innerHTML = list
      .map((s) => {
        const reason = s.reason ? `<span class="reason">${escapeHtml(s.reason)}</span>` : '';
        const cls = s.proactive ? ' class="proactive" title="proactive nudge"' : '';
        const prefix = s.proactive ? '✨ ' : '';
        return `<button data-id="${escapeHtml(s.id)}"${cls}><span class="pill-text"><span class="pill-label">${prefix}${escapeHtml(s.label)}</span>${reason}</span><span class="arrow">→</span></button>`;
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
    addArtifact({ name: `${co} · ${labels[a.kind] || a.kind}`, tag: 'NEW' });
    const stats = a.data && a.data.sources;
    if (stats && stats.hyperspell_total != null) {
      pushWrite('synth', `${labels[a.kind] || a.kind}: drew ${stats.hyperspell_total} memories from hyperspell` + (stats.nia_total ? ` + ${stats.nia_total} from nia` : ''));
    }
  });
}
