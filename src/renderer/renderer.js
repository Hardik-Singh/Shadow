const hudEl = document.querySelector('.hud');
const statusEl = document.getElementById('status');
const muteBtn = document.getElementById('mute');
const bars = Array.from(document.querySelectorAll('#meter span'));

const SPEAKING_THRESHOLD = 0.04;
const SILENCE_HOLD_MS = 500;

let muted = false;
let stream = null;

async function start() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (err) {
    statusEl.textContent = 'mic blocked';
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

muteBtn.addEventListener('click', () => {
  muted = !muted;
  hudEl.classList.toggle('muted', muted);
  document.getElementById('dot').classList.toggle('muted', muted);
  muteBtn.title = muted ? 'Unmute mic' : 'Mute mic';
  if (stream) stream.getAudioTracks().forEach((t) => (t.enabled = !muted));
});

start();
