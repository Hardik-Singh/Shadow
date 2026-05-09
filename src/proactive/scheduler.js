// In-process cron-style scheduler for proactive nudges.
//
// Today the suggest engine and memory layer are purely reactive — they
// only fire when a screen caption changes or a voice utterance lands.
// This module wakes Shadow up on a timer so it can surface fresh
// suggestions and pattern-detected thoughts even when the user is idle.
//
// All emissions ride existing channels: bus 'suggestions' for pills,
// bus 'thought' for soft nudges. Nothing new on the IPC surface.

const { randomUUID } = require('crypto');

let timers = [];
let started = false;

function withJitter(ms, jitter) {
  const delta = ms * jitter * (Math.random() * 2 - 1);
  return Math.max(1000, Math.round(ms + delta));
}

// setInterval that re-jitters between fires, with a single-flight guard.
function loop(name, baseMs, jitter, fn) {
  let inFlight = false;
  const tick = async () => {
    if (inFlight) return schedule();
    inFlight = true;
    try { await fn(); }
    catch (err) { console.warn(`[proactive] ${name} failed`, err && err.message); }
    finally { inFlight = false; schedule(); }
  };
  function schedule() {
    const t = setTimeout(tick, withJitter(baseMs, jitter));
    if (t.unref) t.unref();
    timers.push(t);
  }
  schedule();
}

function start({ suggest, bus, config, profile, MemoryRepo, extractCompany, reason }) {
  if (started) return;
  const cfg = (config && config.proactive) || {};
  if (cfg.enabled === false) {
    console.log('[proactive] disabled via config');
    return;
  }
  started = true;
  const jitter = typeof cfg.jitter === 'number' ? cfg.jitter : 0.1;

  // 1) Periodic re-rank of suggestions, independent of caption bumps.
  if (suggest && typeof suggest.runProactive === 'function' && cfg.suggestionsMs > 0) {
    loop('suggestions', cfg.suggestionsMs, jitter, () => suggest.runProactive());
  }

  // 2) Memory-pattern scan: look for repeated company mentions in the
  //    recent buffer, emit a 'thought' nudging an action.
  if (bus && MemoryRepo && cfg.memoryScanMs > 0) {
    loop('memoryScan', cfg.memoryScanMs, jitter, async () => {
      let rows = [];
      try { rows = MemoryRepo.list({ limit: 30 }) || []; } catch { return; }
      if (!rows.length) return;
      const counts = new Map();
      for (const r of rows) {
        const co = extractCompany ? extractCompany(r.text || '') : null;
        if (!co) continue;
        counts.set(co, (counts.get(co) || 0) + 1);
      }
      let top = null;
      for (const [co, n] of counts) {
        if (n >= 3 && (!top || n > top.n)) top = { co, n };
      }
      if (!top) return;
      bus.emit('thought', {
        id: randomUUID(),
        text: `You've been on ${top.co} for a while — want a market check?`,
        company: top.co,
        proactive: true,
        ts: Date.now(),
      });
    });
  }

  // 3) Profile refresh — opt-in, only if the profile module exposes it.
  if (profile && typeof profile.refresh === 'function' && cfg.profileRefreshMs > 0) {
    loop('profileRefresh', cfg.profileRefreshMs, jitter, () => profile.refresh());
  }

  // 4) Reasoning loop — observe → hypothesize → updateBelief across every
  //    registered agent. Persists beliefs to ~/.shadow/memory.db.
  const rcfg = (config && config.reasoning) || {};
  if (reason && rcfg.enabled !== false && rcfg.intervalMs > 0) {
    loop('reasoning', rcfg.intervalMs, jitter, async () => {
      await reason.tickAll({ MemoryRepo, suggest }, { bus });
    });
  }

  console.log('[proactive] scheduler online', {
    suggestionsMs: cfg.suggestionsMs,
    memoryScanMs: cfg.memoryScanMs,
    profileRefreshMs: cfg.profileRefreshMs,
    reasoningMs: rcfg.intervalMs || 0,
  });
}

function stop() {
  for (const t of timers) clearTimeout(t);
  timers = [];
  started = false;
}

module.exports = { start, stop };
