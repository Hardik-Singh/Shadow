// Gemini Live session — bi-directional websocket with audio + video in, text out.
// Nothing here writes to disk. Transcripts and model turns are emitted as events;
// the caller (main.js) is responsible for forwarding them to memory + HUD.

const { EventEmitter } = require('events');
const WebSocket = require('ws');

const HOST = 'generativelanguage.googleapis.com';
const PATH = '/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
const MODEL = 'models/gemini-2.5-flash-live-preview';

const SYSTEM_INSTRUCTION = [
  'You are Shadow — an always-on observer for a venture capital partner.',
  'You receive their microphone (what they say while working) and frames of their screen.',
  'Default mode: stay quiet. Do not narrate. Do not greet.',
  'Speak ONLY when:',
  '  (a) the user types or speaks a direct question to you, OR',
  '  (b) you spot something that genuinely changes the picture (a clear contradiction, a missed risk, a sharp pattern match against their prior behavior).',
  'When you do speak: ONE short line. No preamble. No emojis. No quotes.',
].join('\n');

class LiveSession extends EventEmitter {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.ws = null;
    this.ready = false;
    this.closed = false;
    this.queue = [];
  }

  connect() {
    const url = `wss://${HOST}${PATH}?key=${encodeURIComponent(this.apiKey)}`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.on('open', () => {
      const setup = {
        setup: {
          model: MODEL,
          generationConfig: {
            responseModalities: ['TEXT'],
            temperature: 0.4,
          },
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          inputAudioTranscription: {},
        },
      };
      ws.send(JSON.stringify(setup));
    });

    ws.on('message', (raw) => this._onMessage(raw));
    ws.on('error', (e) => {
      this.emit('error', e);
    });
    ws.on('close', (code, reason) => {
      this.ready = false;
      this.closed = true;
      this.emit('closed', { code, reason: reason && reason.toString() });
    });
  }

  _onMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.setupComplete) {
      this.ready = true;
      this.emit('ready');
      // flush anything queued before setup completed
      const q = this.queue; this.queue = [];
      for (const item of q) this._sendRaw(item);
      return;
    }

    const sc = msg.serverContent;
    if (!sc) return;

    // user mic transcript — what they actually said
    const inputT = sc.inputTranscription;
    if (inputT && typeof inputT.text === 'string' && inputT.text.trim()) {
      this.emit('transcript', inputT.text.trim());
    }

    // model's reply text
    const turn = sc.modelTurn;
    if (turn && Array.isArray(turn.parts)) {
      const text = turn.parts.map((p) => p.text || '').join('').trim();
      if (text) this.emit('model_response', text);
    }

    if (sc.turnComplete) this.emit('turn_complete');
  }

  _sendRaw(obj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!this.ready) { this.queue.push(obj); return; }
    try { this.ws.send(JSON.stringify(obj)); } catch (e) { this.emit('error', e); }
  }

  sendAudio(b64Pcm16k) {
    this._sendRaw({
      realtimeInput: {
        mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: b64Pcm16k }],
      },
    });
  }

  sendFrame(b64Jpeg) {
    this._sendRaw({
      realtimeInput: {
        mediaChunks: [{ mimeType: 'image/jpeg', data: b64Jpeg }],
      },
    });
  }

  // Mid-session user question. Triggers a model turn.
  injectPrompt(text) {
    if (!text) return;
    this._sendRaw({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true,
      },
    });
  }

  // Scene-setting context: passes background info (e.g. Hyperspell-derived
  // partner/firm memory) into the session without expecting a reply. The
  // model picks this up on its next turn, when it actually has a reason to
  // speak.
  injectSystemContext(text) {
    if (!text) return;
    this._sendRaw({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text: '[background context — do not reply]\n' + text }] }],
        turnComplete: false,
      },
    });
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
  }
}

module.exports = { LiveSession };
