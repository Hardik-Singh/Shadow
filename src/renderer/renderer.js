// ─── DOM refs ──────────────────────────────────────────────────────────
const hudEl = document.getElementById('hud');
const statusEl = document.getElementById('status');
const muteBtn = document.getElementById('mute');
const bars = Array.from(document.querySelectorAll('#meter span'));
const liveScreen = document.getElementById('live-screen');
const liveVoice = document.getElementById('live-voice');
const profileBars = document.getElementById('profile-bars');
const confEl = document.getElementById('conf');
const sigCountEl = document.getElementById('sig-count');
const sugList = document.getElementById('suggestion-list');
const artList = document.getElementById('artifact-list');
const dropzone = document.getElementById('dropzone');
const cardOverlay = document.getElementById('card-overlay');
const cardBody = document.getElementById('card-body');
const cardClose = document.getElementById('card-close');

// ─── Mic VU + Speech recognition ───────────────────────────────────────
const SPEAKING_THRESHOLD = 0.04;
const SILENCE_HOLD_MS = 500;
let muted = false;
let stream = null;

async function startMic() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (err) {
    statusEl.textContent = 'mic blocked';
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
    if (muted) {
      statusEl.textContent = 'muted';
    } else {
      analyser.getFloatTimeDomainData(buf);
      let sumSq = 0;
      for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
      const rms = Math.sqrt(sumSq / buf.length);
      const level = Math.min(1, rms * 6);
      const now = performance.now();
      if (rms > SPEAKING_THRESHOLD) lastSpokeAt = now;
      const speaking = now - lastSpokeAt < SILENCE_HOLD_MS;
      statusEl.textContent = speaking ? 'listening' : 'watching';
      const n = bars.length;
      const center = (n - 1) / 2;
      for (let i = 0; i < n; i++) {
        const distFromCenter = Math.abs(i - center) / center;
        const shape = 1 - distFromCenter * 0.6;
        const h = Math.max(3, level * shape * 22);
        bars[i].style.height = h + 'px';
        bars[i].style.opacity = 0.35 + level * 0.65;
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
}

function startSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    console.warn('SpeechRecognition unavailable in this Electron build — voice ingest disabled');
    return;
  }
  const recog = new SR();
  recog.continuous = true;
  recog.interimResults = false;
  recog.lang = 'en-US';
  recog.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (!r.isFinal) continue;
      const text = (r[0].transcript || '').trim();
      const confidence = r[0].confidence || 0;
      if (text) {
        liveVoice.textContent = '"' + text + '"';
        if (window.shadow) window.shadow.voiceUtterance(text, confidence);
      }
    }
  };
  recog.onerror = (e) => console.warn('SR error', e.error);
  recog.onend = () => {
    if (!muted) try { recog.start(); } catch {}
  };
  try { recog.start(); } catch (err) { console.warn('SR start failed', err); }
}

muteBtn.addEventListener('click', () => {
  muted = !muted;
  hudEl.classList.toggle('muted', muted);
  document.getElementById('dot').classList.toggle('muted', muted);
  muteBtn.title = muted ? 'Unmute mic' : 'Mute mic';
  if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !muted));
});

startMic();
startSpeechRecognition();

// ─── Bus subscriptions ─────────────────────────────────────────────────
if (window.shadow) {
  window.shadow.onSignal((s) => {
    if (s.type === 'screen') liveScreen.textContent = s.content;
    if (s.type === 'voice') liveVoice.textContent = '"' + s.content + '"';
  });

  window.shadow.onProfile((p) => {
    profileBars.innerHTML = '';
    for (const c of p.categories || []) {
      const row = document.createElement('div');
      row.className = 'pbar';
      const fillW = Math.round((c.score || 0) * 100);
      row.innerHTML = `<div class="pbar-track"><div class="pbar-fill" style="width:${fillW}%"></div></div><div class="pbar-label">${c.label}</div>`;
      profileBars.appendChild(row);
    }
    confEl.textContent = Math.round((p.confidence || 0) * 100) + '%';
    sigCountEl.textContent = p.signal_count || 0;
  });

  window.shadow.onSuggestions((list) => {
    sugList.innerHTML = '';
    for (const s of list) {
      const btn = document.createElement('button');
      btn.className = 'sug';
      btn.textContent = s.label + ' →';
      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = 'working…';
        const res = await window.shadow.clickSuggestion(s.id);
        if (res && res.error) {
          btn.textContent = 'failed: ' + res.error;
          btn.disabled = false;
        }
      };
      sugList.appendChild(btn);
    }
    if (!list.length) sugList.innerHTML = '<div class="empty">waiting for context…</div>';
  });

  window.shadow.onArtifact((a) => {
    showCard(a);
    const item = document.createElement('div');
    item.className = 'art-item';
    item.textContent = artifactLabel(a);
    item.onclick = () => showCard(a);
    artList.prepend(item);
  });
}

// ─── File drop ─────────────────────────────────────────────────────────
function preventAndHover(e, on) {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.toggle('drag-over', !!on);
}
['dragenter', 'dragover'].forEach((ev) =>
  document.addEventListener(ev, (e) => preventAndHover(e, true))
);
['dragleave', 'drop'].forEach((ev) =>
  document.addEventListener(ev, (e) => preventAndHover(e, false))
);
document.addEventListener('drop', async (e) => {
  const fileList = e.dataTransfer && e.dataTransfer.files;
  if (!fileList || !fileList.length) return;
  const paths = [];
  for (const f of fileList) {
    const p = window.shadow && window.shadow.pathForFile ? window.shadow.pathForFile(f) : null;
    if (p) paths.push(p);
  }
  if (paths.length && window.shadow) {
    dropzone.textContent = `ingesting ${paths.length} file(s)…`;
    const result = await window.shadow.dropFiles(paths);
    const total = (result || []).reduce((a, r) => a + (r.chunks || 0), 0);
    dropzone.textContent = `ingested ${total} chunks · drop another`;
  }
});

// ─── Card overlay ──────────────────────────────────────────────────────
function artifactLabel(a) {
  const co = a.data && a.data.company ? a.data.company : '';
  switch (a.kind) {
    case 'ic_memo': return `📄 ${co} · IC memo`;
    case 'sourcing_sheet': return `📊 ${co} · sourcing sheet`;
    case 'founder_profile': return `👤 ${co} · founder profile`;
    case 'market_check': return `📈 ${co} · market check`;
    case 'flag': return `🏷 ${co} · flagged`;
    default: return `· ${a.kind}`;
  }
}

function renderArtifact(a) {
  const wrap = document.createElement('div');
  const head = document.createElement('div');
  head.className = 'card-head';
  head.textContent = artifactLabel(a).replace(/^\W+\s*/, '');
  wrap.appendChild(head);

  const body = a.data && (a.data.memo || a.data.sheet || a.data.card || a.data);
  const flags = (a.data && a.data.flags) || [];
  if (flags.length) {
    const f = document.createElement('div');
    f.className = 'card-flag';
    f.textContent = flags.join(' · ');
    wrap.appendChild(f);
  }
  const pre = document.createElement('pre');
  pre.className = 'card-pre';
  pre.textContent = JSON.stringify(body, null, 2);
  wrap.appendChild(pre);
  return wrap;
}

function showCard(a) {
  cardBody.innerHTML = '';
  cardBody.appendChild(renderArtifact(a));
  cardOverlay.classList.add('open');
}
cardClose.addEventListener('click', () => cardOverlay.classList.remove('open'));
cardOverlay.addEventListener('click', (e) => {
  if (e.target === cardOverlay) cardOverlay.classList.remove('open');
});
