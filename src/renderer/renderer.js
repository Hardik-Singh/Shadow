// ===== ELEMENTS =====
const hudEl = document.querySelector('.hud');
const muteBtn = document.getElementById('mute');
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
    if (muted || !window.shadow || !window.shadow.sendAudio) return;
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
    return;
  }
  if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !muted));
});

// Reflect muted-by-default visual state on launch.
hudEl.classList.add('muted');
dotEl.classList.add('muted');
muteBtn.title = 'Unmute mic';

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
const MODES = ['VC', 'HF', 'PE', 'IB'];
const MODE_DETAILS = {
  VC: {
    suggestions: [
      'look up CTO on github',
      'check TAM comparables',
      'generate sourcing sheet',
    ],
  },
  HF: {
    suggestions: [
      'summarize earnings call',
      'compare to last quarter',
      'draft trade note',
    ],
  },
  PE: {
    suggestions: [
      'build LBO sketch',
      'summarize CIM',
      'flag mgmt risks',
    ],
  },
  IB: {
    suggestions: [
      'build comp table',
      'pull precedents',
      'draft pitch section',
    ],
  },
};
let modeIdx = 0;

function renderMode() {
  const code = MODES[modeIdx];
  const m = MODE_DETAILS[code];
  modeLabel.textContent = code;
  pillsEl.innerHTML = m.suggestions
    .map((t) => `<button><span>${t}</span><span class="arrow">→</span></button>`)
    .join('');
  pillsEl.querySelectorAll('button').forEach((btn, i) => {
    btn.addEventListener('click', () => onSuggestion(m.suggestions[i]));
  });
}

modeBtn.addEventListener('click', () => {
  modeIdx = (modeIdx + 1) % MODES.length;
  renderMode();
  pushWrite('mode', `switched to ${MODES[modeIdx]}`);
});

renderMode();

// ===== MEMORY WRITES (live feed) =====
const WRITES_POOL = [
  ['saving', 'skeptical of short cofounder relationships'],
  ['saving', 'prefers technical founders with prior exits'],
  ['updating', 'TAM sensitivity weight +12%'],
  ['saving', 'B2B infra > consumer for early-stage'],
  ['flagging', '"feels expensive" said 3x today'],
  ['saving', 'dwell time on team slide > 30s = positive'],
  ['updating', 'consumer-play weight -5%'],
  ['saving', 'distrusts unverified TAM claims'],
  ['linking', 'this CTO ↔ Stripe alumnus pattern'],
  ['saving', 'asks about CAC before TAM (priority order)'],
];
function pushWrite(verb, text) {
  const li = document.createElement('li');
  li.innerHTML = `<span class="verb">${verb}:</span>${text}`;
  writesEl.prepend(li);
  while (writesEl.children.length > 12) writesEl.lastChild.remove();
}
let writeIdx = 0;
setInterval(() => {
  const [verb, text] = WRITES_POOL[writeIdx % WRITES_POOL.length];
  pushWrite(verb, text);
  writeIdx++;
}, 7000);
// seed a couple immediately
pushWrite('saving', 'session started — VC mode');
setTimeout(() => pushWrite('saving', 'observing pitch deck: Acme Inc'), 800);

// ===== LIVE THOUGHTS (stream-of-consciousness) =====
const THOUGHTS_POOL = [
  'this CTO profile is the kind they usually like — ex-Stripe pattern',
  'TAM number feels round. round = made up.',
  'they spent 32s on the team slide. that\'s positive.',
  'cofounders met 8 months ago — partner always flags this',
  'CAC table is missing payback period. they\'ll ask.',
  'B2B infra · their highest-conviction sector this quarter',
  'no mention of competitors in the deck — suspicious or confident?',
  'partner muttered "feels expensive" — third time today',
  'reviewing the founder\'s github · 340 commits last 90 days',
  'cross-referencing this team to Series A precedents',
  'this looks adjacent to a deal they passed on in March',
  'consumer-play weight is low · this one is B2B · alignment good',
  'no churn metrics. they always ask about churn.',
  'thesis match: technical founder + B2B infra + early-stage = strong',
];
function pushThought(text) {
  const li = document.createElement('li');
  li.textContent = text;
  thoughtsEl.prepend(li);
  while (thoughtsEl.children.length > 5) thoughtsEl.lastChild.remove();
}
let thoughtIdx = 0;
setInterval(() => {
  pushThought(THOUGHTS_POOL[thoughtIdx % THOUGHTS_POOL.length]);
  thoughtIdx++;
}, 5200);
pushThought(THOUGHTS_POOL[0]);
thoughtIdx = 1;

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

// suggestion text → dashboard route. Anything not mapped opens the home page.
const SUGGESTION_ROUTE = {
  'look up CTO on github':   '?artifact=a3', // Helix founder background
  'check TAM comparables':   '?artifact=a1', // Acme IC memo (TAM section)
  'generate sourcing sheet': '?artifact=a2', // Mira sourcing sheet
  'summarize earnings call': '?view=firm',
  'compare to last quarter': '?view=firm',
  'draft trade note':        '?view=firm',
  'build LBO sketch':        '?view=firm',
  'summarize CIM':           '?view=firm',
  'flag mgmt risks':         '?view=firm',
  'build comp table':        '?view=firm',
  'pull precedents':         '?view=firm',
  'draft pitch section':     '?view=firm',
};

// ===== ARTIFACTS =====
// each artifact carries a route so clicking it deep-links into the dashboard
const artifacts = [];

function addArtifact(a) {
  artifacts.unshift(a);
  const li = document.createElement('li');
  li.className = 'new clickable';
  li.title = 'open in dashboard';
  li.innerHTML = `<span>${a.icon}</span><span>${a.name}</span><span class="tag">${a.tag}</span>`;
  li.addEventListener('click', () => openDashboard(a.route || ''));
  if (artifactsEl.querySelector('.empty')) artifactsEl.innerHTML = '';
  artifactsEl.prepend(li);
  while (artifactsEl.children.length > 12) artifactsEl.lastChild.remove();
}

// expose for future capture/DB pipeline to call: window.shadow.addArtifact(...)
window.addArtifact = addArtifact;

// seed a couple of pre-baked artifacts so the dashboard handoff is visible immediately.
// these match the dashboard ids 1:1 — clicking opens the drawer for that artifact.
addArtifact({ icon: '📝', name: 'IC memo · Acme Inc',           tag: 'VC',    route: '?artifact=a1'  });
addArtifact({ icon: '🔎', name: 'Founder · Helix Compute',      tag: 'VC',    route: '?artifact=a3'  });
addArtifact({ icon: '📊', name: 'Sourcing sheet · Mira Health',  tag: 'VC',    route: '?artifact=a2'  });
addArtifact({ icon: '✉',  name: 'Email · Series A intro (Acme)', tag: 'EMAIL', route: '?artifact=a11' });
addArtifact({ icon: '#',  name: 'Slack · #deals-infra (Helix)',  tag: 'SLACK', route: '?artifact=a12' });

// ===== SUGGESTION CLICK =====
function onSuggestion(text) {
  pushWrite('action', `clicked "${text}"`);
  const route = SUGGESTION_ROUTE[text] || '';
  addArtifact({ icon: '⚡', name: text, tag: MODES[modeIdx], route });
  openDashboard(route);
}

// ===== PROMPT — sets the focus the live feed should weight toward =====
promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = promptInput.value.trim();
  if (!v) return;
  pushWrite('focus', v);
  if (window.shadow && window.shadow.setFocus) window.shadow.setFocus(v);
  promptInput.value = '';
  promptInput.placeholder = `watching for: ${v}`;
});
