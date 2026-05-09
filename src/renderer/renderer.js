// ===== ELEMENTS =====
const hudEl = document.querySelector('.hud');
const muteBtn = document.getElementById('mute');
const dotEl = document.getElementById('dot');
const bars = Array.from(document.querySelectorAll('#meter span'));
const sessionEl = document.getElementById('session');
const seeingEl = document.getElementById('seeing');
const hearingEl = document.getElementById('hearing');
const signalEl = document.getElementById('signal');
const writesEl = document.getElementById('writes');
const pillsEl = document.getElementById('pills');
const artifactsEl = document.getElementById('artifacts');
const modeBtn = document.getElementById('mode');
const modeLabel = document.getElementById('mode-label');
const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt');

// ===== MIC =====
let muted = false;
let stream = null;
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
  if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !muted));
});

startMic();

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
}, 4500);
// seed a couple immediately
pushWrite('saving', 'session started — VC mode');
setTimeout(() => pushWrite('saving', 'observing pitch deck: Acme Inc'), 800);

// ===== WATCHING (cycling mock screen + voice state) =====
const SEEING_POOL = [
  'team slide · Series A deck',
  'market size slide · scrolling fast',
  'CTO bio · LinkedIn open in tab',
  'financials tab · CAC table',
  'competitor matrix slide',
];
const HEARING_POOL = [
  '"i don\'t trust this CAC number"',
  '"hmm this TAM feels made up"',
  '"short cofounder relationship, flag that"',
  '"i wonder if they\'ve talked to stripe"',
  '"this team is actually really strong"',
];
const SIGNAL_POOL = [
  'capturing signal',
  'updating profile weights',
  'cross-referencing memory',
  'checking comparable deals',
  'idle — waiting for input',
];
let seeIdx = 0, hearIdx = 0, sigIdx = 0;
setInterval(() => { seeingEl.textContent = SEEING_POOL[++seeIdx % SEEING_POOL.length]; }, 6000);
setInterval(() => { if (!speakingNow) hearingEl.textContent = HEARING_POOL[++hearIdx % HEARING_POOL.length]; }, 5500);
setInterval(() => { signalEl.textContent = SIGNAL_POOL[++sigIdx % SIGNAL_POOL.length]; }, 3500);

// ===== ARTIFACTS =====
const artifacts = [];
const EMPTY_ARTIFACT_HTML = '<li class="empty">no artifacts yet — shadow will add them as you work</li>';

function addArtifact(a) {
  artifacts.unshift(a);
  const li = document.createElement('li');
  li.className = 'new';
  li.innerHTML = `<span>${a.icon}</span><span>${a.name}</span><span class="tag">${a.tag}</span>`;
  if (artifactsEl.querySelector('.empty')) artifactsEl.innerHTML = '';
  artifactsEl.prepend(li);
  while (artifactsEl.children.length > 12) artifactsEl.lastChild.remove();
}

// expose for future capture/DB pipeline to call: window.shadow.addArtifact(...)
window.addArtifact = addArtifact;

// ===== SUGGESTION CLICK =====
function onSuggestion(text) {
  pushWrite('action', `clicked "${text}"`);
  addArtifact({ icon: '⚡', name: text, tag: MODES[modeIdx] });
}

// ===== PROMPT =====
promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = promptInput.value.trim();
  if (!v) return;
  pushWrite('prompt', v);
  promptInput.value = '';
});
